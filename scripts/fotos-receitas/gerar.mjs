/*
 * Gera as fotografias das receitas que ainda não têm, de graça, com o
 * Cloudflare Workers AI (modelo FLUX.1 [schnell], licença Apache 2.0).
 *
 *   CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_API_TOKEN=… \
 *     node scripts/fotos-receitas/gerar.mjs [--quantas 30] [--ids a,b] [--pasta dir]
 *
 * Custo: nenhum. A conta grátis do Cloudflare dá 10 000 "neurons" por dia;
 * cada imagem (1024×1024, 6 passos) gasta cerca de 77, ou seja ~130 por dia.
 * Quando a quota do dia acaba, o script pára e guarda o que já fez.
 *
 * Usa os pedidos de lib/receitas/fotoPrompt (o estilo único do PoupeJá).
 * O modelo no Cloudflare não aceita semente: cada corrida dá uma imagem
 * nova, por isso só se geram as receitas que ainda não têm. No fim
 * chama o processar.mjs, que prepara os 5 tamanhos e atualiza o manifesto.
 * Corre no GitHub Actions (.github/workflows/fotos-receitas.yml).
 */
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { receitas } from "../../lib/receitas/motor.js";
import { promptDaFoto } from "../../lib/receitas/fotoPrompt.js";
import { verificarImagem } from "./verificar.mjs";

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const args = process.argv.slice(2);
const opcao = (nome, def) => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : def; };
const quantas = Math.max(1, Math.min(150, Number(opcao("--quantas", 30)) || 30));
const pasta = path.resolve(opcao("--pasta", path.join(raiz, ".fotos-geradas")));
const idsPedidos = (opcao("--ids", "") || "").split(",").map((s) => s.trim()).filter(Boolean);
// Verificação com o modelo de visão (verificar.mjs): ligada por omissão.
const verificar = !args.includes("--sem-verificar");

const { CLOUDFLARE_ACCOUNT_ID: conta, CLOUDFLARE_API_TOKEN: token } = process.env;
if (!conta || !token) { console.error("Faltam CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN."); process.exit(1); }
const URL_MODELO = `https://api.cloudflare.com/client/v4/accounts/${conta}/ai/run/@cf/black-forest-labs/flux-1-schnell`;

// Primeiro o Natal, depois as receitas pela ordem do livro.
const PRIMEIRO = ["bacalhau-gomes-sa", "bacalhau-bras", "rabanadas", "arroz-doce", "aletria"];
const manifesto = JSON.parse(readFileSync(path.join(raiz, "data/fotos-receitas.json"), "utf8")).fotos || {};
const todas = receitas();
const porId = new Map(todas.map((r) => [r.id, r]));
const fila = (idsPedidos.length ? idsPedidos : [...PRIMEIRO, ...todas.map((r) => r.id)])
  .filter((id, i, a) => a.indexOf(id) === i && porId.has(id) && !manifesto[id])
  .slice(0, quantas);

const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));

async function gerar(r) {
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    const res = await fetch(URL_MODELO, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptDaFoto(r), steps: 6 }),
    });
    const corpo = await res.json().catch(() => ({}));
    if (res.ok && corpo?.result?.image) return Buffer.from(corpo.result.image, "base64");
    const erro = JSON.stringify(corpo?.errors || corpo).slice(0, 200);
    // Quota do dia esgotada: não vale a pena insistir.
    if (res.status === 429 && /neuron|quota|limit/i.test(erro)) throw Object.assign(new Error(erro), { quota: true });
    console.warn(`${r.id}: tentativa ${tentativa} falhou (${res.status}) ${erro}`);
    await espera(tentativa * 5000);
  }
  return null;
}

mkdirSync(pasta, { recursive: true });
console.log(`${fila.length} receitas por gerar (máximo pedido: ${quantas}).`);
let feitas = 0;
const recusadas = [];
for (const id of fila) {
  try {
    // Até duas tentativas: uma imagem que o modelo de visão diz não ser o
    // prato certo não entra; gera-se outra. À segunda, a receita fica de fora.
    let img = null, visto = "";
    for (let tentativa = 1; tentativa <= 2 && !img; tentativa++) {
      const nova = await gerar(porId.get(id));
      if (!nova) break;
      if (!verificar) { img = nova; break; }
      const v = await verificarImagem(nova, porId.get(id), { conta, token });
      if (v.quota) throw Object.assign(new Error("quota"), { quota: true });
      visto = v.visto || v.erro || "";
      // Sem resposta do modelo (null): fica, e a revisão humana decide.
      if (v.corresponde !== false) img = nova;
      else console.warn(`${id}: a imagem não corresponde (tentativa ${tentativa}): ${visto}`);
    }
    if (!img) { recusadas.push(id); continue; }
    writeFileSync(path.join(pasta, `${id}.jpg`), img);
    feitas++;
    console.log(`ok ${id}${visto ? ` (${visto})` : ""}`);
  } catch (e) {
    if (e.quota) { console.warn("Quota grátis do dia esgotada; o resto fica para amanhã."); break; }
    console.warn(`${id}: ${e.message}`);
  }
  await espera(1200);
}

if (feitas) {
  const r = spawnSync(process.execPath, [path.join(raiz, "scripts/fotos-receitas/processar.mjs"), pasta], { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status || 1);
}
console.log(`${feitas} fotografias geradas.${recusadas.length ? ` Recusadas pela verificação: ${recusadas.join(", ")}.` : ""}`);
