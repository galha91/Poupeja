import { buscar } from "./supermercados/comum";
import { EMBUTIVEIS, urlPermitido } from "./folhetos-embed";
import folhetosBase from "../public/folhetos.json";

/*
 * Os folhetos da Aldi, do Pingo Doce e do Intermarché vivem em subdomínios
 * (folhetos.aldi.pt/2026/s40/…) cujo endereço muda todas as semanas. A página
 * de folhetos de cada loja tem sempre o link do que está em vigor: lê-se de lá
 * em vez de o guardar à mão. Devolve [{ titulo, url }], o principal primeiro.
 */

const limpar = (u) => u.replace(/&amp;/g, "&").replace(/\/GetPDF\.ashx.*$/i, "/").replace(/\/{2,}$/, "/").split("?")[0];
const unicos = (lista) => { const v = new Set(); return lista.filter((f) => !v.has(f.url) && v.add(f.url)); };
const bonito = (slug) => { const t = slug.replace(/-/g, " ").trim(); return t.charAt(0).toUpperCase() + t.slice(1); };

function aldi(html) {
  const og = html.match(/property="og:url"\s+content="(https:\/\/folhetos\.aldi\.pt\/[^"]+)"/i)?.[1]
    || html.match(/https:\/\/folhetos\.aldi\.pt\/\d{4}\/[^"'\s<>]+/i)?.[0];
  return og ? [{ titulo: "Folheto desta semana", url: limpar(og) }] : [];
}

const PD_TITULOS = { "continental-lojas-grandes": "Portugal continental", madeira: "Madeira", acores: "Açores" };
function pingoDoce(html) {
  const achados = [...html.matchAll(/https:\/\/folhetos\.pingodoce\.pt\/\d{4}\/poupe-esta-semana\/([a-z-]+)\/(S\d+)\/?/gi)];
  const maxS = Math.max(0, ...achados.map((m) => parseInt(m[2].slice(1), 10)));
  const semana = achados.filter((m) => parseInt(m[2].slice(1), 10) === maxS || m[1] === "continental-lojas-grandes");
  const ordem = Object.keys(PD_TITULOS);
  return unicos(semana
    .sort((a, b) => ordem.indexOf(a[1]) - ordem.indexOf(b[1]))
    .map((m) => ({ titulo: PD_TITULOS[m[1]] || bonito(m[1]), url: limpar(m[0]) })));
}

function intermarche(html) {
  const achados = [...html.matchAll(/https:\/\/folhetos\.intermarche\.pt\/\d{4}\/[a-z]+\/semana-(\d+)\/folheto-(semanal|especial)-([a-z0-9-]+?)(?:-\d+-a-\d+-[a-z]+)?\/?(?=["'\s<>?])/gi)];
  const maxS = Math.max(0, ...achados.map((m) => parseInt(m[1], 10)));
  const semanais = achados.filter((m) => m[2] === "semanal" && parseInt(m[1], 10) === maxS)
    .sort((a, b) => ["super", "contact", "mini"].indexOf(a[3]) - ["super", "contact", "mini"].indexOf(b[3]));
  const especiais = achados.filter((m) => m[2] === "especial" && parseInt(m[1], 10) >= maxS - 1).slice(0, 3);
  const url = (m) => limpar(m[0].endsWith("/") ? m[0] : m[0] + "/");
  return unicos([
    ...semanais.map((m) => ({ titulo: `Semanal · ${bonito(m[3])}`, url: url(m) })),
    ...especiais.map((m) => ({ titulo: `Especial · ${bonito(m[3].replace(/-(super|contact|mini)$/, ""))}`, url: url(m) })),
  ]);
}

const LEITORES = { Aldi: aldi, "Pingo Doce": pingoDoce, "Intermarché": intermarche };

export async function resolverFolhetos(loja) {
  const cfg = EMBUTIVEIS[loja];
  if (!cfg) return [];
  let lista;
  if (cfg.tipo === "pagina") {
    const url = folhetosBase.folhetos.find((f) => f.loja === loja)?.url;
    lista = url ? [{ titulo: "Folheto desta semana", url }] : [];
  } else {
    lista = LEITORES[loja](await buscar(cfg.pagina));
  }
  return lista.filter((f) => urlPermitido(f.url));
}
