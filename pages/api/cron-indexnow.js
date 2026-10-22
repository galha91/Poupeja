import { bearerValido } from "../../lib/seguranca";
import { listarMunicipios, DISTRITOS_SLUGS } from "../../lib/municipios";
import { LOJAS_SLUGS, RECEITAS_SLUGS } from "../../lib/seo-slugs";
import { montarPedido, ENDPOINT_INDEXNOW } from "../../lib/indexnow";
import { URL_SITE } from "../../lib/site";
import { paginasPrecos, paginasMarcas } from "../../lib/sitemap";
import { TIPOS_PAGINA } from "../../lib/combustivelTipo";
import dadosApoios from "../../public/apoios.json";
import dadosPrazos from "../../data/prazos-estado.json";
import { slugApoio, slugPrazo } from "../../lib/seoEstado";

/*
 * Aviso diário IndexNow (Vercel Cron, ver vercel.json) — depois do cron
 * dos preços, para os motores verem as páginas já com os preços do dia.
 *
 * Todos os dias: as páginas de combustível e as de preços de supermercado
 * indexáveis (mudam todos os dias).
 * À quinta-feira, dia dos folhetos novos: também folhetos, receitas e as
 * páginas fixas. O protocolo pede que só se avise o que mudou; avisar
 * sempre tudo leva a que os avisos passem a ser ignorados.
 *
 * Os concelhos são os mesmos do sitemap (os 40 com mais postos); os
 * outros chegam pelas páginas de distrito.
 */
const MAX_CONCELHOS = 40;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!bearerValido(req.headers.authorization, process.env.CRON_SECRET)) {
    return res.status(401).json({ erro: "Não autorizado." });
  }

  const caminhos = [
    "/combustiveis", "/combustiveis/esta-semana",
    ...TIPOS_PAGINA.map(t => `/combustiveis/${t.slug}`),
    ...DISTRITOS_SLUGS.map(d => `/combustiveis/distrito/${d.slug}`),
  ];
  try {
    const concelhos = (await listarMunicipios()).slice(0, MAX_CONCELHOS);
    caminhos.push(...concelhos.map(m => `/combustiveis/${m.slug}`));
  } catch (e) {
    console.warn("cron-indexnow: sem lista de concelhos:", e.message);
  }

  try {
    const [precos, marcas] = await Promise.all([paginasPrecos(), paginasMarcas().catch(() => [])]);
    caminhos.push(...precos.map(p => p.path), ...marcas.map(p => p.path));
  } catch (e) {
    console.warn("cron-indexnow: sem páginas de preços:", e.message);
  }

  const quinta = new Date().getUTCDay() === 4;
  if (quinta || req.query.todas === "1") {
    caminhos.push(
      "/", "/folhetos", "/receitas", "/apoios",
      ...LOJAS_SLUGS.map(l => `/folhetos/${l.slug}`),
      ...RECEITAS_SLUGS.map(r => `/receitas/${r.slug}`),
      ...(dadosApoios.apoios || []).map(a => `/apoios/${slugApoio(a)}`),
      "/prazos", ...dadosPrazos.prazos.map(p => `/prazos/${slugPrazo(p)}`),
      "/euribor", "/euribor/3-meses", "/euribor/6-meses", "/euribor/12-meses", "/credito-habitacao", "/garantias",
    );
  }

  const corpo = montarPedido(URL_SITE, caminhos);
  try {
    const r = await fetch(ENDPOINT_INDEXNOW, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(corpo),
    });
    // 200 = aceite; 202 = aceite, a chave ainda está a ser verificada (normal no 1.º dia).
    if (!r.ok) {
      const txt = (await r.text().catch(() => "")).slice(0, 300);
      console.error(`cron-indexnow: ${r.status} ${txt}`);
      return res.status(502).json({ erro: `IndexNow respondeu ${r.status}`, enviados: 0 });
    }
    return res.status(200).json({ ok: true, estado: r.status, enviados: corpo.urlList.length });
  } catch (e) {
    console.error("cron-indexnow:", e.message);
    return res.status(502).json({ erro: e.message, enviados: 0 });
  }
}
