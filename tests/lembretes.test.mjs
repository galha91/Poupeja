import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { datasLembrete, estadoLembrete, gerarIcs, gatilho } from "../lib/lembretes.js";
import { proximoPeriodo, filtrarPorPerfil, ordenarPrazos, prazoValido } from "../lib/prazosEstado.js";
import { calcularAvisos } from "../lib/avisos.js";
import { validarCopia, juntarPorId } from "../lib/copia.js";

const HOJE = "2026-10-03";

test("lembretes 60 e 30 dias antes", () => {
  assert.deepEqual(datasLembrete("2027-01-15", [30, 60]), [
    { dias: 60, data: "2026-11-16" },
    { dias: 30, data: "2026-12-16" },
  ]);
  assert.deepEqual(datasLembrete("nada", [60]), []);
});

test("estado do lembrete: inativo antes do 1.º marco, ativo até ao dia", () => {
  assert.deepEqual(estadoLembrete("2026-12-03", HOJE, [60, 30]), { dias: 61, ativo: false, marco: null });
  assert.deepEqual(estadoLembrete("2026-12-02", HOJE, [60, 30]), { dias: 60, ativo: true, marco: 60 });
  assert.deepEqual(estadoLembrete("2026-11-01", HOJE, [60, 30]), { dias: 29, ativo: true, marco: 30 });
  assert.deepEqual(estadoLembrete("2026-10-03", HOJE, [60, 30]), { dias: 0, ativo: true, marco: 30 });
  assert.equal(estadoLembrete("2026-10-02", HOJE, [60, 30]).ativo, false);
});

test("alarme do .ics às 9:00 do dia certo", () => {
  assert.equal(gatilho(60), "-P59DT15H");
  assert.equal(gatilho(1), "-P0DT15H");
  assert.equal(gatilho(0), "PT9H");
});

test(".ics válido: dia inteiro, alarmes, texto escapado e linhas dobradas", () => {
  const ics = gerarIcs([{
    uid: "g-1", titulo: "Garantia: Máquina de lavar, Bosch; série 6", data: "2029-09-01", alarmes: [60, 30],
    descricao: "Linha 1\nLinha 2 " + "é".repeat(60),
  }], new Date(Date.UTC(2026, 9, 3, 10, 0, 0)));
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.match(ics, /DTSTART;VALUE=DATE:20290901\r\n/);
  assert.match(ics, /DTEND;VALUE=DATE:20290902\r\n/);
  assert.match(ics, /DTSTAMP:20261003T100000Z/);
  assert.match(ics, /SUMMARY:Garantia: Máquina de lavar\\, Bosch\\; série 6/);
  assert.equal((ics.match(/BEGIN:VALARM/g) || []).length, 2);
  assert.match(ics, /TRIGGER:-P59DT15H/);
  assert.match(ics, /TRIGGER:-P29DT15H/);
  assert.match(ics, /Linha 1\\nLinha 2/);
  const enc = new TextEncoder();
  for (const l of ics.split("\r\n")) assert.ok(enc.encode(l).length <= 75, `linha longa: ${l}`);
});

test("ignora eventos sem data válida", () => {
  const ics = gerarIcs([{ uid: "x", titulo: "X", data: "2026-13-01" }]);
  assert.equal(ics.includes("BEGIN:VEVENT"), false);
});

const IRS = { tipo: "anual", periodos: [{ inicio: "04-01", fim: "06-30" }] };
const IMI = { tipo: "anual", periodos: [{ fim: "05-31" }, { fim: "08-31" }, { fim: "11-30" }] };
const FEV = { tipo: "anual", periodos: [{ inicio: "01-01", fim: "02-29" }] };

test("próximo período: este ano se ainda não acabou, senão o próximo", () => {
  assert.deepEqual(proximoPeriodo(IRS, HOJE), { inicio: "2027-04-01", fim: "2027-06-30", aberto: false });
  assert.deepEqual(proximoPeriodo(IRS, "2027-05-10"), { inicio: "2027-04-01", fim: "2027-06-30", aberto: true });
  assert.deepEqual(proximoPeriodo(IMI, HOJE), { inicio: null, fim: "2026-11-30", aberto: true });
  assert.equal(proximoPeriodo(IMI, "2026-12-01").fim, "2027-05-31");
  assert.equal(proximoPeriodo(FEV, HOJE).fim, "2027-02-28");
  assert.equal(proximoPeriodo(FEV, "2027-03-01").fim, "2028-02-29");
  assert.equal(proximoPeriodo({ tipo: "continuo" }, HOJE), null);
});

