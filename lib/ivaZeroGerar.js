import { getSupabaseAdmin } from "./supabaseAdmin";
import { nomeCadeia } from "./cobertura";
import { hojeLisboa } from "./seoFormato";
import {
  TIPO, SLUG_IVA_ZERO, INICIO, TODAS_Q, fase, janelaReferencia, referencias, precosAtuais, comparar, juntarSerie, somarDias,
} from "./ivaZero";

/*
 * Calcula a página /iva-zero (lib/ivaZero) e guarda-a numa linha de
 * paginas_marca. Corre nos GitHub Actions, dentro do cron-paginas-marca,
 * uma vez por dia. Não vai a loja nenhuma: lê os preços diários que o
 * histórico já guardou (produtos_marca_dia), só dos produtos das
 * categorias de alimentos essenciais e só dos dias de que precisa.
 *
 * Leituras por dia: a lista de produtos dessas categorias (~1 500 linhas)
 * e os seus preços de 14 dias (antes do início) ou de 3 dias (depois:
 * a referência já ficou guardada e não se volta a ler). Fica bem dentro
 * do orçamento de egress do CLAUDE.md.
 */
const PAGINA = 1000;
const LOTE_IDS = 150;

async function todos(consulta) {
  const linhas = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await consulta().range(de, de + PAGINA - 1);
    if (error) throw new Error(error.message);
    linhas.push(...(data || []));
    if (!data || data.length < PAGINA) break;
  }
  return linhas;
}

async function precosDe(admin, ids, desde, ate) {
  const linhas = [];
  for (let i = 0; i < ids.length; i += LOTE_IDS) {
    const lote = ids.slice(i, i + LOTE_IDS);
    linhas.push(...await todos(() => admin.from("produtos_marca_dia")
      .select("loja, produto_id, dia, preco").in("produto_id", lote).gte("dia", desde).lte("dia", ate)
      .order("dia").order("loja").order("produto_id")));
  }
  return linhas;
}

export async function gerarIvaZero({ hoje = hojeLisboa() } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase não configurado.");

  const { data: linha, error: e0 } = await admin.from("paginas_marca").select("props").eq("tipo", TIPO).eq("slug", SLUG_IVA_ZERO).maybeSingle();
  if (e0) throw new Error(e0.message);
  const antes = linha?.props || {};

  const produtos = await todos(() => admin.from("produtos_marca")
    .select("loja, produto_id, q, nome, marca").in("q", TODAS_Q).gte("ultimo_dia", somarDias(hoje, -14))
    .order("loja").order("produto_id"));
  const ids = [...new Set(produtos.map((p) => p.produto_id))];
  if (!ids.length) return { ok: false, motivo: "sem produtos das categorias" };

  const f = fase(hoje);
  const janela = janelaReferencia(hoje);
  // Depois do início a referência fica a que foi calculada com a janela
  // completa antes de 1 de janeiro; só se calcula de novo se ainda não existir.
  const refFixa = f === "depois" && antes.referencia && antes.janela?.ate === janela.ate ? antes.referencia : null;
  const desde = refFixa ? somarDias(hoje, -2) : janela.desde;
  const dias = await precosDe(admin, ids, desde, hoje);

  const ref = refFixa || referencias(dias, janela);
  const atuais = precosAtuais(dias, hoje);
  const resumo = comparar(produtos, ref, atuais, nomeCadeia);
  if (!resumo) return { ok: false, motivo: "sem produtos com referência e preço atual" };

  // A série de antes do início não se mistura com a de depois.
  const serieAntes = (antes.serie || []).filter((p) => (f === "depois" ? p.dia >= INICIO : p.dia < INICIO));
  const serie = juntarSerie(serieAntes, resumo, hoje);
  const agoraIso = new Date().toISOString();
  const props = { fase: f, dia: hoje, janela, referencia: ref, resumo, serie, geradoEm: agoraIso };
  const { error } = await admin.from("paginas_marca").upsert({
    tipo: TIPO, slug: SLUG_IVA_ZERO, props, indexavel: false, atualizado: hoje, hash: "-", gerado_em: agoraIso,
  }, { onConflict: "tipo,slug" });
  if (error) throw new Error(`iva-zero: ${error.message}`);
  return { ok: true, fase: f, produtos: resumo.total.n, varMedia: resumo.total.varMedia, desceu: resumo.total.desceu };
}
