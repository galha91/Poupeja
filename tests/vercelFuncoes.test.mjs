import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));

/*
 * A Vercel aplica a primeira regra de "functions" que encaixa. Uma regra
 * específica depois de "pages/api/*.js" é ignorada e a função fica com 30 s:
 * aconteceu com o histórico de preços e, a 25/11/2026, com o email do cabaz
 * (cortado a meio do envio).
 */
test("vercel.json: a regra geral das APIs é a última", () => {
  const regras = Object.keys(vercel.functions);
  assert.equal(regras[regras.length - 1], "pages/api/*.js");
});

// Tarefas curtas, que cabem nos 30 s da regra geral.
const CURTAS = new Set(["/api/cron-indexnow"]);

test("vercel.json: cada cron que envia ou calcula tem os seus 60 s declarados", () => {
  for (const c of vercel.crons) {
    if (CURTAS.has(c.path)) continue;
    const ficheiro = `pages${c.path}.js`;
    assert.ok(vercel.functions[ficheiro]?.maxDuration >= 60, `${ficheiro} sem maxDuration de 60 s`);
  }
});
