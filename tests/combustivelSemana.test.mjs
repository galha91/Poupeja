import { test } from "node:test";
import assert from "node:assert/strict";
import { resumoDiario, variacaoSemanal, PAIS } from "../lib/combustivelSemana.js";

const postos = (marca, tipoLabel, preco, n) => Array.from({ length: n }, () => ({ marca, tipoLabel, preco }));

test("resumo diário: país e marcas com postos suficientes", () => {
  const r = resumoDiario([...postos("GALP", "Gasóleo", 1.7, 12), ...postos("Prio", "Gasóleo", 1.6, 3)], "2026-10-13");
  const pais = r.find(l => l.marca === PAIS);
  assert.equal(pais.n, 15);
  assert.equal(pais.media, 1.68);
  assert.ok(r.find(l => l.marca === "GALP"));
  assert.ok(!r.find(l => l.marca === "Prio"), "Prio tem só 3 postos");
});

test("variação compara com ~7 dias antes, em cêntimos", () => {
  const linhas = [
    ...resumoDiario(postos("GALP", "Gasóleo", 1.75, 10), "2026-10-06"),
    ...resumoDiario(postos("GALP", "Gasóleo", 1.72, 10), "2026-10-13"),
  ];
  const v = variacaoSemanal(linhas);
  assert.equal(v.antes, "2026-10-06");
  assert.equal(v.porTipo["Gasóleo"].pais.diffCent, -3);
  assert.equal(v.porTipo["Gasóleo"].marcas[0].diffCent, -3);
});

test("sem uma semana de dados, diz desde quando recolhe", () => {
  const v = variacaoSemanal(resumoDiario(postos("GALP", "Gasóleo", 1.7, 10), "2026-10-13"));
  assert.equal(v.antes, null);
  assert.equal(v.primeiroDia, "2026-10-13");
});
