// Métricas de produto sem cookies nem identificadores, para o /admin.
//
// Tudo o que chega aqui é uma contagem por dia: "o evento X aconteceu",
// "esta pesquisa não deu resultados", "esta página teve um erro", "esta
// página demorou N ms a mostrar o conteúdo". Nunca há um id de pessoa,
// um IP ou um URL completo — só o nome da ação e um detalhe curto.
//
// Funções puras, testadas em tests/metricas.test.mjs. Correm no browser
// (para não mandar lixo) e no servidor (que nunca confia no browser).

export const TIPOS = ["evento", "pesquisa", "pesquisa_vazia", "erro", "vital"];

// Os indicadores de velocidade do Google (Core Web Vitals) e os limites a
// partir dos quais contam como "bons" (os mesmos do PageSpeed).
export const VITAIS = { LCP: 2500, INP: 200, CLS: 0.1, FCP: 1800, TTFB: 800 };

// Parâmetros de um evento que dizem "qual variante": o primeiro que existir
// passa a ser o detalhe. Valores, nomes e datas nunca entram.
const PARAMS_DETALHE = ["screen_name", "content_type", "acao", "tipo", "origem", "method", "passo", "plano", "platform"];

const NOME = /^[a-z][a-z0-9_]{1,39}$/;

// Texto curto, sem dígitos longos (telefones, NIF, cartões) nem emails.
export function limparTexto(bruto, max = 60) {
  if (typeof bruto !== "string") return "";
  return bruto
    .replace(/\S+@\S+/g, "…")
    .replace(/\d{4,}/g, "…")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

// Termo de pesquisa normalizado: minúsculas, sem pontuação, até 40 letras.
export function termoPesquisa(bruto) {
  if (typeof bruto !== "string") return "";
  const t = bruto.toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N} ]+/gu, " ").replace(/\s+/g, " ").trim();
  if (t.length < 2 || /\d{4,}/.test(t)) return "";
  return t.slice(0, 40);
}

// Caminho de página sem query, ids nem números (agrupa /lista/abc123 em /lista/…).
export function paginaMetrica(bruto) {
  if (typeof bruto !== "string") return "";
  let c = bruto.split(/[?#]/)[0].toLowerCase();
  if (!c.startsWith("/")) return "";
  c = c.split("/").map(p => (/\d/.test(p) && p.length > 6 ? "…" : p)).join("/");
  if (c.length > 1) c = c.replace(/\/+$/, "");
  if (!/^\/[a-z0-9\-_/\[\]…]{0,79}$/.test(c)) return "";
  return c;
}

export function detalheEvento(params) {
  if (!params || typeof params !== "object") return "";
  for (const k of PARAMS_DETALHE) {
    const v = params[k];
    if (typeof v === "string" && v) return limparTexto(v, 40);
    if (typeof v === "boolean") return v ? "sim" : "nao";
  }
  return "";
}

// Valida um item vindo do browser. Devolve { tipo, chave, detalhe, valor, bom }
// ou null quando não serve.
export function normalizarItem(item) {
  if (!item || typeof item !== "object" || !TIPOS.includes(item.tipo)) return null;
  const { tipo } = item;

  if (tipo === "evento") {
    if (typeof item.chave !== "string" || !NOME.test(item.chave)) return null;
    return { tipo, chave: item.chave, detalhe: limparTexto(item.detalhe || "", 40), valor: 0, bom: false };
  }
  if (tipo === "pesquisa" || tipo === "pesquisa_vazia") {
    const chave = termoPesquisa(item.chave);
    return chave ? { tipo, chave, detalhe: "", valor: 0, bom: false } : null;
  }
  if (tipo === "erro") {
    const chave = paginaMetrica(item.chave);
    const detalhe = limparTexto(item.detalhe, 80);
    return chave && detalhe ? { tipo, chave, detalhe, valor: 0, bom: false } : null;
  }
  // vital
  const limite = VITAIS[item.chave];
  const valor = Number(item.valor);
  const pagina = paginaMetrica(item.detalhe);
  if (limite === undefined || !Number.isFinite(valor) || valor < 0 || valor > 120000 || !pagina) return null;
  return { tipo, chave: item.chave, detalhe: pagina, valor: Math.round(valor * 1000) / 1000, bom: valor <= limite };
}
