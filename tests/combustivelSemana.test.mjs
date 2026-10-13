import { test } from "node:test";
import assert from "node:assert/strict";
import { resumoDiario, variacaoSemanal, serie } from "../lib/combustivelSemana.js";

const postos = (marca, tipoLabel, preco, n, distrito = "Braga", municipio = "Braga") =>
  Array.from({ length: n }, () => ({ marca, tipoLabel, preco, distrito, municipio }));

test("resumo diário: país, marcas, distritos e concelhos, com mínimos de postos", () => {
  const r = resumoDiario([...postos("GALP", "Gasóleo", 1.7, 12), ...postos("Prio", "Gasóleo", 1.6, 3, "Porto", "Maia")], "2026-10-13");
  const pais = r.find(l => l.escopo === "pais");
  assert.equal(pais.n, 15);
  assert.equal(pais.media, 1.68);
  assert.ok(r.find(l => l.escopo === "marca" && l.nome === "GALP"));
  assert.ok(!r.find(l => l.escopo === "marca" && l.nome === "Prio"), "Prio tem só 3 postos");
  assert.ok(r.find(l => l.escopo === "concelho" && l.chave === "maia"), "concelho com 3 postos entra");
  assert.equal(r.find(l => l.escopo === "distrito" && l.chave === "braga").n, 12);
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

test("série de um concelho por ordem de dia", () => {
  const linhas = [
    ...resumoDiario(postos("GALP", "Gasóleo", 1.72, 5), "2026-10-13"),
    ...resumoDiario(postos("GALP", "Gasóleo", 1.75, 5), "2026-10-12"),
  ];
  const s = serie(linhas, { escopo: "concelho", chave: "braga", tipo: "Gasóleo" });
  assert.deepEqual(s.map(p => p.dia), ["2026-10-12", "2026-10-13"]);
  assert.equal(s[1].media, 1.72);
});
