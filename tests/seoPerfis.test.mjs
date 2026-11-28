import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { PERFIS, SLUGS_PERFIS } from "../lib/seoPerfis.js";
import { slugApoio } from "../lib/seoEstado.js";

const apoios = JSON.parse(readFileSync(new URL("../public/apoios.json", import.meta.url))).apoios.map(slugApoio);

// Cada link interno das páginas por perfil tem de levar a uma página que existe.
function paginaExiste(href) {
  if (href.startsWith("/?atalho=")) return true;
  const caminho = href.split("?")[0].replace(/^\//, "");
  if (caminho.startsWith("apoios/")) return apoios.includes(caminho.slice(7));
  return ["js", "jsx"].some((ext) => existsSync(new URL(`../pages/${caminho}.${ext}`, import.meta.url)))
    || ["js", "jsx"].some((ext) => existsSync(new URL(`../pages/${caminho}/index.${ext}`, import.meta.url)));
}

test("perfis: três, com slugs únicos", () => {
  assert.deepEqual(SLUGS_PERFIS, ["estudantes", "familias", "reformados"]);
});

test("perfis: todos os links internos existem", () => {
  for (const p of PERFIS) for (const s of p.seccoes) for (const l of s.links) {
    assert.ok(paginaExiste(l.href), `${p.slug}: link partido ${l.href}`);
  }
});

test("perfis: título e descrição cabem nos resultados do Google", () => {
  for (const p of PERFIS) {
    assert.ok(p.descricao.length <= 160, `${p.slug}: descrição com ${p.descricao.length} caracteres`);
    assert.ok(p.titulo.length <= 75, `${p.slug}: título com ${p.titulo.length} caracteres`);
  }
});

test("perfis: sem valores em euros (mudam e vivem nas páginas próprias)", () => {
  const texto = JSON.stringify(PERFIS);
  assert.ok(!/\d\s?€/.test(texto));
});
