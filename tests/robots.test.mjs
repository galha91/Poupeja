import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Os motores de pesquisa e os bots de pesquisa das IAs têm de continuar a
 * entrar: são fundamentais para o tráfego. Só os bots de treino e de SEO
 * ficam de fora (public/robots.txt).
 */
const robots = readFileSync(new URL("../public/robots.txt", import.meta.url), "utf8");

function grupos(texto) {
  const out = [];
  let atual = null;
  for (const linha of texto.split("\n").map((l) => l.replace(/#.*/, "").trim()).filter(Boolean)) {
    const [k, ...resto] = linha.split(":");
    const v = resto.join(":").trim();
    if (/^user-agent$/i.test(k)) {
      if (!atual || atual.regras.length) out.push((atual = { agentes: [], regras: [] }));
      atual.agentes.push(v.toLowerCase());
    } else if (atual && /^(dis)?allow$/i.test(k)) atual.regras.push([k.toLowerCase(), v]);
  }
  return out;
}

function bloqueadoNaRaiz(agente) {
  const g = grupos(robots);
  const proprio = g.find((x) => x.agentes.includes(agente.toLowerCase())) || g.find((x) => x.agentes.includes("*"));
  return proprio.regras.some(([k, v]) => k === "disallow" && v === "/");
}

test("robots: motores de pesquisa e pesquisa das IAs entram", () => {
  for (const bot of ["Googlebot", "Googlebot-Image", "Bingbot", "Applebot", "DuckDuckBot", "YandexBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Perplexity-User", "Claude-SearchBot", "Claude-User"]) {
    assert.equal(bloqueadoNaRaiz(bot), false, `${bot} não pode ser bloqueado`);
  }
});

test("robots: bots de treino de IA e de SEO ficam de fora", () => {
  for (const bot of ["GPTBot", "ClaudeBot", "CCBot", "Bytespider", "AhrefsBot", "SemrushBot"]) {
    assert.equal(bloqueadoNaRaiz(bot), true, `${bot} devia estar bloqueado`);
  }
});

test("robots: o sitemap continua anunciado", () => {
  assert.match(robots, /^Sitemap: https:\/\/xn--poupej-uta\.com\/sitemap\.xml$/m);
});
