import { test } from "node:test";
import assert from "node:assert/strict";
import { construirEmailCabaz, assuntoCabaz } from "../lib/emailCabaz.js";
import { urlUnsub } from "../lib/unsubscribeToken.js";

const cabaz = (empate) => ({
  loja: "continente", nome: "Continente", total: 8.63, empate, dia: "2026-11-25",
  cara: { loja: "auchan", nome: "Auchan", total: 9.87 },
  porLoja: [
    { loja: "continente", nome: "Continente", total: 8.63 },
    { loja: "pingo-doce", nome: "Pingo Doce", total: 8.71 },
    { loja: "auchan", nome: "Auchan", total: 9.87 },
  ],
  artigos: ["Leite meio-gordo", "Ovos", "Pão de forma"],
});
const base = "https://exemplo.pt";

test("email do cabaz: o assunto diz o vencedor ou o empate", () => {
  assert.equal(assuntoCabaz(cabaz(false)), "🛒 Cabaz da semana: mais barato no Continente (8,63\u00a0€)");
  assert.equal(assuntoCabaz(cabaz(true)), "🛒 Cabaz da semana: Continente e Pingo Doce quase empatados");
});

test("email do cabaz: tabela, variação, ligações etiquetadas e cancelamento", () => {
  const e = construirEmailCabaz({ nome: "Ana Silva", cabaz: cabaz(false), variacao: { diff: -0.12 }, base, unsubscribeUrl: `${base}/u` });
  // O destaque vem antes de tudo: a cadeia mais barata e o preço, em grande.
  assert.match(e.html, /Mais barato esta semana/);
  assert.ok(e.html.indexOf("Mais barato esta semana") < e.html.indexOf("Ana, o cabaz fica mais barato no Continente"));
  assert.match(e.html, /Ana, o cabaz fica mais barato no Continente/);
  assert.match(e.html, /9,87\u00a0€/);
  assert.match(e.html, /desceu 0,12\u00a0€/);
  assert.match(e.html, /\?atalho=lista&o=email-cabaz/);
  assert.match(e.html, /Deixar de receber o cabaz/);
  assert.match(e.text, /1\. Continente: 8,63/);
  assert.doesNotMatch(e.html, /ceia de Natal/);
});

test("email do cabaz: na época junta uma linha da ceia de Natal", () => {
  const natal = { porLoja: [{ loja: "auchan", nome: "Auchan", total: 56.83 }, { loja: "continente", nome: "Continente", total: 65.47 }] };
  const e = construirEmailCabaz({ nome: "", cabaz: cabaz(true), natal, base, unsubscribeUrl: `${base}/u` });
  assert.match(e.html, /ceia de Natal para 6 pessoas vai de <strong>56,83\u00a0€<\/strong> no Auchan/);
  assert.match(e.html, /ceia-de-natal\?o=email-cabaz-natal/);
  assert.match(e.html, /Esta semana há empate/);
  assert.match(e.html, /Olá, o cabaz vai de/);
});

test("cancelamento: o link do cabaz só desliga o cabaz", () => {
  process.env.UNSUBSCRIBE_SECRET ||= "segredo-de-teste";
  assert.match(urlUnsub(base, "abc", "cabaz"), /&tipo=cabaz$/);
  assert.doesNotMatch(urlUnsub(base, "abc"), /tipo=/);
});
