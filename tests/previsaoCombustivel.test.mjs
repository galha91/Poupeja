import { test } from "node:test";
import assert from "node:assert/strict";
import { proximaSegunda, extrairJson, validarPrevisao, vaiSubir, construirEmailPrevisao } from "../lib/previsaoCombustivel.js";

test("próxima segunda a partir de sexta, sábado, domingo e segunda (Lisboa)", () => {
  assert.equal(proximaSegunda(new Date("2026-10-16T16:30:00Z")), "2026-10-19"); // sexta
  assert.equal(proximaSegunda(new Date("2026-10-17T09:30:00Z")), "2026-10-19"); // sábado
  assert.equal(proximaSegunda(new Date("2026-10-18T22:30:00Z")), "2026-10-19"); // domingo à noite
  assert.equal(proximaSegunda(new Date("2026-10-19T08:00:00Z")), "2026-10-26"); // segunda: a seguinte
  assert.equal(proximaSegunda(new Date("2026-10-18T23:30:00Z")), "2026-10-26"); // já é segunda em Lisboa (UTC+1)
});

test("extrai o JSON com texto e ```json à volta", () => {
  const t = 'Encontrei isto:\n```json\n{"semana":"2026-10-19","encontrado":true,"gasoleo_cent":4,"fontes":[{"titulo":"ECO","url":"https://eco.sapo.pt/x"}]}\n```';
  assert.equal(extrairJson(t).gasoleo_cent, 4);
  assert.equal(extrairJson("sem json"), null);
});

const bruto = {
  semana: "2026-10-19", encontrado: true, gasoleo_cent: "4,5", gasolina_cent: -1.5,
  fontes: [{ titulo: "ECO", url: "https://eco.sapo.pt/a" }, { titulo: "mau", url: "javascript:alert(1)" }],
  resumo: "Gasóleo sobe, gasolina desce.",
};

test("valida semana, valores e fontes", () => {
  const p = validarPrevisao(bruto, "2026-10-19");
  assert.equal(p.gasoleo, 4.5);
  assert.equal(p.gasolina, -1.5);
  assert.equal(p.fontes.length, 1);
  assert.equal(validarPrevisao(bruto, "2026-10-26"), null);                         // outra semana
  assert.equal(validarPrevisao({ ...bruto, encontrado: false }, "2026-10-19"), null);
  assert.equal(validarPrevisao({ ...bruto, gasoleo_cent: 90 }, "2026-10-19"), null); // absurdo
  assert.equal(validarPrevisao({ ...bruto, fontes: [] }, "2026-10-19"), null);       // sem fonte
  assert.equal(validarPrevisao({ ...bruto, gasoleo_cent: null, gasolina_cent: null }, "2026-10-19"), null);
});

test("só avisa quando sobe pelo menos 1 cêntimo", () => {
  assert.equal(vaiSubir({ gasoleo: 4.5, gasolina: -1.5 }), true);
  assert.equal(vaiSubir({ gasoleo: 0.5, gasolina: -2 }), false);
  assert.equal(vaiSubir({ gasoleo: null, gasolina: 1 }), true);
});

test("email com valores, fontes e cancelamento", () => {
  const previsao = validarPrevisao(bruto, "2026-10-19");
  const unsub = "https://exemplo.pt/api/cancelar-combustivel?s=1&t=x&so=alerta";
  const r = construirEmailPrevisao({ previsao, base: "https://exemplo.pt", pagina: "https://exemplo.pt/combustiveis/braga", unsubscribeUrl: unsub });
  assert.match(r.subject, /Gasóleo \+4,5 cênt\. a partir de segunda \(19\/10\)/);
  assert.doesNotMatch(r.subject, /Gasolina/);
  assert.match(r.text, /Gasóleo: sobe cerca de 4,5 cênt\.\/L/);
  assert.match(r.text, /Gasolina 95: desce cerca de 1,5 cênt\.\/L/);
  assert.match(r.html, /2,25 €/); // 4,5 cênt. × 50 L
  assert.ok(r.html.includes("https://eco.sapo.pt/a") && r.text.includes(unsub));
  assert.ok(r.html.includes(unsub.replace(/&/g, "&amp;")));
});
