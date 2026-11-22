/*
 * Prepara as fotografias das receitas para o site.
 *
 *   node scripts/fotos-receitas/processar.mjs <pasta-com-originais>
 *
 * Se a pasta tiver um creditos.json ({ "<id>": { "fonte": "commons",
 * "autor", "licenca", "pagina" } }), os créditos vão para o manifesto; as
 * fotografias sem entrada contam como geradas por IA ({ "fonte": "ia" }).
 * Fotografias reais sem licença livre (CC0, domínio público, CC BY, CC BY-SA)
 * são recusadas.
 *
 * Cada original chama-se <id-da-receita>.png|jpg|jpeg|webp (o id é o do
 * URL /receitas/<id>). Para cada um escreve em public/receitas/fotos:
 *   <id>-1200.webp (1200×900), <id>-480.webp (480×360), <id>-1x1.webp
 *   (720×720), <id>-16x9.webp (1200×675) e <id>-og.jpg (1200×630)
 * e junta o id a data/fotos-receitas.json. Recorta ao centro. Ids que não
 * existem nas receitas são recusados (um erro de nome não chega ao site).
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { receitas } from "../../lib/receitas/motor.js";
import { existsSync } from "node:fs";

const LICENCAS_LIVRES = /^(CC0|Public domain|PD|CC BY(-SA)? \d\.\d)/i;

const origem = process.argv[2];
if (!origem) { console.error("Uso: processar.mjs <pasta-com-originais>"); process.exit(1); }

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const destino = path.join(raiz, "public/receitas/fotos");
const manifesto = path.join(raiz, "data/fotos-receitas.json");
mkdirSync(destino, { recursive: true });

const ids = new Set(receitas().map((r) => r.id));
/*
 * Tamanho e peso máximo de cada ficheiro (o mesmo que tests/fotosReceitas
 * verifica). Se um ficheiro passar do limite, a qualidade desce até caber.
 * As versões 1:1 e 16:9 só as lê o Google: vão mais leves.
 */
const SAIDAS = [
  { suf: "1200.webp", w: 1200, h: 900, q: 70, maxKB: 140, tipo: "webp" },
  { suf: "480.webp", w: 480, h: 360, q: 68, maxKB: 35, tipo: "webp" },
  { suf: "1x1.webp", w: 720, h: 720, q: 60, maxKB: 70, tipo: "webp" },
  { suf: "16x9.webp", w: 1200, h: 675, q: 58, maxKB: 90, tipo: "webp" },
  { suf: "og.jpg", w: 1200, h: 630, q: 74, maxKB: 120, tipo: "jpeg" },
];
async function escrever(origemImg, s, destinoFicheiro) {
  for (let q = s.q; ; q -= 6) {
    const base = sharp(origemImg).resize(s.w, s.h, { fit: "cover", position: "centre" });
    const buf = await (s.tipo === "jpeg" ? base.jpeg({ quality: q, mozjpeg: true }) : base.webp({ quality: q })).toBuffer();
    if (buf.length <= s.maxKB * 1024 || q <= 40) { writeFileSync(destinoFicheiro, buf); return buf.length; }
  }
}

const ficheiroCreditos = path.join(origem, "creditos.json");
const creditos = existsSync(ficheiroCreditos) ? JSON.parse(readFileSync(ficheiroCreditos, "utf8")) : {};

const feitos = {};
for (const f of readdirSync(origem)) {
  const m = /^([a-z0-9-]+)\.(png|jpe?g|webp)$/i.exec(f);
  if (!m) continue;
  const id = m[1];
  if (!ids.has(id)) { console.warn(`ignorado: ${f} (não há receita "${id}")`); continue; }
  const credito = creditos[id] || { fonte: "ia" };
  if (credito.fonte !== "ia" && !(LICENCAS_LIVRES.test(credito.licenca || "") && credito.autor && credito.pagina)) {
    console.warn(`ignorado: ${f} (fotografia real sem licença livre, autor ou página)`); continue;
  }
  for (const s of SAIDAS) await escrever(path.join(origem, f), s, path.join(destino, `${id}-${s.suf}`));
  feitos[id] = credito;
}

const atual = JSON.parse(readFileSync(manifesto, "utf8")).fotos || {};
const todas = { ...atual, ...feitos };
const ordenadas = Object.fromEntries(Object.keys(todas).sort().map((k) => [k, todas[k]]));
writeFileSync(manifesto, JSON.stringify({ fotos: ordenadas }, null, 2) + "\n");
console.log(`${Object.keys(feitos).length} fotografias preparadas; ${Object.keys(ordenadas).length} receitas com fotografia.`);
