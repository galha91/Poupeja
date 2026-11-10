import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resumirCabaz, cabazServe, VALIDADE_MS, TIPO } from "../lib/cabazInicio.js";

const LOJAS = ["continente", "pingo-doce", "auchan", "lidl", "aldi", "apolonia"];
const nomes = { continente: "Continente", "pingo-doce": "Pingo Doce", auchan: "Auchan" };
const nome = (id) => nomes[id] || id;
const linha = (n, continente, pd, auchan) => ({ nome: n, custos: { continente, "pingo-doce": pd, auchan } });

const cabaz = [
  linha("Leite meio-gordo", 0.85, 0.95, 0.99),
  linha("Ovos", 1.69, 1.99, 2.09),
  linha("Pão de forma", 1.19, 1.29, 1.35),
  linha("Arroz carolino", 1.25, 1.39, 1.45),
  linha("Massa esparguete", 0.79, 0.89, 0.95),
  linha("Café moído", 2.49, 2.99, 3.19),
];

test("cabaz do Início: loja mais barata, a mais cara e a diferença", () => {
  const r = resumirCabaz(cabaz, LOJAS, nome);
  assert.equal(r.loja, "continente");
  assert.equal(r.nome, "Continente");
  assert.equal(r.total, 8.26);
  assert.deepEqual(r.cara, { loja: "auchan", nome: "Auchan", total: 10.02 });
  assert.equal(r.poupanca, 1.76);
  assert.equal(r.empate, false);
  assert.equal(r.lojas, 3);
  assert.equal(r.artigos.length, 6);
});

test("cabaz do Início: só se somam os artigos que todas as lojas têm", () => {
  const semCafe = cabaz.map((l) => (l.nome === "Café moído" ? { nome: l.nome, custos: { continente: 2.49, auchan: 3.19 } } : l));
  const r = resumirCabaz(semCafe, LOJAS, nome);
  assert.equal(r.artigos.includes("Café moído"), false);
  assert.equal(r.total, 5.77);
});

test("cabaz do Início: vitória por menos de 3% é empate", () => {
  const justo = cabaz.map((l) => ({ nome: l.nome, custos: { ...l.custos, "pingo-doce": l.custos.continente + 0.01 } }));
  const r = resumirCabaz(justo, LOJAS, nome);
  assert.equal(r.loja, "continente");
  assert.equal(r.empate, true);
});

test("cabaz do Início: vencedor que depende de um só artigo é empate", () => {
  // O Pingo Doce só ganha por causa do café a metade do preço.
  const fragil = cabaz.map((l) => (l.nome === "Café moído" ? linha(l.nome, 2.49, 1.2, 3.19) : l));
  const r = resumirCabaz(fragil, LOJAS, nome);
  assert.equal(r.loja, "pingo-doce");
  assert.equal(r.empate, true);
});

test("cabaz do Início: sem lojas ou artigos suficientes não há cartão", () => {
  assert.equal(resumirCabaz(cabaz.map((l) => ({ nome: l.nome, custos: {} })), LOJAS, nome), null);
  assert.equal(resumirCabaz(cabaz.map((l) => ({ nome: l.nome, custos: { continente: l.custos.continente } })), LOJAS, nome), null);
  assert.equal(resumirCabaz(cabaz.slice(0, 3), LOJAS, nome), null);
});

test("cabaz do Início: com mais de 2 dias deixa de servir", () => {
  const agora = Date.UTC(2026, 10, 10, 12);
  const props = { ...resumirCabaz(cabaz, LOJAS, nome), geradoEm: new Date(agora - 3600e3).toISOString() };
  assert.equal(cabazServe(props, agora), true);
  assert.equal(cabazServe(props, agora + VALIDADE_MS), false);
  assert.equal(cabazServe({ ...props, geradoEm: "ontem" }, agora), false);
  assert.equal(cabazServe(null, agora), false);
  assert.equal(cabazServe({ geradoEm: props.geradoEm }, agora), false);
});

test("cabaz do Início: a tabela aceita o tipo de linha", () => {
  const sql = readFileSync(new URL("../supabase/setup.sql", import.meta.url), "utf8");
  assert.match(sql, new RegExp(`add constraint paginas_marca_tipo_check[^;]*'${TIPO}'`));
});
