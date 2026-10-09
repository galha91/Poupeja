import { test } from "node:test";
import assert from "node:assert/strict";
import { emailValido, normalizarEmail } from "../lib/subscritores.js";

test("aceita emails normais e rejeita lixo", () => {
  assert.equal(emailValido("ana@exemplo.pt"), true);
  assert.equal(emailValido("  ana.silva+x@mail.exemplo.pt "), true);
  for (const mau of ["", "ana", "ana@", "@x.pt", "a b@x.pt", "ana@x", null, undefined, 5]) {
    assert.equal(emailValido(mau), false, String(mau));
  }
});

test("normaliza para minúsculas sem espaços", () => {
  assert.equal(normalizarEmail("  Ana@Exemplo.PT "), "ana@exemplo.pt");
});
