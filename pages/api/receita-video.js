import Anthropic from "@anthropic-ai/sdk";
import { registarCusto, custoUsd } from "../../lib/custos";
import { orcamentoIADisponivel, somarGasto } from "../../lib/limiteIA";
import { origemValida, excedeuLimite } from "../../lib/protecao-api";
import { primeiroLink, fonteDoLink, linkTikTok, idVideoTikTok, dadosPaginaTikTok, promptReceita, limparReceita, jsonDaResposta, dadosOembed, comCustos, MAX_TEXTO } from "../../lib/receitaVideo";
import { custoReceita } from "../../lib/seoPrecos";
import { lerPrecosIngredientes } from "../../lib/receitasCusto";

/*
 * POST { link } | { texto } | { imagem } → { receita, origem }.
 * imagem: data URL de uma fotografia já comprimida no browser (lib/imagem).
 *
 * Leve por pedido (regra 1 do CLAUDE.md): um pedido pequeno ao oEmbed do
 * TikTok e uma chamada ao Haiku; não lê nenhuma tabela. O mesmo vídeo
 * pedido de novo sai da memória da instância (regra 4). Custos: o mesmo
 * teto diário do lib/limiteIA, em separado ("receita-video").
 */
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ONDE = "receita-video";
const CACHE_MS = 12 * 60 * 60 * 1000;
const MAX_CACHE = 300;
const cache = new Map(); // chave → { ate, corpo }

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };
const MAX_BASE64 = 4 * 1024 * 1024;

async function comTempo(url, opcoes = {}, ms = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...opcoes, signal: ctrl.signal }); } finally { clearTimeout(t); }
}

/*
 * A legenda e o autor de um vídeo do TikTok. O TikTok responde mal a
 * pedidos sem cara de browser, por isso todos levam um User-Agent normal.
 * 1) segue os links curtos (vm./vt.tiktok.com, até 3 saltos, só dentro do TikTok);
 * 2) oEmbed público com o link final;
 * 3) se falhar, a própria página do vídeo (legenda no JSON de hidratação).
 */
const UA = { "user-agent": "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36", "accept-language": "pt-PT,pt;q=0.9" };

async function seguirLink(link) {
  let atual = link;
  for (let i = 0; i < 3; i++) {
    if (idVideoTikTok(atual) && !/^https:\/\/(vm|vt)\./.test(atual)) return atual;
    const r = await comTempo(atual, { redirect: "manual", headers: UA }).catch(() => null);
    const loc = r?.headers?.get("location");
    if (!loc) return atual;
    const prox = linkTikTok(new URL(loc, atual).href);
    if (!prox) return atual;
    atual = prox;
  }
  return atual;
}

