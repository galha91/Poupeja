import { getSupabaseAdmin } from "../supabaseAdmin";
import { melhoresPorLoja, valorComparacao } from "../comparacao";
import { resumirHistorico } from "../historicoPrecos";
import { detetarReduflacao } from "../reduflacao";

/*
 * Histórico do "Comparar preços": o melhor preço de cada loja, por
 * pesquisa e por dia (tabela precos_supermercado_historico). Serve para
 * dizer "o mais baixo dos últimos 30 dias foi X" — a pergunta seguinte de
 * quem vê um preço: "está mesmo barato, ou é o normal?".
 *
 * Alimentado por cada pesquisa feita na app e por um cron diário com as
 * pesquisas mais comuns, para os artigos habituais terem sempre história.
 */

const TABELA = "precos_supermercado_historico";

function hojeLisboa() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
}

export async function registar(r) {
  const admin = getSupabaseAdmin();
  if (!admin || !r?.produtos?.length) return;
  const { modo, melhores } = melhoresPorLoja(r);
  const dia = hojeLisboa();
  const linhas = Object.values(melhores).map((p) => ({
    q: r.q,
    dia,
    loja: p.loja,
    modo,
    unidade: modo === "embalagem" ? "embalagem" : p.nomeUnidade || p.unidade,
    valor: valorComparacao(p, modo),
    preco: p.preco,
    produto: String(p.nome || "").slice(0, 120),
    atualizado_em: new Date().toISOString(),
  })).filter((l) => l.valor > 0);
  if (!linhas.length) return;
  const { error } = await admin.from(TABELA).upsert(linhas, { onConflict: "q,dia,loja" });
  if (error) console.warn("historico: falhou a gravar:", error.message);
}

/*
 * { minimo: { valor, dia, loja, produto }, maximo: { valor, dia }, dias }
 * dos últimos 30 dias, na mesma unidade de agora (não se compara €/kg de
 * ontem com €/un de hoje). Mínimo e máximo do MELHOR preço de cada dia
 * (ver lib/historicoPrecos). Com menos de 3 dias de dados não há resumo.
 */
export async function resumo(q, unidade) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const desde = new Date(Date.now() - 30 * 86400000).toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
  const { data, error } = await admin
    .from(TABELA)
    .select("dia, loja, valor, produto")
    .eq("q", q)
    .eq("unidade", unidade)
    .gte("dia", desde)
    .order("valor", { ascending: true })
    .limit(300);
  if (error || !data?.length) return null;
  return resumirHistorico(data);
}

/*
 * Tamanhos de embalagem por produto (tabela produtos_embalagem), para o
 * aviso de reduflação. Uma linha por loja + id + quantidade: quando o
 * mesmo produto aparece com outra quantidade, nasce outra linha, e a
 * antiga fica com o último dia em que se viu aquele tamanho.
 *
 * O primeiro_dia não vai no upsert: entra pelo default na primeira vez e
 * nunca mais muda.
 */
const EMBALAGENS = "produtos_embalagem";

export async function registarEmbalagens(r) {
  const admin = getSupabaseAdmin();
  if (!admin || !r?.produtos?.length) return;
  const dia = hojeLisboa();
  const vistas = new Set();
  const linhas = [];
  for (const p of r.produtos) {
    if (!p.id || p.aoPeso || !(p.qtdBase > 0) || !(p.preco > 0) || !p.unidade) continue;
    const chave = `${p.loja}|${p.id}|${p.qtdBase}`;
    if (vistas.has(chave)) continue;
    vistas.add(chave);
    linhas.push({
      loja: p.loja, produto_id: String(p.id).slice(0, 80), qtd: p.qtdBase, unidade: p.unidade,
      preco: p.preco, nome: String(p.nome || "").slice(0, 120), ultimo_dia: dia,
    });
  }
  if (!linhas.length) return;
  const { error } = await admin.from(EMBALAGENS).upsert(linhas, { onConflict: "loja,produto_id,qtd" });
  if (error) console.warn("embalagens: falhou a gravar:", error.message);
}

/* Map "loja|id" → aviso de reduflação, para os produtos desta pesquisa. */
export async function reduflacaoDe(produtos = []) {
  const admin = getSupabaseAdmin();
  const ids = [...new Set(produtos.filter((p) => p.id && p.qtdBase > 0).map((p) => String(p.id).slice(0, 80)))];
  const out = new Map();
  if (!admin || !ids.length) return out;
  const { data, error } = await admin
    .from(EMBALAGENS)
    .select("loja, produto_id, qtd, unidade, preco, ultimo_dia")
    .in("produto_id", ids.slice(0, 150))
    .limit(1000);
  if (error || !data?.length) return out;
  const porProduto = new Map();
  for (const l of data) {
    const k = `${l.loja}|${l.produto_id}`;
    if (!porProduto.has(k)) porProduto.set(k, []);
    porProduto.get(k).push({ ...l, qtd: Number(l.qtd), preco: Number(l.preco) });
  }
  for (const [k, linhas] of porProduto) {
    const aviso = detetarReduflacao(linhas);
    if (aviso) out.set(k, aviso);
  }
  return out;
}
