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

test("bloqueio no next.config: a mesma lista do robots.txt e nunca um motor de pesquisa", async () => {
  const { bots } = JSON.parse(readFileSync(new URL("../data/bots-bloqueados.json", import.meta.url), "utf8"));
  const ua = new RegExp(`.*(${bots.join("|")}).*`);
  for (const bot of bots) assert.equal(bloqueadoNaRaiz(bot), true, `${bot} também tem de estar no robots.txt`);
  const pesquisa = [
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Googlebot-Image/1.0",
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)",
    "DuckDuckBot/1.1; (+http://duckduckgo.com/duckduckbot.html)",
    "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +Searchbot@anthropic.com)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +Claude-User@anthropic.com)",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "WhatsApp/2.23.20.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  ];
  for (const u of pesquisa) assert.equal(ua.test(u), false, `não pode bloquear: ${u}`);
  assert.equal(ua.test("Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)"), true);
  assert.equal(ua.test("Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)"), true);
});
