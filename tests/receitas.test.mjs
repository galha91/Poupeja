import { test } from "node:test";
import assert from "node:assert/strict";
import { INGREDIENTES } from "../lib/receitas/ingredientes.js";
import { RECEITAS } from "../lib/receitas/dados.js";
import {
  receitas, receitaPorId, compativel, gerarPlano, trocarDia, alternarFixa, regenerar, comprasDoPlano,
  formatarQtd, ingredientesPara, minutosDoPasso, faixaMaxima, PREFS_PADRAO, DIETAS, VONTADES, EQUIPAMENTOS,
} from "../lib/receitas/motor.js";
import { itemPorNome } from "../data/catalogo-lista.js";
import { MAX_ARTIGOS } from "../lib/listaCompras.js";

const prefs = (extra = {}) => ({ ...PREFS_PADRAO, ...extra });
const doPlano = (p) => p.dias.map((d) => receitaPorId(d.id));

test("dados: ids únicos, ingredientes conhecidos, artigos do catálogo", () => {
  const ids = RECEITAS.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, "ids repetidos");
  for (const r of RECEITAS) {
    assert.match(r.id, /^[a-z0-9-]+$/);
    assert.ok(["prato", "sopa"].includes(r.tipo), r.id);
    assert.ok([1, 2, 3].includes(r.custo), r.id);
    assert.ok(r.passos.length >= 3, r.id);
    for (const [k, q] of r.ing) {
      assert.ok(INGREDIENTES[k], `${r.id}: ${k}`);
      assert.ok(q > 0, `${r.id}: ${k}`);
    }
    for (const e of r.equip.flat()) assert.ok(EQUIPAMENTOS.some((x) => x.id === e), `${r.id}: ${e}`);
  }
  for (const [k, i] of Object.entries(INGREDIENTES)) {
    if (i.compra) assert.ok(itemPorNome(i.compra), `${k}: "${i.compra}" não está no catálogo da lista`);
  }
});

test("cada aparelho tem receitas; quase todos chegam sozinhos para um jantar", () => {
  const TAGS = ["familia", "conforto", "takeaway"];
  for (const r of RECEITAS) for (const t of r.tags) assert.ok(TAGS.includes(t), `${r.id}: tag "${t}" (rápido/leve saem das contas)`);
  for (const e of EQUIPAMENTOS) {
    const usam = receitas().filter((r) => r.equip.flat().includes(e.id));
    assert.ok(usam.length >= 1, `nenhuma receita usa ${e.id}`);
    // Só com este aparelho em casa há pelo menos uma receita (a picadora precisa de algo que coza).
    if (e.id !== "processador") {
      const sozinho = receitas().filter((r) => compativel(r, prefs({ equip: [e.id] })));
      assert.ok(sozinho.length >= 1, `só com ${e.id} não há receitas`);
    }
  }
  // Os aparelhos que mudam a forma de cozinhar desbloqueiam receitas que o fogão e o forno não fazem.
  for (const id of ["microondas", "panela-pressao", "slowcooker", "robo", "processador"]) {
    const sem = receitas().filter((r) => compativel(r, prefs({ equip: ["fogao", "forno"] }))).length;
    const com = receitas().filter((r) => compativel(r, prefs({ equip: ["fogao", "forno", id] }))).length;
    assert.ok(com > sem, `${id} não desbloqueia nada`);
  }
});

test("nutrição: plausível por pessoa", () => {
  for (const r of receitas()) {
    const n = r.nutricao;
    const min = r.tipo === "sopa" ? 120 : 250;
    assert.ok(n.kcal >= min && n.kcal <= 900, `${r.id}: ${n.kcal} kcal`);
    // As calorias batem certo com os macronutrientes (±25%).
    const calc = n.p * 4 + n.hc * 4 + n.g * 9;
    assert.ok(Math.abs(calc - n.kcal) / n.kcal < 0.25, `${r.id}: ${calc} vs ${n.kcal}`);
  }
});

test("dietas saem dos ingredientes", () => {
  const caldo = receitaPorId("caldo-verde");
  assert.ok(!caldo.veg, "caldo verde tem chouriço");
  assert.ok(caldo.dietas.includes("sem-gluten"));
  assert.ok(receitaPorId("sopa-abobora").vegano);
  assert.ok(!receitaPorId("omelete-legumes").vegano);
  assert.ok(receitaPorId("omelete-legumes").veg);
  assert.ok(!receitaPorId("esparguete-atum").dietas.includes("sem-gluten"));
  assert.ok(!receitaPorId("strogonoff-frango").dietas.includes("sem-lactose"));
  // Ninguém fica sem jantares: cada dieta tem pelo menos 5 pratos.
  for (const d of DIETAS) {
    const n = receitas().filter((r) => r.tipo === "prato" && compativel(r, prefs({ dietas: [d.id] }))).length;
    assert.ok(n >= 5, `${d.id}: ${n} pratos`);
  }
});

test("vontades calculadas", () => {
  for (const v of VONTADES) assert.ok(receitas().some((r) => r.vontades.includes(v.id)), `nenhuma receita: ${v.id}`);
  assert.ok(receitaPorId("esparguete-alho").vontades.includes("rapido"));
  assert.ok(receitaPorId("bifanas").vontades.includes("takeaway"));
});

test("compatível: o que evita (com família) e o que tem na cozinha", () => {
  const cebolada = receitaPorId("salada-grao-atum"); // cebola roxa
  assert.ok(!compativel(cebolada, prefs({ evitar: ["cebola"] })));
  assert.ok(compativel(receitaPorId("frango-forno"), prefs({ equip: ["fogao", "airfryer"] })), "air fryer serve no lugar do forno");
  assert.ok(!compativel(receitaPorId("frango-forno"), prefs({ equip: ["fogao"] })));
  assert.ok(!compativel(receitaPorId("sopa-abobora"), prefs({ equip: ["fogao", "forno"] })), "precisa de varinha");
});

