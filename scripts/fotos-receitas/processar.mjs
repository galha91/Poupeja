/*
 * Prepara as fotografias das receitas para o site.
 *
 *   node scripts/fotos-receitas/processar.mjs <pasta-com-originais>
 *
 * Cada original chama-se <id-da-receita>.png|jpg|jpeg|webp (o id é o do
 * URL /receitas/<id>). Para cada um escreve em public/receitas/fotos:
 *   <id>-1200.webp (1200×900), <id>-480.webp (480×360), <id>-1x1.webp
 *   (900×900), <id>-16x9.webp (1200×675) e <id>-og.jpg (1200×630)
 * e junta o id a data/fotos-receitas.json. Recorta ao centro. Ids que não
 * existem nas receitas são recusados (um erro de nome não chega ao site).
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { receitas } from "../../lib/receitas/motor.js";

const origem = process.argv[2];
if (!origem) { console.error("Uso: processar.mjs <pasta-com-originais>"); process.exit(1); }

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const destino = path.join(raiz, "public/receitas/fotos");
const manifesto = path.join(raiz, "data/fotos-receitas.json");
mkdirSync(destino, { recursive: true });

const ids = new Set(receitas().map((r) => r.id));
const SAIDAS = [
  { suf: "1200.webp", w: 1200, h: 900, fmt: (s) => s.webp({ quality: 72 }) },
  { suf: "480.webp", w: 480, h: 360, fmt: (s) => s.webp({ quality: 70 }) },
  { suf: "1x1.webp", w: 900, h: 900, fmt: (s) => s.webp({ quality: 72 }) },
  { suf: "16x9.webp", w: 1200, h: 675, fmt: (s) => s.webp({ quality: 72 }) },
  { suf: "og.jpg", w: 1200, h: 630, fmt: (s) => s.jpeg({ quality: 78, mozjpeg: true }) },
];

const feitos = [];
for (const f of readdirSync(origem)) {
  const m = /^([a-z0-9-]+)\.(png|jpe?g|webp)$/i.exec(f);
  if (!m) continue;
  const id = m[1];
  if (!ids.has(id)) { console.warn(`ignorado: ${f} (não há receita "${id}")`); continue; }
  for (const s of SAIDAS) {
    await s.fmt(sharp(path.join(origem, f)).resize(s.w, s.h, { fit: "cover", position: "centre" }))
      .toFile(path.join(destino, `${id}-${s.suf}`));
  }
  feitos.push(id);
}

const atual = JSON.parse(readFileSync(manifesto, "utf8"));
const todos = [...new Set([...(atual.ids || []), ...feitos])].sort();
writeFileSync(manifesto, JSON.stringify({ ids: todos }, null, 2) + "\n");
console.log(`${feitos.length} fotografias preparadas; ${todos.length} receitas com fotografia.`);
