import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// O handler importa módulos que o node não carrega sem bundler; a rotação
// é uma função pura, por isso testa-se o texto da função em isolamento.
const src = readFileSync(new URL("../pages/api/cron-historico-precos.js", import.meta.url), "utf8");
const corpo = src.match(/export function ordemDoDia[\s\S]*?\n}\n/)[0].replace("export ", "");
const POR_DIA = 12;
const ordemDoDia = new Function("POR_DIA", `${corpo}; return ordemDoDia;`)(POR_DIA);

const lista = Array.from({ length: 38 }, (_, i) => `a${i}`);

test("a lista roda de dia para dia e não perde nem repete artigos", () => {
  const d1 = ordemDoDia(lista, new Date("2026-10-13T07:15:00Z"));
  const d2 = ordemDoDia(lista, new Date("2026-10-14T07:15:00Z"));
  assert.notEqual(d1[0], d2[0]);
  assert.deepEqual([...d1].sort(), [...lista].sort());
});

test("em 4 dias seguidos, os primeiros 12 de cada dia cobrem a lista toda", () => {
  const vistos = new Set();
  for (let d = 0; d < 4; d++) {
    const ordem = ordemDoDia(lista, new Date(Date.UTC(2026, 9, 13 + d, 7, 15)));
    ordem.slice(0, 12).forEach(a => vistos.add(a));
  }
  assert.equal(vistos.size, 38);
});
