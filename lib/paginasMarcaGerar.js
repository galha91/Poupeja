import { getSupabaseAdmin } from "./supabaseAdmin";
import { gruposMarca } from "./seoMarcasDados";
import { resumosRecentes } from "./seoPrecosDados";
import { ofertasProduto, porMarca } from "./seoMarcas";
import { hojeLisboa, diasAntes } from "./seoFormato";
import { TABELA, propsProduto, propsMarca, marcasDoArtigo, propsIndiceMarcas, hashLinha } from "./paginasMarca";
import { ARTIGOS_SEO } from "./seoPrecos";

/*
 * Gera as páginas /produto e /marca e guarda-as em paginas_marca (ver
 * lib/paginasMarca). Corre uma vez por dia nos GitHub Actions
 * (pages/api/cron-paginas-marca via scripts/cron/correr.mjs): o trabalho
 * pesado sai da Vercel. Só escreve as linhas que mudaram.
 */
const PAGINA = 1000;
const LOTE = 100;
const MAX_DIAS_POR_GRUPO = 1000; // o mesmo teto que diasDoGrupo tinha

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

export async function gerarPaginasMarca({ hoje = hojeLisboa() } = {}) {
  const inicio = Date.now();
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase não configurado.");

  const [grupos, resumos] = await Promise.all([gruposMarca(hoje), resumosRecentes(hoje)]);
  if (!grupos.length) throw new Error("Nenhum grupo de produtos (produtos_marca vazio ou ilegível).");

  // Os preços diários de todos os produtos, de uma vez (em vez de uma
  // consulta por grupo), ordenados por dia como diasDoGrupo devolvia.
  const dias = await todos(() => admin.from("produtos_marca_dia")
    .select("loja, produto_id, dia, preco").gte("dia", diasAntes(hoje, 30))
    .order("dia").order("loja").order("produto_id"));
  const diasPorId = new Map();
  for (const d of dias) {
    if (!diasPorId.has(d.produto_id)) diasPorId.set(d.produto_id, []);
    diasPorId.get(d.produto_id).push(d);
  }

  const novas = [];
  for (const g of grupos) {
    const dados = ofertasProduto(g, hoje);
    if (!dados.ofertas.length) continue; // sem preços recentes: sem página
    const ids = [...new Set(g.itens.map((l) => l.produto_id))];
    const diasG = ids.flatMap((id) => diasPorId.get(id) || [])
      .sort((a, b) => String(a.dia).localeCompare(String(b.dia)))
      .slice(0, MAX_DIAS_POR_GRUPO);
    const props = propsProduto(g, grupos, diasG, resumos, hoje);
    novas.push({ tipo: "produto", slug: g.slug, props, indexavel: !!dados.indexavel, atualizado: dados.atualizado || null });
  }
  const marcas = porMarca(grupos);
  for (const m of marcas) {
    const props = propsMarca(m, marcas, hoje);
    if (props) novas.push({ tipo: "marca", slug: m.slug, props, indexavel: !!props.indexavel, atualizado: props.atualizado || null });
  }
  // Os produtos de marca de cada artigo (/precos/[artigo]) e o índice /marcas.
  for (const a of ARTIGOS_SEO) {
    novas.push({ tipo: "artigo", slug: a.slug, props: { marcas: marcasDoArtigo(grupos, a.q, hoje) }, indexavel: false, atualizado: null });
  }
  novas.push({ tipo: "indice", slug: "marcas", props: propsIndiceMarcas(grupos, hoje), indexavel: false, atualizado: null });
  for (const l of novas) l.hash = hashLinha(l);

  const existentes = await todos(() => admin.from(TABELA).select("tipo, slug, hash")
    .in("tipo", ["produto", "marca", "artigo", "indice"]).order("tipo").order("slug"));
  const hashAntes = new Map(existentes.map((l) => [`${l.tipo}|${l.slug}`, l.hash]));
  const mudaram = novas.filter((l) => hashAntes.get(`${l.tipo}|${l.slug}`) !== l.hash);
  const agoraIso = new Date().toISOString();

  for (let i = 0; i < mudaram.length; i += LOTE) {
    const lote = mudaram.slice(i, i + LOTE).map((l) => ({ ...l, gerado_em: agoraIso }));
    const { error } = await admin.from(TABELA).upsert(lote, { onConflict: "tipo,slug" });
    if (error) throw new Error(`upsert: ${error.message}`);
  }

  // Páginas que deixaram de existir (produto sem preços há mais de 3 dias…).
  const atuais = new Set(novas.map((l) => `${l.tipo}|${l.slug}`));
  const sair = existentes.filter((l) => !atuais.has(`${l.tipo}|${l.slug}`));
  for (const tipo of ["produto", "marca", "artigo", "indice"]) {
    const slugs = sair.filter((l) => l.tipo === tipo).map((l) => l.slug);
    for (let i = 0; i < slugs.length; i += LOTE) {
      const { error } = await admin.from(TABELA).delete().eq("tipo", tipo).in("slug", slugs.slice(i, i + LOTE));
      if (error) throw new Error(`delete: ${error.message}`);
    }
  }

  const contagem = {
    produtos: novas.filter((l) => l.tipo === "produto").length,
    marcas: novas.filter((l) => l.tipo === "marca").length,
  };
  // Por último: é o "selo" que diz às páginas que a cache serve.
  const { error } = await admin.from(TABELA).upsert({
    tipo: "meta", slug: "estado", props: { geradoEm: agoraIso, hoje, ...contagem },
    indexavel: false, atualizado: hoje, hash: "-", gerado_em: agoraIso,
  }, { onConflict: "tipo,slug" });
  if (error) throw new Error(`meta: ${error.message}`);

  return { ok: true, hoje, ...contagem, alteradas: mudaram.length, removidas: sair.length, segundos: Math.round((Date.now() - inicio) / 1000) };
}
