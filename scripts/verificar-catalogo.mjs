/*
 * Verifica que artigos do catálogo da lista têm preço comparável.
 *
 * Para cada artigo de data/catalogo-lista.js pergunta à API do site
 * (/api/precos-supermercado) e conta em quantos supermercados aparece o
 * próprio artigo (relevância 2). Com pelo menos 2 lojas, "comPreco"; sem
 * nenhuma, "semPreco". Escreve data/catalogo-precos.json — um relatório
 * para afinar os termos de pesquisa do catálogo. A app pergunta SEMPRE às
 * lojas pelos preços do momento, incluindo pelos "semPreco".
 *
 * Uso:  node scripts/verificar-catalogo.mjs [https://www.xn--poupej-uta.com]
 * Demora uns 8 minutos: uma pesquisa a cada 2 s, para respeitar o limite
 * de 40 pesquisas por minuto da API.
 */
import { writeFileSync } from "node:fs";
import { ITENS } from "../data/catalogo-lista.js";

const BASE = process.argv[2] || process.env.BASE_URL || "https://www.xn--poupej-uta.com";
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));

const comPreco = [], semPreco = [], poucasLojas = [], falhas = [];
for (const [n, it] of ITENS.entries()) {
  try {
    const r = await fetch(`${BASE}/api/precos-supermercado?q=${encodeURIComponent(it.q)}`);
    const j = await r.json();
    if (!r.ok && !j.produtos) throw new Error(j.erro || `HTTP ${r.status}`);
    const lojas = new Set((j.produtos || []).filter((p) => p.relevancia === 2).map((p) => p.loja));
    (lojas.size >= 2 ? comPreco : lojas.size === 1 ? poucasLojas : semPreco).push(it.id);
    console.log(`${n + 1}/${ITENS.length} ${it.q}: ${lojas.size} lojas`);
  } catch (e) {
    falhas.push(it.id);
    console.log(`${n + 1}/${ITENS.length} ${it.q}: FALHOU (${e.message})`);
  }
  await espera(2000);
}

const saida = {
  verificadoEm: new Date().toISOString().slice(0, 10),
  fonte: `${BASE}/api/precos-supermercado`,
  nota: "Gerado por scripts/verificar-catalogo.mjs. semPreco: nenhum supermercado tem o artigo; poucasLojas: só um; porVerificar: a pesquisa falhou.",
  comPreco, poucasLojas, semPreco, porVerificar: falhas,
};
writeFileSync(new URL("../data/catalogo-precos.json", import.meta.url), JSON.stringify(saida, null, 2) + "\n");
console.log(`\ncom preço: ${comPreco.length} · só 1 loja: ${poucasLojas.length} · sem preço: ${semPreco.length} · falhou: ${falhas.length}`);
