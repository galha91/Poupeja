import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fimGarantia, estadoGarantia, ordenarGarantias, normalizarGarantia,
  converterGarantiaAntiga, mesesPorOmissao, MESES_GARANTIA_LEGAL,
} from "../lib/garantias.js";
import { somarMeses, diaDoAno, diasEntre } from "../lib/datas.js";

const HOJE = "2026-10-03";

test("garantia legal: 3 anos para bens novos", () => {
  assert.equal(MESES_GARANTIA_LEGAL, 36);
  assert.equal(fimGarantia("2026-10-03"), "2029-10-03");
});

test("usados: 3 anos, ou 18 meses só se houve acordo", () => {
  assert.equal(mesesPorOmissao("usado"), 36);
  assert.equal(mesesPorOmissao("usado", true), 18);
  assert.equal(mesesPorOmissao("novo", true), 36);
  assert.equal(fimGarantia("2026-01-15", 18), "2027-07-15");
});

test("fim no último dia do mês quando o dia não existe", () => {
  assert.equal(somarMeses("2026-01-31", 1), "2026-02-28");
  assert.equal(somarMeses("2027-02-28", 12), "2028-02-28");
  assert.equal(fimGarantia("2024-02-29", 36), "2027-02-28");
  assert.equal(diaDoAno(2028, "02-29"), "2028-02-29");
  assert.equal(diaDoAno(2027, "02-29"), "2027-02-28");
});

test("contagem de dias não escorrega com a mudança de hora", () => {
  // 25/10/2026 muda para a hora de inverno.
  assert.equal(diasEntre("2026-10-24", "2026-10-26"), 2);
  assert.equal(diasEntre("2026-03-28", "2026-03-30"), 2);
});

test("fim inválido com data ou duração inválidas", () => {
  assert.equal(fimGarantia("2026-02-30"), null);
  assert.equal(fimGarantia("ontem"), null);
  assert.equal(fimGarantia("2026-01-01", 0), null);
});

test("estado: válida, a expirar (≤ 60 dias) e expirada", () => {
  assert.deepEqual(estadoGarantia("2026-12-02", HOJE), { estado: "a_expirar", dias: 60 });
  assert.deepEqual(estadoGarantia("2026-12-03", HOJE), { estado: "valida", dias: 61 });
  assert.equal(estadoGarantia("2026-10-03", HOJE).estado, "a_expirar");
  assert.deepEqual(estadoGarantia("2026-10-02", HOJE), { estado: "expirada", dias: -1 });
});

test("ordena por quem expira primeiro; expiradas no fim", () => {
  const l = ordenarGarantias([
    { id: "a", fim: "2027-05-01" },
    { id: "b", fim: "2026-01-01" },
    { id: "c", fim: "2026-11-01" },
    { id: "d", fim: "2026-09-01" },
  ], HOJE);
  assert.deepEqual(l.map(g => g.id), ["c", "a", "d", "b"]);
});

test("formulário: só produto e data são obrigatórios", () => {
  const r = normalizarGarantia({ produto: "  Máquina de lavar ", dataCompra: "2026-09-01", meses: 36 }, HOJE);
  assert.equal(r.ok, true);
  assert.deepEqual(r.garantia, {
    produto: "Máquina de lavar", loja: "", dataCompra: "2026-09-01", preco: null, estado: "novo", meses: 36, fim: "2029-09-01",
  });
  assert.equal(normalizarGarantia({ produto: "", dataCompra: "2026-09-01", meses: 36 }, HOJE).ok, false);
  assert.equal(normalizarGarantia({ produto: "TV", dataCompra: "", meses: 36 }, HOJE).ok, false);
  assert.equal(normalizarGarantia({ produto: "TV", dataCompra: "2026-10-04", meses: 36 }, HOJE).ok, false);
  assert.equal(normalizarGarantia({ produto: "TV", dataCompra: "2026-09-01", meses: 0 }, HOJE).ok, false);
});

test("preço com vírgula", () => {
  const r = normalizarGarantia({ produto: "TV", dataCompra: "2026-09-01", meses: 36, preco: "499,9" }, HOJE);
  assert.equal(r.garantia.preco, 499.9);
  assert.equal(normalizarGarantia({ produto: "TV", dataCompra: "2026-09-01", meses: 36, preco: "abc" }, HOJE).ok, false);
});

test("converte garantias antigas dos talões, mantendo o fim que já tinham", () => {
  const r = converterGarantiaAntiga({
    id: 1700000000000, tipo: "garantia", nome: "Frigorífico", imagem: "data:image/jpeg;base64,AAA",
    dataCompra: "2025-03-10", duracao: 24, dataExpiracao: "2027-03-10", criadoEm: "2025-03-10T10:00:00Z",
  });
  assert.equal(r.garantia.id, "t1700000000000");
  assert.equal(r.garantia.fim, "2027-03-10");
  assert.equal(r.garantia.meses, 24);
  assert.equal(r.garantia.temFoto, true);
  assert.equal(r.foto, "data:image/jpeg;base64,AAA");
  assert.equal(converterGarantiaAntiga({ tipo: "compra", id: 1 }), null);
  // Sem data de compra válida: usa a data de criação.
  const s = converterGarantiaAntiga({ id: 2, tipo: "garantia", nome: "X", criadoEm: "2026-01-05T09:00:00Z" });
  assert.equal(s.garantia.dataCompra, "2026-01-05");
  assert.equal(s.garantia.fim, "2029-01-05");
});
