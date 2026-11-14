import { test } from "node:test";
import assert from "node:assert/strict";
import { segundaDe, registoDe, juntarSemana, mesmoCabaz, variacao, barometroServe, VALIDADE_MS } from "../lib/barometro.js";
import { resumirCabaz } from "../lib/cabazInicio.js";

const artigos = ["Leite meio-gordo", "Ovos", "Pão de forma", "Arroz carolino"];
const resumo = (continente, pd, auchan, extra = {}) => ({
  artigos, empate: false,
  porLoja: [
    { loja: "pingo-doce", nome: "Pingo Doce", total: pd },
    { loja: "continente", nome: "Continente", total: continente },
    { loja: "auchan", nome: "Auchan", total: auchan },
  ],
  ...extra,
});

test("barómetro: a semana começa à segunda-feira", () => {
  assert.equal(segundaDe("2026-11-14"), "2026-11-09"); // sábado
  assert.equal(segundaDe("2026-11-09"), "2026-11-09"); // segunda
  assert.equal(segundaDe("2026-11-15"), "2026-11-09"); // domingo
  assert.equal(segundaDe("2026-11-16"), "2026-11-16");
  assert.equal(segundaDe("2027-01-01"), "2026-12-28");
  assert.equal(segundaDe("ontem"), null);
});

test("barómetro: o registo ordena as cadeias e calcula a média", () => {
  const r = registoDe(resumo(9.5, 9.9, 10.27), "2026-11-14");
  assert.equal(r.semana, "2026-11-09");
  assert.deepEqual(r.lojas.map((l) => l.loja), ["continente", "pingo-doce", "auchan"]);
  assert.equal(r.media, 9.89);
  assert.equal(r.empate, false);
});

test("barómetro: sem duas cadeias com total não há registo", () => {
  assert.equal(registoDe({ artigos, porLoja: [{ loja: "continente", total: 9.5 }] }, "2026-11-14"), null);
  assert.equal(registoDe({ artigos }, "2026-11-14"), null);
  assert.equal(registoDe(resumo(9.5, 9.9, 10.27), ""), null);
});

test("barómetro: o resumo do cabaz do Início traz o total de cada cadeia", () => {
  const linhas = artigos.map((nome, i) => ({ nome, custos: { continente: 1 + i, "pingo-doce": 1.2 + i, auchan: 1.5 + i } }));
  const r = resumirCabaz(linhas, ["continente", "pingo-doce", "auchan"]);
  assert.deepEqual(r.porLoja.map((l) => l.total), [10, 10.8, 12]);
  assert.ok(registoDe(r, "2026-11-14"));
});

test("barómetro: um registo por semana, fica o dia mais recente", () => {
  const seg = registoDe(resumo(9.5, 9.9, 10.27), "2026-11-09");
  const sab = registoDe(resumo(9.6, 9.9, 10.27), "2026-11-14");
  const seguinte = registoDe(resumo(9.7, 9.9, 10.27), "2026-11-16");
  const h = juntarSemana(juntarSemana(juntarSemana(null, seguinte), seg), sab);
  assert.deepEqual(h.map((s) => s.dia), ["2026-11-14", "2026-11-16"]);
  assert.equal(juntarSemana(h, seguinte, 1).length, 1);
});

test("barómetro: a variação só existe com o mesmo cabaz nas mesmas cadeias", () => {
  const a = registoDe(resumo(9.5, 9.9, 10.27), "2026-11-14");
  const b = registoDe(resumo(9.8, 10.2, 10.57), "2026-11-21");
  const v = variacao([a, b]);
  assert.equal(v.diff, 0.3);
  assert.equal(v.pct, 3);
  assert.equal(v.desde, "2026-11-14");

  const semOvos = registoDe({ ...resumo(8, 8.4, 8.7), artigos: artigos.filter((x) => x !== "Ovos") }, "2026-11-21");
  assert.equal(mesmoCabaz(a, semOvos), false);
  assert.equal(variacao([a, semOvos]), null);

  const semAuchan = registoDe({ ...resumo(9.8, 10.2, 10.57), porLoja: resumo(9.8, 10.2, 10.57).porLoja.slice(0, 2) }, "2026-11-21");
  assert.equal(variacao([a, semAuchan]), null);
  assert.equal(variacao([a]), null);
  assert.equal(variacao(null), null);
});

test("barómetro: com mais de 10 dias sem cabaz novo deixa de servir", () => {
  const a = registoDe(resumo(9.5, 9.9, 10.27), "2026-11-14");
  const agora = Date.parse("2026-11-14T12:00:00Z");
  assert.equal(barometroServe({ semanas: [a] }, agora + 86400000), true);
  assert.equal(barometroServe({ semanas: [a] }, agora + VALIDADE_MS + 1), false);
  assert.equal(barometroServe({ semanas: [] }, agora), false);
  assert.equal(barometroServe(null, agora), false);
});