test("filtros de perfil: sem perfil mostra tudo; 'todos' aparece sempre", () => {
  const ps = [{ id: "a", perfis: ["todos"] }, { id: "b", perfis: ["filhos"] }, { id: "c", perfis: ["jovem", "estudante"] }];
  assert.deepEqual(filtrarPorPerfil(ps, []).map(p => p.id), ["a", "b", "c"]);
  assert.deepEqual(filtrarPorPerfil(ps, ["filhos"]).map(p => p.id), ["a", "b"]);
  assert.deepEqual(filtrarPorPerfil(ps, ["estudante"]).map(p => p.id), ["a", "c"]);
});

test("ordena por prazo mais próximo; contínuos no fim", () => {
  const ps = ordenarPrazos([
    { id: "irs", prazo: IRS }, { id: "ts", prazo: { tipo: "continuo" } }, { id: "imi", prazo: IMI }, { id: "fev", prazo: FEV },
  ], HOJE);
  assert.deepEqual(ps.map(p => p.id), ["imi", "fev", "irs", "ts"]);
});

test("o ficheiro de prazos é válido e todos os itens têm fonte e verificação", () => {
  const dados = JSON.parse(readFileSync(new URL("../data/prazos-estado.json", import.meta.url)));
  const ids = new Set();
  for (const p of dados.prazos) {
    assert.ok(prazoValido(p), `prazo inválido: ${p.id}`);
    assert.ok(!ids.has(p.id), `id repetido: ${p.id}`);
    ids.add(p.id);
    assert.match(p.verificado, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(p.quemPode && p.prazoTexto && p.descricao, `faltam campos: ${p.id}`);
  }
});

test("avisos do sino: garantias, contas e prazos, mais urgente primeiro", () => {
  const avisos = calcularAvisos({
    garantias: [
      { id: "1", produto: "TV", fim: "2026-11-10" },
      { id: "2", produto: "Forno", fim: "2027-11-10" },
      { id: "3", produto: "Rádio", fim: "2026-10-10", lembrete: false },
    ],
    contas: [
      { id: "a", tipo: "telecom", lembrete: true, fimFidelizacao: "2026-10-20" },
      { id: "b", tipo: "seguro", lembrete: false, dataRenovacao: "2026-10-05" },
    ],
    prazos: [{ id: "imi", titulo: "Pagar o IMI", prazo: IMI }, { id: "irs", titulo: "IRS", prazo: IRS }],
    prazosComLembrete: ["imi", "irs"],
  }, "2026-11-05");
  assert.deepEqual(avisos.map(a => [a.tipo, a.dias]), [["garantia", 5], ["prazo", 25]]);

  const out = calcularAvisos({ contas: [{ id: "a", tipo: "telecom", lembrete: true, fimFidelizacao: "2026-10-20" }] }, HOJE);
  assert.equal(out[0].titulo, "Internet e telemóvel");
  assert.equal(out[0].marco, 30);
});

test("cópia de segurança: validação e junção sem duplicar", () => {
  assert.equal(validarCopia(null).ok, false);
  assert.equal(validarCopia({ app: "outra" }).ok, false);
  assert.equal(validarCopia({ app: "poupeja", versao: 99, garantias: [], renovacoes: [] }).ok, false);
  assert.equal(validarCopia({ app: "poupeja", versao: 1, garantias: [] }).ok, false);
  assert.equal(validarCopia({ app: "poupeja", versao: 1, garantias: [], renovacoes: [] }).ok, true);
  const r = juntarPorId([{ id: "a", v: 1 }], [{ id: "a", v: 2 }, { id: "b" }, { id: "b" }, null, {}]);
  assert.deepEqual(r, [{ id: "a", v: 1 }, { id: "b" }]);
});
