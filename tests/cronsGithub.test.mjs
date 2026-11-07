import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CRONS_GITHUB } from "../lib/cronsGithub.js";

const workflow = readFileSync(new URL("../.github/workflows/historico-precos.yml", import.meta.url), "utf8");
const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));

test("crons do GitHub: o /admin tem os mesmos horários que o workflow", () => {
  for (const { path, schedule } of CRONS_GITHUB) {
    const rota = path.split("/").pop();
    assert.ok(workflow.includes(`- cron: '${schedule}'`), `${schedule} agendado no workflow`);
    const esc = schedule.replace(/[*]/g, "\\*");
    assert.match(workflow, new RegExp(`"schedule:${esc}"\\)\\s+echo "args=${rota}"`), `${schedule} corre ${rota}`);
  }
});

test("crons do GitHub: cada reserva corre uma parte com --reserva", () => {
  const reservas = [...workflow.matchAll(/"schedule:([^"]+)"\)\s+echo "args=(cron-[a-z0-9-]+) --reserva \d+"/g)];
  assert.equal(reservas.length, CRONS_GITHUB.length);
  for (const [, agenda] of reservas) assert.ok(workflow.includes(`- cron: '${agenda}'`), `${agenda} agendado`);
});

test("crons do GitHub: não correm também na Vercel", () => {
  const naVercel = new Set(vercel.crons.map((c) => c.path));
  for (const { path } of CRONS_GITHUB) assert.ok(!naVercel.has(path), `${path} ainda está no vercel.json`);
});
