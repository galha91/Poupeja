import { getSupabaseAdmin } from "../supabaseAdmin";
import { termosBusca } from "../precosTalao";

/*
 * Pesquisa nos catálogos guardados (tabela catalogo_precos), para as lojas
 * cuja pesquisa não se pode usar no momento mas cujas páginas de categoria
 * se podem ler de noite — hoje, o El Corte Inglés (ver lib/supermercados/eci
 * e /api/cron-catalogo-eci). Só entram preços vistos nos últimos DIAS: se a
 * leitura noturna parar, os preços velhos deixam de aparecer em vez de
 * ficarem a enganar.
 */
const DIAS = 3;

export const linhaParaArtigo = (l) => ({
  id: l.id,
  nome: l.nome,
  marca: null,
  quantidade: l.quantidade || null,
  aoPeso: !!l.ao_peso,
  preco: Number(l.preco),
  precoAntigo: l.preco_antigo != null ? Number(l.preco_antigo) : null,
  precoUnidade: l.preco_unidade != null ? Number(l.preco_unidade) : null,
  unidade: l.unidade || null,
  promo: l.preco_antigo != null ? "Promoção" : null,
  url: l.url || null,
  imagem: l.imagem || null,
});

export async function pesquisarCatalogo(loja, q) {
  const admin = getSupabaseAdmin();
  const termos = termosBusca(q);
  if (!admin) throw new Error("catálogo: sem ligação à base de dados");
  if (!termos.length) return [];
  const desde = new Date(Date.now() - DIAS * 86400000).toISOString().slice(0, 10);
  let pedido = admin.from("catalogo_precos")
    .select("id, nome, preco, preco_antigo, preco_unidade, unidade, quantidade, ao_peso, url, imagem")
    .eq("loja", loja).gte("visto_em", desde);
  for (const t of termos) pedido = pedido.ilike("nome_busca", `%${t}%`);
  const { data, error } = await pedido.limit(60);
  if (error) throw new Error(`catálogo: ${error.message}`);
  if (!data?.length) {
    // Nada encontrado: ou o artigo não existe, ou o catálogo não foi lido.
    // No segundo caso a loja tem de aparecer como falhada, não como "0".
    const { count } = await admin.from("catalogo_precos").select("id", { count: "exact", head: true })
      .eq("loja", loja).gte("visto_em", desde);
    if (!count) throw new Error("catálogo sem preços recentes");
  }
  return (data || []).map(linhaParaArtigo);
}

export const elCorteIngles = {
  id: "elcorteingles",
  nome: "El Corte Inglés",
  // Não há site a verificar no momento: quem vigia é o próprio cron, que
  // regista o erro em catalogo_cursor.
  semVerificacao: true,
  pesquisar: (q) => pesquisarCatalogo("elcorteingles", q),
};
