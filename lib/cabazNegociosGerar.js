import { getSupabaseAdmin } from "./supabaseAdmin";
import { nomeCadeia } from "./cobertura";
import { hojeLisboa, diasAntes } from "./seoFormato";
import { TIPO, SLUG, FRESCO_DIAS, montarCabazNegocios } from "./cabazNegocios";
import config from "../data/cabaz-negocios.json";

/*
 * Calcula o cabaz de exemplo do PoupeJá Negócios (ver lib/cabazNegocios) e
 * guarda-o em paginas_marca. Não vai a nenhuma loja: lê do histórico os
 * preços dos últimos dias de 20 artigos em 3 lojas (menos de 300 linhas).
 *
 * Corre nos GitHub Actions, uma vez por dia, no fim do cron-paginas-marca.
 * Um resultado que não dê para comparar não apaga o anterior: a validade de
 * 3 dias trata de o esconder se a falha durar.
 */
export async function gerarCabazNegocios({ hoje = hojeLisboa() } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase não configurado.");
  const { data, error } = await admin
    .from("precos_supermercado_historico")
    .select("q, loja, valor, dia")
    .in("q", config.artigos.map((a) => a.q))
    .in("loja", config.lojas)
    .gte("dia", diasAntes(hoje, FRESCO_DIAS));
  if (error) throw new Error(`cabaz negócios: ${error.message}`);

  const cabaz = montarCabazNegocios(config, data || [], nomeCadeia);
  if (!cabaz) return { ok: false, motivo: "sem artigos suficientes para comparar" };

  const agoraIso = new Date().toISOString();
  const { error: e2 } = await admin.from("paginas_marca").upsert({
    tipo: TIPO, slug: SLUG, props: { ...cabaz, geradoEm: agoraIso },
    indexavel: false, atualizado: hoje, hash: "-", gerado_em: agoraIso,
  }, { onConflict: "tipo,slug" });
  if (e2) throw new Error(`cabaz negócios: ${e2.message}`);
  return { ok: true, loja: cabaz.barata.loja, total: cabaz.barata.total, artigos: cabaz.itens.length, empate: cabaz.empate };
}
