import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// lib/sitemap importa a DGEG e JSON que o node não carrega sem bundler; as
// funções de XML e de divisão são puras e testam-se pelo texto, como em
// cronHistorico.test.mjs.
const src = readFileSync(new URL("../lib/sitemap.js", import.meta.url), "utf8");
const pegar = (nome) => src.match(new RegExp(`export (?:function ${nome}|const ${nome} =)[\\s\\S]*?\\n(?:}|\\);?)\\n`))[0].replace(/^export /, "");
const MAX_URLS_POR_SITEMAP = 50000;
const { xmlUrls, xmlIndice, partes, parte } = new Function("MAX_URLS_POR_SITEMAP",
  `${pegar("xmlUrls")}\n${pegar("xmlIndice")}\nconst partes = ${src.match(/export const partes = ([^\n]+)/)[1]}\nconst parte = ${src.match(/export const parte = ([^\n]+)/)[1]}\nreturn { xmlUrls, xmlIndice, partes, parte };`)(MAX_URLS_POR_SITEMAP);

test("urlset com lastmod só quando há data real", () => {
  const xml = xmlUrls("https://x.pt", [
    { path: "/precos/azeite", changefreq: "daily", priority: "0.7", lastmod: "2026-10-21" },
    { path: "/apoios", changefreq: "monthly", priority: "0.8" },
  ]);
  assert.match(xml, /<loc>https:\/\/x\.pt\/precos\/azeite<\/loc>\s*<lastmod>2026-10-21<\/lastmod>/);
  assert.doesNotMatch(xml.split("/apoios")[1], /lastmod/);
});

test("acima de 50 000 URLs divide em partes", () => {
  const muitas = Array.from({ length: 120001 }, (_, i) => ({ path: `/p${i}` }));
  assert.equal(partes(muitas), 3);
  assert.equal(parte(muitas, 3).length, 20001);
  assert.equal(partes([{ path: "/" }]), 1);
  assert.match(xmlIndice("https://x.pt", 2), /<loc>https:\/\/x\.pt\/sitemaps\/2<\/loc>/);
});
