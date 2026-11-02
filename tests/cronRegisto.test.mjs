import { test } from "node:test";
import assert from "node:assert/strict";
import { resumir } from "../lib/cronRegisto.js";

test("resumo do cron: curto e sem listas grandes", () => {
  assert.equal(resumir(null), null);
  assert.equal(resumir({ ok: true, n: 3 }), '{"ok":true,"n":3}');
  assert.equal(resumir({ itens: [1, 2, 3, 4, 5, 6] }), '{"itens":"[6 itens]"}');
  assert.ok(resumir({ t: "x".repeat(2000) }).length <= 600);
});

test("horário dos crons em texto", async () => {
  const { descreverHorario } = await import("../lib/horarioCron.js");
  assert.deepEqual(descreverHorario("0 8 * * 4"), { texto: "à quinta, 08:00 UTC", intervaloH: 168 });
  assert.deepEqual(descreverHorario("45 18 * * *"), { texto: "todos os dias, 18:45 UTC", intervaloH: 24 });
});
