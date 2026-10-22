import { getSupabaseAdmin } from "./supabaseAdmin";
import { casosReduflacao } from "./reduflacao";
import { hojeLisboa } from "./seoFormato";

/*
 * Casos de reduflação para a página pública /reduflacao (só servidor).
 * Lê a vista produtos_embalagem_mudancas (só produtos com mais de um
 * tamanho; fechada a anon) e aplica as regras de casosReduflacao.
 * Sem Supabase configurado devolve lista vazia.
 */
const PAGINA = 1000;

export async function casosPublicos(hoje = hojeLisboa()) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  const linhas = [];
  for (let de = 0; de < 20000; de += PAGINA) {
    const { data, error } = await admin.from("produtos_embalagem_mudancas")
      .select("loja, produto_id, qtd, unidade, preco, nome, primeiro_dia, ultimo_dia")
      .order("loja").order("produto_id").order("qtd")
      .range(de, de + PAGINA - 1);
    if (error) { console.warn("reduflacao: falhou a ler:", error.message); return []; }
    linhas.push(...(data || []));
    if (!data || data.length < PAGINA) break;
  }
  return casosReduflacao(linhas, hoje);
}
