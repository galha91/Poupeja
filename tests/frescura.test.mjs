import { test } from "node:test";
import assert from "node:assert/strict";
import { descreverFrescura } from "../lib/frescura.js";

const agora = new Date("2026-10-11T14:00:00Z");
const h = iso => Date.parse(iso);

test("consulta de hoje: diz a hora da consulta e não avisa", () => {
  const r = descreverFrescura({ obtidoEm: h("2026-10-11T06:02:00Z"), dataPreco: h("2026-10-11T06:00:00Z") }, agora);
  assert.equal(r.deHoje, true);
  assert.match(r.rotulo, /consultados hoje às/);
  assert.equal(r.aviso, null);
});

test("consulta de ontem não passa por 'hoje', mesmo que um posto tenha atualizado hoje", () => {
  const r = descreverFrescura({ obtidoEm: h("2026-10-10T06:02:00Z"), dataPreco: h("2026-10-11T01:00:00Z") }, agora);
  assert.equal(r.deHoje, false);
  assert.match(r.aviso, /consultados à DGEG/);
});

test("sem datas não inventa nada", () => {
  const r = descreverFrescura({}, agora);
  assert.equal(r.deHoje, false);
  assert.equal(r.rotulo, "Sem preços disponíveis");
});

test("falha da DGEG com consulta de hoje avisa que são os da consulta anterior", () => {
  const r = descreverFrescura({ obtidoEm: h("2026-10-11T06:02:00Z"), stale: true }, agora);
  assert.equal(r.deHoje, false);
  assert.match(r.aviso, /não respondeu/);
});
