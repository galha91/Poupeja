import test from "node:test";
import assert from "node:assert/strict";
import { escaparHtml, jsonLdSeguro } from "../lib/escapar.js";
import { emailValido, padraoEmail } from "../lib/subscritores.js";
import { diaLisboa, limiteDiarioUsd } from "../lib/limiteIA.js";

test("escaparHtml neutraliza tags e aspas", () => {
  assert.equal(escaparHtml(`<img src=x onerror="alert(1)">`), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  assert.equal(escaparHtml("Ana & Rui's"), "Ana &amp; Rui&#39;s");
  assert.equal(escaparHtml(null), "");
});

test("jsonLdSeguro não deixa fechar o <script> e dá o mesmo JSON", () => {
  const dado = { name: "Leite </script><script>alert(1)</script> & Cª" };
  const s = jsonLdSeguro(dado);
  assert.ok(!s.includes("<"), s);
  assert.ok(!s.includes(">"), s);
  assert.deepEqual(JSON.parse(s), dado);
});

test("emailValido rejeita curingas e caracteres de filtro", () => {
  for (const mau of ["%@gmail.com", "a*@x.pt", "a,b@x.pt", "a(b)@x.pt", "a\\b@x.pt", "<a>@x.pt"]) {
    assert.equal(emailValido(mau), false, mau);
  }
  for (const bom of ["ana_silva@x.pt", "o'brien@mail.ie", "ana.silva+promo@exemplo.pt"]) {
    assert.equal(emailValido(bom), true, bom);
  }
});

test("padraoEmail torna o ilike literal", () => {
  assert.equal(padraoEmail(" Ana_Silva@X.pt "), "ana\\_silva@x.pt");
  assert.equal(padraoEmail("a%b@x.pt"), "a\\%b@x.pt");
});

test("teto da IA: dia em Lisboa e limite por omissão", () => {
  assert.equal(diaLisboa(new Date("2026-03-29T23:30:00Z")), "2026-03-30"); // já é horário de verão
  assert.equal(diaLisboa(new Date("2026-01-10T23:30:00Z")), "2026-01-10");
  const antes = process.env.ANTHROPIC_LIMITE_DIARIO_USD;
  delete process.env.ANTHROPIC_LIMITE_DIARIO_USD;
  assert.equal(limiteDiarioUsd(), 2);
  process.env.ANTHROPIC_LIMITE_DIARIO_USD = "0.5";
  assert.equal(limiteDiarioUsd(), 0.5);
  if (antes === undefined) delete process.env.ANTHROPIC_LIMITE_DIARIO_USD; else process.env.ANTHROPIC_LIMITE_DIARIO_USD = antes;
});