async function legendaTikTok(link) {
  const final = await seguirLink(link);
  const id = idVideoTikTok(final);
  const candidatos = [...new Set([final, link, id ? `https://www.tiktok.com/@/video/${id}` : null, id ? `https://www.tiktok.com/@tiktok/video/${id}` : null].filter(Boolean))];
  for (const c of candidatos) {
    const r = await comTempo(`https://www.tiktok.com/oembed?url=${encodeURIComponent(c)}`, { headers: { ...UA, accept: "application/json" } }).catch(() => null);
    const dados = r?.ok ? dadosOembed(await r.json().catch(() => null)) : null;
    if (dados) return { ...dados, link: id ? final : c };
    console.warn("receita-video: oEmbed sem dados", r?.status ?? "falhou", c.slice(0, 80));
  }
  if (id) {
    const pagina = /\/@[^/]+\/(video|photo)\//.test(final) ? final : `https://www.tiktok.com/@/video/${id}`;
    const r = await comTempo(pagina, { headers: { ...UA, accept: "text/html" } }, 8000).catch(() => null);
    const html = r?.ok ? (await r.text().catch(() => "")).slice(0, 3_000_000) : "";
    const dados = dadosPaginaTikTok(html);
    if (dados) return { ...dados, link: final };
    console.warn("receita-video: página sem legenda", r?.status ?? "falhou", html.length);
  }
  console.warn("receita-video: TikTok sem legenda", link.slice(0, 80), "→", final.slice(0, 120));
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!origemValida(req)) return res.status(403).json({ erro: "Origem não autorizada." });
  if (excedeuLimite(req, ONDE, 5) || excedeuLimite(req, `${ONDE}-hora`, 20, 60 * 60_000)) {
    return res.status(429).json({ erro: "Demasiados pedidos. Aguarda um minuto e tenta de novo." });
  }

  if (typeof req.body?.imagem === "string") return daFotografia(req, res);

  const entrada = typeof req.body?.link === "string" ? req.body.link.trim().slice(0, 600)
    : typeof req.body?.texto === "string" ? req.body.texto.trim().slice(0, MAX_TEXTO + 200) : "";
  if (entrada.length < 8) return res.status(400).json({ erro: "Cola o link do vídeo ou o texto da receita." });

  // Um link sozinho: só o do TikTok se lê automaticamente.
  const link = primeiroLink(entrada);
  // "Vê este vídeo de … no TikTok! https://vm.tiktok.com/…": o texto à volta de um link do TikTok é o da partilha.
  const resto = link ? entrada.replace(link, "").trim().length : Infinity;
  const soLink = link && (resto < 40 || (linkTikTok(link) && resto < 250));
  let textoReceita = entrada;
  let origem = null;
  if (soLink) {
    const tiktok = linkTikTok(link);
    if (!tiktok) {
      const fonte = fonteDoLink(link);
      const onde = { instagram: "do Instagram", youtube: "do YouTube" }[fonte] || "dessa página";
      return res.status(200).json({ erro: `Ainda não consigo abrir links ${onde}. Copia o texto da descrição da receita e cola-o aqui.`, pedirTexto: true });
    }
    const chave = `l:${tiktok}`;
    const guardado = cache.get(chave);
    if (guardado && guardado.ate > Date.now()) return res.status(200).json(guardado.corpo);
    const dados = await legendaTikTok(tiktok).catch(() => null);
    if (!dados) return res.status(200).json({ erro: "Não consegui ler esse vídeo. Se for público, tira uma captura de ecrã da descrição e usa o separador Fotografia, ou cola aqui o texto.", pedirTexto: true });
    textoReceita = dados.legenda;
    origem = { link: dados.link, autor: dados.autor, autorUrl: dados.autorUrl, fonte: "tiktok" };
  }

  const chave = origem ? `l:${linkTikTok(link)}` : `t:${textoReceita}`;
  const guardado = cache.get(chave);
  if (guardado && guardado.ate > Date.now()) return res.status(200).json(guardado.corpo);

  if (!(await orcamentoIADisponivel(ONDE))) {
    return res.status(429).json({ erro: "A importação de receitas está em pausa por hoje. Volta amanhã." });
  }

  try {
    const receita = await pedirReceita(promptReceita(textoReceita));
    const corpo = receita
      ? { receita: await comPrecos(receita), origem }
      : { erro: origem ? "A descrição deste vídeo não traz a receita (às vezes só está dita no vídeo). Se a tiveres por escrito, cola-a aqui." : "Não encontrei uma receita neste texto.", pedirTexto: !!origem };
    if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
    cache.set(chave, { ate: Date.now() + CACHE_MS, corpo });
    return res.status(200).json(corpo);
  } catch (err) {
    console.error("receita-video:", err?.message);
    return res.status(500).json({ erro: "Não consegui ler a receita agora. Tenta de novo daqui a pouco." });
  }
}

async function pedirReceita(conteudo) {
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{ role: "user", content: conteudo }],
  });
  await registarCusto(ONDE, msg.model, msg.usage);
  somarGasto(ONDE, custoUsd(msg.model, msg.usage));
  return limparReceita(jsonDaResposta(msg.content[0]?.text));
}

/* Custo e trocas com os preços de hoje: uma linha pequena, horas em memória. */
async function comPrecos(receita) {
  const resumos = await lerPrecosIngredientes().catch(() => null);
  return comCustos(receita, resumos, custoReceita);
}

/* Fotografia de uma receita (livro, revista, ecrã): o mesmo modelo, com a imagem. */
async function daFotografia(req, res) {
  const m = req.body.imagem.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return res.status(400).json({ erro: "Formato de imagem inválido. Usa JPEG, PNG ou WebP." });
  if (m[2].length > MAX_BASE64) return res.status(413).json({ erro: "Imagem demasiado grande." });
  if (!(await orcamentoIADisponivel(ONDE))) {
    return res.status(429).json({ erro: "A importação de receitas está em pausa por hoje. Volta amanhã." });
  }
  try {
    const receita = await pedirReceita([
      { type: "image", source: { type: "base64", media_type: m[1] === "image/jpg" ? "image/jpeg" : m[1], data: m[2] } },
      { type: "text", text: promptReceita() },
    ]);
    if (!receita) return res.status(200).json({ erro: "Não encontrei uma receita nesta fotografia. Tenta com a página inteira e bem iluminada." });
    return res.status(200).json({ receita: await comPrecos(receita), origem: { fonte: "foto" } });
  } catch (err) {
    console.error("receita-video (foto):", err?.message);
    return res.status(500).json({ erro: "Não consegui ler a fotografia agora. Tenta de novo daqui a pouco." });
  }
}