test("plano: respeita dietas, evitar, nº de jantares, sem repetidas", () => {
  for (let s = 1; s <= 30; s++) {
    const p = gerarPlano(prefs({ jantares: 5, dietas: ["vegetariano"], evitar: ["ovo"] }), { semente: s });
    assert.equal(p.dias.length, 5);
    const rs = doPlano(p);
    for (const r of rs) {
      assert.ok(r.veg, `${r.id} não é vegetariano`);
      assert.ok(!r.ingredientes.some((i) => i.key === "ovo"), `${r.id} tem ovo`);
    }
    assert.equal(new Set(rs.map((r) => r.id)).size, 5, "repetiu receita");
    assert.ok(p.sopa && receitaPorId(p.sopa.id).tipo === "sopa");
  }
});

test("plano: com poucas compatíveis, repete e diz que repetiu", () => {
  const p = gerarPlano(prefs({ jantares: 7, dietas: ["vegano"] }), { semente: 3 });
  assert.equal(p.dias.length, 7);
  assert.ok(p.dias.every((d) => d.id));
  assert.ok(p.dias.some((d) => d.repetida));
});

test("plano: vontades puxam as receitas certas", () => {
  let rapidas = 0;
  for (let s = 1; s <= 20; s++) {
    const p = gerarPlano(prefs({ vontades: ["rapido"] }), { semente: s });
    rapidas += doPlano(p).filter((r) => r.tempoMin <= 25).length;
  }
  assert.ok(rapidas / 100 > 0.8, `só ${rapidas}% rápidas`);
});

test("plano: orçamento curto evita €€€", () => {
  assert.equal(faixaMaxima(prefs({ orcamento: 20, pessoas: 4, jantares: 5 })), 1);
  assert.equal(faixaMaxima(prefs({ orcamento: 150, pessoas: 2, jantares: 5 })), 3);
  for (let s = 1; s <= 20; s++) {
    const p = gerarPlano(prefs({ orcamento: 20, pessoas: 4 }), { semente: s });
    assert.ok(doPlano(p).every((r) => r.custo <= 2));
  }
});

test("plano: não repete a proteína em dias seguidos (quase nunca)", () => {
  let seguidas = 0;
  for (let s = 1; s <= 40; s++) {
    const rs = doPlano(gerarPlano(prefs(), { semente: s }));
    for (let i = 1; i < rs.length; i++) if (rs[i].proteina === rs[i - 1].proteina) seguidas++;
  }
  assert.ok(seguidas <= 25, `${seguidas} repetições em 160 pares`);
});

test("plano: mesma semente, mesmo plano; fixar e trocar", () => {
  const a = gerarPlano(prefs(), { semente: 7 });
  const b = gerarPlano(prefs(), { semente: 7 });
  assert.deepEqual(a.dias, b.dias);

  const fixado = alternarFixa(a, 2);
  assert.ok(fixado.dias[2].fixa);
  const novo = regenerar(fixado, { semente: 99 });
  assert.equal(novo.dias[2].id, a.dias[2].id, "o dia fixado ficou");
  assert.ok(novo.dias[2].fixa);

  const trocado = trocarDia(a, 1, { semente: 5 });
  assert.notEqual(trocado.dias[1].id, a.dias[1].id);
  assert.equal(trocado.dias[0].id, a.dias[0].id);
  assert.ok(!a.dias.some((d) => d.id === trocado.dias[1].id), "trocou por uma que já estava no plano");

  const outraSopa = trocarDia(a, "sopa", { semente: 5 });
  assert.notEqual(outraSopa.sopa.id, a.sopa.id);
});

test("compras do plano: somadas, à escala, cabem na comparação", () => {
  const p = gerarPlano(prefs({ pessoas: 2, jantares: 7 }), { semente: 11 });
  const c = comprasDoPlano(p);
  const keys = c.map((x) => x.key);
  assert.equal(new Set(keys).size, keys.length, "artigo repetido");
  assert.ok(c.filter((x) => !x.despensa).length <= MAX_ARTIGOS, "não cabe na comparação");
  // Despensa no fim.
  const i = c.findIndex((x) => x.despensa);
  if (i >= 0) assert.ok(c.slice(i).every((x) => x.despensa));
});

test("quantidades: escala e formato", () => {
  assert.equal(formatarQtd(500, "g"), "500 g");
  assert.equal(formatarQtd(1200, "g"), "1,2 kg");
  assert.equal(formatarQtd(63, "g"), "65 g");
  assert.equal(formatarQtd(0.5, "lata"), "½ lata");
  assert.equal(formatarQtd(2, "lata"), "2 latas");
  assert.equal(formatarQtd(1.5, "un"), "1½ un");
  assert.equal(formatarQtd(2.5, "dente"), "3 dentes");
  assert.equal(formatarQtd(1, "q.b."), "q.b.");
  const r = receitaPorId("tortilha");
  const dois = ingredientesPara(r, 2);
  assert.equal(dois.find((i) => i.key === "ovo").qtd, "3 un");
  assert.equal(dois.find((i) => i.key === "batata").qtd, "300 g");
});

test("temporizador do passo", () => {
  assert.equal(minutosDoPasso("Coze a batata (20 min)."), 20);
  assert.equal(minutosDoPasso("Forno 200 °C, 50-60 min"), 50);
  assert.equal(minutosDoPasso("Serve com salsa."), null);
});
