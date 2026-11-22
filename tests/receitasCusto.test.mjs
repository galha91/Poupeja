import { test } from "node:test";
import assert from "node:assert/strict";
import { custosValidos, eurosPP } from "../lib/receitasCusto.js";
import { mapaCustos } from "../lib/receitasCustoGerar.js";
import { receitaDoEmail, construirEmailFolhetos } from "../lib/emailFolhetos.js";

test("custo das receitas: só serve o mapa recente e limpo", () => {
  const agora = Date.now();
  const props = { geradoEm: new Date(agora - 3600e3).toISOString(), custos: { "caldo-verde": 0.9, "<script>": 1, "x": -2, "y": 99 } };
  assert.deepEqual(custosValidos(props, agora), { "caldo-verde": 0.9 });
  assert.equal(custosValidos({ ...props, geradoEm: new Date(agora - 4 * 864e5).toISOString() }, agora), null);
  assert.equal(custosValidos({ geradoEm: new Date().toISOString(), custos: {} }), null);
  assert.equal(custosValidos(null), null);
  assert.equal(eurosPP(1.5), "1,50 €");
});

test("custo das receitas: o mapa só leva receitas com preços suficientes", () => {
  const resumo = (valor, unidade) => ({ unidade, ofertas: [{ valor, lojaNome: "Continente" }] });
  const resumos = new Map([["batatas", resumo(1, "kg")], ["cebolas", resumo(2, "kg")]]);
  const lista = [
    { id: "com-preco", porcoes: 4, ingredientes: [{ compra: "Batatas", u: "g", q: 1000 }] },
    { id: "sem-preco", porcoes: 4, ingredientes: [{ compra: "Inexistente", u: "g", q: 100 }] },
  ];
  const m = mapaCustos(lista, resumos);
  assert.ok(m["com-preco"] > 0);
  assert.equal(m["sem-preco"], undefined);
});

test("email semanal: o jantar da semana, com e sem custo", () => {
  const r = { id: "caldo-verde", nome: "Caldo verde", emoji: "🍲", tempoMin: 35 };
  assert.equal(receitaDoEmail(r, { "caldo-verde": 0.9 }).pp, 0.9);
  assert.equal(receitaDoEmail(r, null).pp, null);
  assert.equal(receitaDoEmail(null), null);
  const base = "https://exemplo.pt";
  const folhetos = [{ loja: "Continente", url: "https://exemplo.pt/f" }];
  const com = construirEmailFolhetos({ nome: "Ana", folhetos, base, receita: receitaDoEmail(r, { "caldo-verde": 0.9 }) });
  assert.match(com.html, /Jantar da semana/);
  assert.match(com.html, /0,90 € por pessoa/);
  assert.match(com.text, /receitas\/caldo-verde\?o=email-receita/);
  const sem = construirEmailFolhetos({ nome: "Ana", folhetos, base });
  assert.doesNotMatch(sem.html, /Jantar da semana/);
});
