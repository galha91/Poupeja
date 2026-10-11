import { test } from "node:test";
import assert from "node:assert/strict";
import { construirEmailCombustivel } from "../lib/emailCombustivel.js";
import { slugConcelhoValido } from "../lib/subscritores.js";

const post = (tipoLabel, nome, preco) => ({ tipoLabel, nome, preco });
const dados = {
  municipio: { slug: "braga", nome: "Braga" },
  destaques: [
    { tipoLabel: "Gasóleo", preco: 1.999, nome: "PA GESTROIL São Lazaro" },
    { tipoLabel: "Gasolina 95", preco: 1.978, nome: "REDE ENERGIA BRAGA" },
  ],
  amplitude: { min: 1.999, max: 2.294, porDeposito: 14.75 },
  ranking: { posicao: 1, total: 13, distrito: "Braga", tipo: "Gasóleo" },
  noConcelho: [
    post("Gasóleo", "PA GESTROIL São Lazaro", 1.999), post("Gasóleo", "PLENERGY BRAGA", 2.069),
    post("Gasolina 95", "REDE ENERGIA BRAGA", 1.978),
  ],
  proximos: [{ municipio: "Barcelos", distancia: 8.4, preco: 1.999, nome: "BP Barcelos" }],
};
const base = "https://exemplo.pt", unsub = "https://exemplo.pt/api/cancelar-combustivel?s=1&t=x";

test("assunto, preços e cancelamento no email", () => {
  const r = construirEmailCombustivel({ dados, base, unsubscribeUrl: unsub, rotulo: "Preços DGEG · consultados hoje às 07:02" });
  assert.match(r.subject, /Braga.*1,999/);
  assert.match(r.text, /1,999 €\/L/);
  assert.match(r.text, /14,75 €/);
  assert.match(r.html, /Cancelar subscrição/);
  assert.ok(r.html.includes(unsub) && r.text.includes(unsub));
});

test("diz se o preço subiu ou desceu desde o último email", () => {
  const r = construirEmailCombustivel({ dados, anterior: { gasoleo: 2.029, gasolina: 1.978 }, base, unsubscribeUrl: unsub, rotulo: "x" });
  assert.match(r.text, /Gasóleo: desceu 3 cênt\./);
  assert.match(r.text, /Gasolina 95: igual ao último email/);
});

test("sem email anterior não inventa variação", () => {
  const r = construirEmailCombustivel({ dados, base, unsubscribeUrl: unsub, rotulo: "x" });
  assert.doesNotMatch(r.text, /desde o último email/);
});

test("só sugere sair do concelho se a diferença paga o desvio (3+ cêntimos)", () => {
  const sem = construirEmailCombustivel({ dados, base, unsubscribeUrl: unsub, rotulo: "x" });
  assert.doesNotMatch(sem.text, /Perto:/);
  const com = construirEmailCombustivel({ dados: { ...dados, proximos: [{ ...dados.proximos[0], preco: 1.95 }] }, base, unsubscribeUrl: unsub, rotulo: "x" });
  assert.match(com.text, /Perto: em Barcelos/);
});

test("slug de concelho", () => {
  for (const ok of ["braga", "vila-nova-de-gaia", "o-bairro"]) assert.equal(slugConcelhoValido(ok), true, ok);
  for (const mau of ["", "Braga", "braga/../x", "-x", "x-", "a b", null, 5]) assert.equal(slugConcelhoValido(mau), false, String(mau));
});
