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
 *   (900×900), <id>-16x9.webp (1200×675) e <id>-og.jpg (1200×630)
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
const SAIDAS = [
  { suf: "1200.webp", w: 1200, h: 900, fmt: (s) => s.webp({ quality: 72 }) },
  { suf: "480.webp", w: 480, h: 360, fmt: (s) => s.webp({ quality: 70 }) },
  { suf: "1x1.webp", w: 900, h: 900, fmt: (s) => s.webp({ quality: 72 }) },
  { suf: "16x9.webp", w: 1200, h: 675, fmt: (s) => s.webp({ quality: 72 }) },
  { suf: "og.jpg", w: 1200, h: 630, fmt: (s) => s.jpeg({ quality: 78, mozjpeg: true }) },
];

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
  for (const s of SAIDAS) {
    await s.fmt(sharp(path.join(origem, f)).resize(s.w, s.h, { fit: "cover", position: "centre" }))
      .toFile(path.join(destino, `${id}-${s.suf}`));
  }
  feitos[id] = credito;
}

const atual = JSON.parse(readFileSync(manifesto, "utf8")).fotos || {};
const todas = { ...atual, ...feitos };
const ordenadas = Object.fromEntries(Object.keys(todas).sort().map((k) => [k, todas[k]]));
writeFileSync(manifesto, JSON.stringify({ fotos: ordenadas }, null, 2) + "\n");
console.log(`${Object.keys(feitos).length} fotografias preparadas; ${Object.keys(ordenadas).length} receitas com fotografia.`);
