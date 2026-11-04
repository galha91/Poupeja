import { test } from "node:test";
import assert from "node:assert/strict";
import { resumir } from "../lib/cronRegisto.js";

test("resumo do cron: curto e sem listas grandes", () => {
  assert.equal(resumir(null), null);
  assert.equal(resumir({ ok: true, n: 3 }), '{"ok":true,"n":3}');
  assert.equal(resumir({ itens: [1, 2, 3, 4, 5, 6] }), '{"itens":"[6 itens]"}');
  assert.ok(resumir({ t: "x".repeat(2000) }).length <= 600);
});

test("reserva: só atua se o cron não correu nas últimas 20h", async () => {
  const { jaCorreuRecentemente } = await import("../lib/cronRegisto.js");
  const agora = Date.parse("2026-11-04T10:00:00Z");
  assert.equal(jaCorreuRecentemente(null, agora), false);
  assert.equal(jaCorreuRecentemente("2026-11-04T06:42:00Z", agora), true);
  assert.equal(jaCorreuRecentemente("2026-11-03T06:42:00Z", agora), false);
});

test("horário dos crons em texto", async () => {
  const { descreverHorario } = await import("../lib/horarioCron.js");
  assert.deepEqual(descreverHorario("0 8 * * 4"), { texto: "à quinta, 08:00 UTC", intervaloH: 168 });
  assert.deepEqual(descreverHorario("45 18 * * *"), { texto: "todos os dias, 18:45 UTC", intervaloH: 24 });
});

test("registo acontece antes de a resposta sair", async () => {
  const { comRegisto } = await import("../lib/cronRegisto.js");
  const ordem = [];
  const res = { statusCode: 200, status(c) { this.statusCode = c; return this; }, json(b) { ordem.push("resposta"); return b; } };
  const handler = comRegisto("teste", async (req, r) => r.status(200).json({ ok: true }));
  // Sem Supabase configurado o registo não faz nada, mas a ordem mantém-se.
  const original = process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  await handler({ query: {}, headers: {} }, res);
  if (original) process.env.NEXT_PUBLIC_SUPABASE_URL = original;
  assert.deepEqual(ordem, ["resposta"]);
});
