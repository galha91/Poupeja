import { bearerValido } from "../../lib/seguranca";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { buscar } from "../../lib/supermercados/comum";
import { lerPaginaEci, proximaPaginaEci, urlPaginaEci, SECOES_ECI } from "../../lib/supermercados/eci";
import { nomeBusca } from "../../lib/precosTalao";

/*
 * Catálogo do El Corte Inglés, lido de noite (Vercel Cron, ver vercel.json).
 *
 * O catálogo tem perto de mil páginas e cada execução só tem 60 s. O plano
 * da Vercel só deixa os crons correrem uma vez por dia, por isso cada
 * execução, ao acabar, chama a seguinte, que continua onde esta parou
 * (tabela catalogo_cursor) — uma cadeia de execuções, uma de cada vez. O
 * cron das 4h retoma se a cadeia tiver parado a meio. Uma página de cada
 * vez, com pausa entre elas: o ritmo de uma pessoa a folhear.
 *
 * No primeiro passo de cada dia o cursor volta ao início; quando a volta
 * fica completa, apagam-se os artigos que já não aparecem há dias
 * (saíram do catálogo). Se o site recusar (403/429), pára e regista o erro
 * — não se tenta contornar.
 */

const LOJA = "elcorteingles";
const ORCAMENTO_MS = 45_000;
const PAUSA_MS = 800;
const GUARDAR_DIAS = 3;
// Se o cursor mexeu há menos disto, há uma execução a correr: não se abre
// uma segunda cadeia em paralelo.
const OCUPADO_MS = 70_000;

const hoje = () => new Date().toISOString().slice(0, 10);

export default async function handler(req, res) {
  if (!bearerValido(req.headers.authorization, process.env.CRON_SECRET)) {
    return res.status(401).json({ erro: "Não autorizado." });
  }
  const admin = getSupabaseAdmin();
  if (!admin) return res.status(500).json({ erro: "Sem base de dados." });

  const dia = hoje();
  const { data: atual } = await admin.from("catalogo_cursor").select("*").eq("loja", LOJA).maybeSingle();
  let cursor = atual?.dia === dia
    ? atual
    : { loja: LOJA, dia, seccao: 0, pagina: 1, total_paginas: null, concluido: false, produtos: 0, erro: null };
  if (cursor.concluido) return res.status(200).json({ ok: true, concluido: true, produtos: cursor.produtos });
  const outroACorrer = atual?.dia === dia && Date.now() - Date.parse(atual.atualizado_em) < OCUPADO_MS;
  if (outroACorrer && req.query.cadeia !== "1") return res.status(200).json({ ok: true, ocupado: true });
  await admin.from("catalogo_cursor").upsert({ ...cursor, atualizado_em: new Date().toISOString() });

  const limite = Date.now() + ORCAMENTO_MS;
  let paginas = 0;
  let erro = null;
  while (!cursor.concluido && Date.now() < limite) {
    const url = urlPaginaEci(SECOES_ECI[cursor.seccao], cursor.pagina);
    let lida;
    try {
      lida = lerPaginaEci(await buscar(url));
    } catch (e) {
      erro = `${url}: ${String(e?.message || e).slice(0, 150)}`;
      // Recusa do site: pára por hoje. Outra falha (rede, página que deixou
      // de existir): salta essa página e segue.
      if (/HTTP (403|429)/.test(erro)) break;
      lida = { produtos: [], totalPaginas: cursor.pagina > 1 ? cursor.total_paginas : null, falhou: true };
    }
    paginas++;
    if (lida.produtos.length) {
      const linhas = lida.produtos.map((p) => ({
        loja: LOJA,
        id: p.id,
        nome: p.nome.slice(0, 200),
        nome_busca: nomeBusca(`${p.nome} ${p.quantidade || ""}`).slice(0, 250),
        preco: p.preco,
        preco_antigo: p.precoAntigo,
        preco_unidade: p.precoUnidade,
        unidade: p.unidade,
        quantidade: p.quantidade,
        ao_peso: p.aoPeso,
        url: p.url,
        imagem: p.imagem,
        visto_em: dia,
      }));
      const { error } = await admin.from("catalogo_precos").upsert(linhas, { onConflict: "loja,id" });
      if (error) { erro = `gravar: ${error.message}`; break; }
    }
    const prox = proximaPaginaEci(cursor, lida.totalPaginas, !lida.produtos.length && !lida.falhou);
    cursor = { ...cursor, ...prox, total_paginas: lida.totalPaginas ?? cursor.total_paginas, produtos: cursor.produtos + lida.produtos.length };
    if (!cursor.concluido) await new Promise((ok) => setTimeout(ok, PAUSA_MS));
  }

  await admin.from("catalogo_cursor").upsert({ ...cursor, erro, atualizado_em: new Date().toISOString() });
  // Falta catálogo e esta execução avançou sem erro: chama a seguinte. Só
  // se espera que o pedido chegue; a seguinte corre por conta própria.
  if (!cursor.concluido && !erro && paginas > 0) {
    await fetch(`https://${req.headers.host}/api/cron-catalogo-eci?cadeia=1`, {
      headers: { authorization: req.headers.authorization },
      signal: AbortSignal.timeout(3000),
    }).catch(() => {});
  }
  if (cursor.concluido) {
    const antes = new Date(Date.now() - GUARDAR_DIAS * 86400000).toISOString().slice(0, 10);
    await admin.from("catalogo_precos").delete().eq("loja", LOJA).lt("visto_em", antes);
  }
  console.log(`cron-catalogo-eci: ${paginas} páginas, secção ${cursor.seccao}, página ${cursor.pagina}, ${cursor.produtos} artigos hoje${erro ? `, erro: ${erro}` : ""}`);
  return res.status(200).json({ ok: !erro, paginas, seccao: cursor.seccao, pagina: cursor.pagina, produtos: cursor.produtos, concluido: cursor.concluido, erro });
}
