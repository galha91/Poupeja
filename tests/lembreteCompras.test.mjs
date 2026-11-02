import { test } from "node:test";
import assert from "node:assert/strict";
import { validarLembrete, limparItens, diaDaSemanaLisboa } from "../lib/lembreteCompras.js";

test("lembrete: valida email, dia e consentimento", () => {
  const ok = validarLembrete({ email: " Rui@Mail.pt", dia: "6", itens: [{ nome: "Ovos" }], consentimento: true });
  assert.equal(ok.lembrete.email, "rui@mail.pt");
  assert.equal(ok.lembrete.dia, 6);
  assert.deepEqual(ok.lembrete.itens, ["Ovos"]);
  assert.ok(validarLembrete({ email: "rui@mail.pt", dia: 8, consentimento: true }).erro);
  assert.ok(validarLembrete({ email: "rui@mail.pt", dia: 1 }).erro);
  assert.ok(validarLembrete({ email: "x", dia: 1, consentimento: true }).erro);
});

test("itens: só nomes, sem repetidos, no máximo 25", () => {
  assert.deepEqual(limparItens([{ nome: "Leite" }, "leite", { nome: "  Pão   de forma " }, null]), ["Leite", "Pão de forma"]);
  assert.equal(limparItens(Array.from({ length: 40 }, (_, i) => `a${i}`)).length, 25);
  assert.deepEqual(limparItens("x"), []);
});

test("dia da semana em Lisboa", () => {
  assert.equal(diaDaSemanaLisboa(new Date("2026-11-02T12:00:00Z")), 1); // segunda
  assert.equal(diaDaSemanaLisboa(new Date("2026-11-08T12:00:00Z")), 7); // domingo
});
