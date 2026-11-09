import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CRONS_GITHUB, proximaTarefa } from "../lib/cronsGithub.js";

const workflow = readFileSync(new URL("../.github/workflows/historico-precos.yml", import.meta.url), "utf8");
const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
const t = (iso) => new Date(iso);

test("crons do GitHub: o workflow acorda de hora a hora e usa o planeador", () => {
  assert.match(workflow, /- cron: '7 \* \* \* \*'/);
  assert.match(workflow, /node scripts\/cron\/planear\.mjs/);
  for (const { path } of CRONS_GITHUB) {
    const rota = path.split("/").pop();
    assert.ok(workflow.includes(rota), `${rota} disponível para correr à mão`);
  }
});

test("crons do GitHub: não correm também na Vercel", () => {
  const naVercel = new Set(vercel.crons.map((c) => c.path));
  for (const { path } of CRONS_GITHUB) assert.ok(!naVercel.has(path), `${path} ainda está no vercel.json`);
});

test("planeador: antes da primeira hora do dia não há nada a fazer", () => {
  assert.equal(proximaTarefa({}, t("2026-11-09T00:20:00Z")), null);
});

test("planeador: faz as tarefas pela ordem do dia, uma de cada vez", () => {
  const ontem = "2026-11-08T23:00:00Z";
  const todasOntem = { "cron-paginas-marca": ontem, "cron-historico-precos": ontem, "cron-historico-precos-2": ontem, "cron-historico-precos-3": ontem };
  assert.equal(proximaTarefa(todasOntem, t("2026-11-09T01:07:00Z")), "cron-paginas-marca");
  const paginasHoje = { ...todasOntem, "cron-paginas-marca": "2026-11-09T01:09:00Z" };
  assert.equal(proximaTarefa(paginasHoje, t("2026-11-09T05:07:00Z")), null);
  assert.equal(proximaTarefa(paginasHoje, t("2026-11-09T08:07:00Z")), "cron-historico-precos");
});

test("planeador: uma hora perdida é apanhada na seguinte", () => {
  // A parte 1 (07:17) não correu; às 14:07 ainda vem antes da parte 2.
  const exec = { "cron-paginas-marca": "2026-11-09T01:09:00Z", "cron-historico-precos": "2026-11-08T07:30:00Z" };
  assert.equal(proximaTarefa(exec, t("2026-11-09T14:07:00Z")), "cron-historico-precos");
  const depois = { ...exec, "cron-historico-precos": "2026-11-09T14:10:00Z" };
  assert.equal(proximaTarefa(depois, t("2026-11-09T15:07:00Z")), "cron-historico-precos-2");
});

test("planeador: tudo feito hoje, nada a fazer", () => {
  const hoje = "2026-11-09T20:00:00Z";
  const exec = Object.fromEntries(CRONS_GITHUB.map((c) => [c.path.split("/").pop(), hoje]));
  assert.equal(proximaTarefa(exec, t("2026-11-09T23:07:00Z")), null);
});
