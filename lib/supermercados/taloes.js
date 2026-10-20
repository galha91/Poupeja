import { getSupabaseAdmin } from "../supabaseAdmin";
import { artigosDeTalao, termosBusca } from "../precosTalao";

/*
 * Preços de loja tirados dos talões dos utilizadores (ver lib/precosTalao).
 * Servem as cadeias que não publicam os preços todos online: o sortido fixo
 * do Lidl e o Mercadona. Cada artigo diz de que dia é o talão.
 */
const DIAS = 120;

export async function pesquisarTaloes(loja, q) {
  const admin = getSupabaseAdmin();
  const termos = termosBusca(q);
  if (!admin || !termos.length) return [];
  const desde = new Date(Date.now() - DIAS * 86400000).toISOString().slice(0, 10);
  let pedido = admin.from("precos_talao")
    .select("nome, nome_busca, preco, preco_unidade, unidade, ao_peso, data")
    .eq("loja", loja).gte("data", desde);
  for (const t of termos) pedido = pedido.ilike("nome_busca", `%${t}%`);
  const { data, error } = await pedido.order("data", { ascending: false }).limit(300);
  if (error) throw new Error(`talões: ${error.message}`);
  return artigosDeTalao(data);
}

/* Junta os preços dos talões aos de uma loja; se uma das partes falhar, fica a outra. */
export function comTaloes(loja) {
  return {
    ...loja,
    async pesquisar(q) {
      const [daLoja, deTaloes] = await Promise.allSettled([loja.pesquisar(q), pesquisarTaloes(loja.id, q)]);
      if (daLoja.status === "rejected" && deTaloes.status === "rejected") throw daLoja.reason;
      return [...(daLoja.value || []), ...(deTaloes.value || [])];
    },
  };
}

// O Mercadona não vende online em Portugal: só há os preços dos talões.
export const mercadona = { id: "mercadona", nome: "Mercadona", soTaloes: true, pesquisar: (q) => pesquisarTaloes("mercadona", q) };
