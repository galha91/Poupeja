import { test } from "node:test";
import assert from "node:assert/strict";
import {
  anualizar, mensalizar, proximaRenovacao, proximoMarco, poupancaPossivel, normalizarConta,
} from "../lib/renovacoes.js";

const HOJE = "2026-10-03";

test("anualiza conforme a periodicidade", () => {
  assert.equal(anualizar(42.5, "mensal"), 510);
  assert.equal(anualizar(90, "trimestral"), 360);
  assert.equal(anualizar(150, "semestral"), 300);
  assert.equal(anualizar(320.4, "anual"), 320.4);
  assert.equal(anualizar(33.33), 399.96);
  assert.equal(anualizar(-1), null);
  assert.equal(anualizar(10, "semanal"), null);
});

test("mensaliza para comparar contas com periodicidades diferentes", () => {
  assert.equal(mensalizar(360, "anual"), 30);
  assert.equal(mensalizar(90, "trimestral"), 30);
});

test("renovação é anual: data passada avança para o próximo aniversário", () => {
  assert.equal(proximaRenovacao("2026-12-01", HOJE), "2026-12-01");
  assert.equal(proximaRenovacao("2024-05-15", HOJE), "2027-05-15");
  assert.equal(proximaRenovacao("2026-10-03", HOJE), "2026-10-03");
  assert.equal(proximaRenovacao("2024-02-29", HOJE), "2027-02-28");
  assert.equal(proximaRenovacao(null, HOJE), null);
});

test("o marco é a data mais próxima entre fidelização e renovação", () => {
  assert.deepEqual(
    proximoMarco({ fimFidelizacao: "2026-11-20", dataRenovacao: "2026-03-01" }, HOJE),
    { data: "2026-11-20", motivo: "fidelizacao" },
  );
  assert.deepEqual(
    proximoMarco({ fimFidelizacao: "2027-06-01", dataRenovacao: "2026-03-01" }, HOJE),
    { data: "2027-03-01", motivo: "renovacao" },
  );
  // Fidelização já acabou: deixa de contar.
  assert.equal(proximoMarco({ fimFidelizacao: "2026-01-01" }, HOJE), null);
});

test("poupança possível com o resultado da ERSE (nunca negativa)", () => {
  assert.equal(poupancaPossivel({ valor: 60, periodicidade: "mensal", resultadoErse: { valorAnual: 610 } }), 110);
  assert.equal(poupancaPossivel({ valor: 50, periodicidade: "mensal", resultadoErse: { valorAnual: 700 } }), 0);
  assert.equal(poupancaPossivel({ valor: 50, periodicidade: "mensal" }), null);
});

test("formulário: tipo, valor e uma das datas", () => {
  const r = normalizarConta({ tipo: "telecom", valor: "39,99", dataRenovacao: "", fimFidelizacao: "2027-01-31" });
  assert.equal(r.ok, true);
  assert.equal(r.conta.valor, 39.99);
  assert.equal(r.conta.periodicidade, "mensal");
  assert.equal(r.conta.fimFidelizacao, "2027-01-31");
  assert.equal(normalizarConta({ tipo: "telecom", valor: "39,99" }).ok, false);
  assert.equal(normalizarConta({ tipo: "agua", valor: "10", dataRenovacao: "2027-01-01" }).ok, false);
  assert.equal(normalizarConta({ tipo: "seguro", valor: "0", dataRenovacao: "2027-01-01" }).ok, false);
  // Dados de energia inventados são descartados.
  const e = normalizarConta({ tipo: "eletricidade", valor: 50, dataRenovacao: "2027-01-01", potencia: "99", opcaoHoraria: "bi" });
  assert.equal(e.conta.potencia, null);
  assert.equal(e.conta.opcaoHoraria, "bi");
});
