/*
 * Verifica se uma fotografia mostra mesmo a receita certa, com um modelo de
 * visão do Cloudflare Workers AI (Llama 3.2 Vision, na mesma conta grátis).
 *
 * O gerador às vezes troca ingredientes (rodelas de tomate no lugar do
 * chouriço do caldo verde, feijão preto no lugar de feijão-frade). Antes de
 * uma imagem entrar no site, o modelo descreve o que vê e diz se bate com a
 * descrição da receita (lib/receitas/fotoDescricoes). A revisão humana
 * continua: isto apanha os erros grosseiros antes dela.
 *
 *   node scripts/fotos-receitas/verificar.mjs [--ids a,b]   verifica as fotografias que já existem
 *
 * Escreve .fotos-geradas/verificacao.json com o resultado de cada uma.
 * Usado também pelo gerar.mjs, para cada imagem nova.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { DESCRICOES } from "../../lib/receitas/fotoDescricoes.js";

const MODELO = "@cf/meta/llama-3.2-11b-vision-instruct";
let licencaAceite = false;

function url(conta) {
  return `https://api.cloudflare.com/client/v4/accounts/${conta}/ai/run/${MODELO}`;
}

async function chamar(conta, token, corpo) {
  const res = await fetch(url(conta), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok && json?.success !== false, status: res.status, json };
}

/* A Meta pede que a licença do Llama seja aceite uma vez por conta, com o pedido "agree". */
async function aceitarLicenca(conta, token) {
  if (licencaAceite) return;
  await chamar(conta, token, { prompt: "agree" });
  licencaAceite = true;
}

/*
 * Devolve { corresponde: true|false|null, visto: "o que o modelo vê" }.
 * null quando não foi possível verificar (quota, erro): quem chama decide.
 */
export async function verificarImagem(buffer, receita, { conta, token }) {
  const desc = DESCRICOES[receita.id] || receita.nome;
  const jpeg = await sharp(buffer).resize(512, 384, { fit: "cover" }).jpeg({ quality: 80 }).toBuffer();
  const pergunta = [
    `This photo should show this dish: ${desc}.`,
    "Look only at the food. Does the photo clearly show this dish, with its main ingredients?",
    'Answer with JSON only: {"match": true or false, "seen": "a short description of the food in the photo"}.',
  ].join(" ");
  await aceitarLicenca(conta, token);
  const mensagens = [{ role: "user", content: pergunta }];
  // Primeiro com a imagem em base64; se o formato for recusado, como lista de bytes.
  let r = await chamar(conta, token, { messages: mensagens, image: jpeg.toString("base64"), max_tokens: 160 });
  if (!r.ok && r.status === 400) r = await chamar(conta, token, { messages: mensagens, image: [...jpeg], max_tokens: 160 });
  if (!r.ok) {
    const erro = JSON.stringify(r.json?.errors || r.json).slice(0, 160);
    return { corresponde: null, visto: "", erro, quota: r.status === 429 };
  }
  const texto = String(r.json?.result?.response ?? "");
  const m = texto.match(/\{[\s\S]*\}/);
  try {
    const j = JSON.parse(m ? m[0] : texto);
    return { corresponde: j.match === true || j.match === "true", visto: String(j.seen || "").slice(0, 200) };
  } catch {
    // Sem JSON válido: um "yes"/"no" no início ainda serve.
    const sim = /^\W*(yes|true)\b/i.test(texto), nao = /^\W*(no|false)\b/i.test(texto);
    return { corresponde: sim ? true : nao ? false : null, visto: texto.slice(0, 200) };
  }
}

/* Linha de comandos: verificar as fotografias que já estão no site. */
if (import.meta.url === `file://${process.argv[1]}`) {
  const { receitas } = await import("../../lib/receitas/motor.js");
  const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
  const args = process.argv.slice(2);
  const i = args.indexOf("--ids");
  const pedidos = i >= 0 ? args[i + 1].split(",") : null;
  const { CLOUDFLARE_ACCOUNT_ID: conta, CLOUDFLARE_API_TOKEN: token } = process.env;
  if (!conta || !token) { console.error("Faltam CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN."); process.exit(1); }
  const fotos = JSON.parse(readFileSync(path.join(raiz, "data/fotos-receitas.json"), "utf8")).fotos || {};
  const lista = receitas().filter((r) => fotos[r.id] && (!pedidos || pedidos.includes(r.id)));
  const resultado = {};
  for (const r of lista) {
    const buf = readFileSync(path.join(raiz, `public/receitas/fotos/${r.id}-480.webp`));
    const v = await verificarImagem(buf, r, { conta, token });
    if (v.quota) { console.warn("Quota grátis do dia esgotada; o resto fica para amanhã."); break; }
    resultado[r.id] = v;
    console.log(`${v.corresponde === true ? "ok " : v.corresponde === false ? "NÃO" : "?  "} ${r.id}: ${v.visto || v.erro || ""}`);
    await new Promise((ok) => setTimeout(ok, 800));
  }
  mkdirSync(path.join(raiz, ".fotos-geradas"), { recursive: true });
  writeFileSync(path.join(raiz, ".fotos-geradas/verificacao.json"), JSON.stringify(resultado, null, 2) + "\n");
  const nao = Object.entries(resultado).filter(([, v]) => v.corresponde === false).map(([id]) => id);
  console.log(`${Object.keys(resultado).length} verificadas; não correspondem: ${nao.length ? nao.join(", ") : "nenhuma"}.`);
}
