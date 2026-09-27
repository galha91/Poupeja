import { continente, pingoDoce, auchan } from "./sfcc";
import { lidl } from "./lidl";
import { completarUnidade } from "./comum";

/*
 * Pesquisa o mesmo artigo em todos os supermercados ao mesmo tempo e
 * devolve uma lista só, comparável pelo preço por kg / L / unidade.
 *
 * Porque em direto e não uma base de dados copiada todas as noites: os
 * preços online mudam várias vezes por semana e cada cadeia tem dezenas de
 * milhares de artigos. Pesquisar só o que alguém procura, com cache de
 * umas horas (na rota), dá preços do dia sem andar a copiar sites inteiros.
 */

export const LOJAS = [continente, pingoDoce, auchan, lidl];

/* ── Relevância ──
   A pesquisa de cada loja é generosa: "laranja" traz sumos, gelatinas e,
   no Lidl, peras. Para comparar preços só interessa o artigo em si. */

const semAcentos = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Singular aproximado, o suficiente para "laranjas" = "laranja" e
// "limões" = "limão". Não é gramática: é só para comparar palavras.
export function raiz(palavra) {
  let w = semAcentos(palavra);
  if (w.length <= 3) return w;
  if (w.endsWith("oes") || w.endsWith("aes")) return w.slice(0, -3) + "ao";
  if (w.endsWith("ais")) return w.slice(0, -2) + "l";
  if (w.endsWith("eis")) return w.slice(0, -3) + "el";
  if (w.endsWith("ns")) return w.slice(0, -2) + "m";
  if (/[rsz]es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith("s")) return w.slice(0, -1);
  return w;
}

const PALAVRAS_VAZIAS = new Set(["de", "da", "do", "das", "dos", "e", "com", "sem", "a", "o", "em", "para"]);

export function palavras(txt) {
  return semAcentos(String(txt || ""))
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !PALAVRAS_VAZIAS.has(w))
    .map(raiz);
}

/*
 * 2 = é mesmo isto ("Laranja do Algarve" para "laranjas")
 * 1 = contém tudo, mas é outra coisa ("Sumo de Laranja")
 * 0 = não tem a ver
 */
export function relevancia(nome, termos) {
  if (!termos.length) return 0;
  const p = palavras(nome);
  const temTodas = termos.every((t) => p.some((w) => w === t || (t.length >= 4 && w.startsWith(t))));
  if (!temTodas) return 0;
  return p[0] === termos[0] ? 2 : 1;
}

export async function pesquisarTudo(q, lojas = LOJAS) {
  const termos = palavras(q);
  const inicio = Date.now();

  const respostas = await Promise.allSettled(
    lojas.map(async (loja) => {
      const t0 = Date.now();
      const itens = await loja.pesquisar(q);
      return { loja, itens, ms: Date.now() - t0 };
    }),
  );

  const estado = [];
  const produtos = [];
  respostas.forEach((r, i) => {
    const loja = lojas[i];
    if (r.status === "rejected") {
      estado.push({ id: loja.id, nome: loja.nome, ok: false, erro: String(r.reason?.message || r.reason).slice(0, 120) });
      return;
    }
    let n = 0;
    for (const bruto of r.value.itens) {
      if (!bruto?.nome || !(bruto.preco > 0)) continue;
      const rel = relevancia(bruto.nome, termos);
      if (!rel) continue;
      produtos.push({ loja: loja.id, lojaNome: loja.nome, onde: "online", ...completarUnidade(bruto), relevancia: rel });
      n++;
    }
    estado.push({ id: loja.id, nome: loja.nome, ok: true, total: n, ms: r.value.ms });
  });

  return { q, termos, produtos: ordenar(produtos), lojas: estado, ms: Date.now() - inicio };
}

/*
 * Ordem: primeiro o que é mesmo o artigo procurado; dentro disso, a
 * unidade mais comum (não se compara €/kg com €/un) e o preço por
 * unidade. O resto vem depois, pela mesma lógica.
 */
export function ordenar(produtos) {
  const contagem = {};
  for (const p of produtos) if (p.relevancia === 2) contagem[p.unidade] = (contagem[p.unidade] || 0) + 1;
  const principal = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0]?.[0];
  const peso = (p) => (p.relevancia === 2 ? 0 : 2) + (p.unidade === principal ? 0 : 1);
  return [...produtos].sort((a, b) => peso(a) - peso(b) || a.precoUnidade - b.precoUnidade || a.preco - b.preco);
}
