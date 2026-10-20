import { test } from "node:test";
import assert from "node:assert/strict";
import { idLoja, linhasTalao, artigosDeTalao, termosBusca } from "../lib/precosTalao.js";

const hoje = new Date("2026-10-20T12:00:00Z");

test("cadeia pelo nome do talão", () => {
  assert.equal(idLoja("LIDL & CIA"), "lidl");
  assert.equal(idLoja("Mercadona, S.A."), "mercadona");
  assert.equal(idLoja("Minipreço"), "auchan");
  assert.equal(idLoja("Mercearia do Zé"), null);
});

test("linhas de um talão do Lidl: unitário, ao peso, sem descontos nem sacos", () => {
  const linhas = linhasTalao({
    loja: "LIDL & CIA", data: "2026-10-18",
    produtos: [
      { nome: "LEITE M/G 1L", nomeLegivel: "Leite meio-gordo 1 L", qtd: 6, preco: 0.79, total: 4.74 },
      { nome: "BANANA", nomeLegivel: "Banana", kg: 0.835, precoKg: 1.29, qtd: 1, preco: 1.08, total: 1.08 },
      { nome: "DESCONTO LIDL PLUS", preco: -0.5, total: -0.5 },
      { nome: "SACO PAPEL", preco: 0.1, total: 0.1 },
      { nome: "IOG GREGO 4X125G", nomeLegivel: "Iogurte grego 4x125 g", qtd: 1, preco: null, total: 1.49 },
    ],
  }, hoje);
  assert.equal(linhas.length, 3);
  const [leite, banana, iog] = linhas;
  assert.deepEqual([leite.loja, leite.nome, leite.preco, leite.preco_unidade, leite.unidade], ["lidl", "Leite meio-gordo 1 L", 0.79, 0.79, "l"]);
  assert.match(leite.nome_busca, /leite meio gordo 1 l leite m\/g 1l/);
  assert.deepEqual([banana.preco, banana.preco_unidade, banana.unidade, banana.ao_peso], [1.29, 1.29, "kg", true]);
  assert.deepEqual([iog.preco, iog.preco_unidade, iog.unidade], [1.49, 2.98, "kg"]);
});

test("talões sem cadeia conhecida, sem data ou de outra altura não entram", () => {
  const p = [{ nome: "PAO", preco: 0.2 }];
  assert.deepEqual(linhasTalao({ loja: "Café", data: "2026-10-18", produtos: p }, hoje), []);
  assert.deepEqual(linhasTalao({ loja: "Lidl", data: "18/10/2026", produtos: p }, hoje), []);
  assert.deepEqual(linhasTalao({ loja: "Lidl", data: "2027-01-01", produtos: p }, hoje), []);
  assert.deepEqual(linhasTalao({ loja: "Lidl", data: "2025-01-01", produtos: p }, hoje), []);
});

test("na pesquisa fica o preço mais recente de cada artigo, marcado como talão", () => {
  const a = artigosDeTalao([
    { nome: "Leite meio-gordo 1 L", nome_busca: "leite", preco: 0.75, preco_unidade: 0.75, unidade: "l", ao_peso: false, data: "2026-09-01" },
    { nome: "Leite meio-gordo 1 L", nome_busca: "leite", preco: 0.79, preco_unidade: 0.79, unidade: "l", ao_peso: false, data: "2026-10-18" },
  ]);
  assert.equal(a.length, 1);
  assert.deepEqual([a[0].preco, a[0].onde, a[0].periodo], [0.79, "loja", "talão de 18/10"]);
  assert.deepEqual(termosBusca("Laranjas do Algarve"), ["laranja", "algarve"]);
});
