/*
 * Recolhe, para cada artigo do catálogo da lista, o que a API do site
 * devolve (nome, secção, preço de cada produto), em auditoria/pesquisas.json.
 * Serve para afinar a relevância offline, com dados reais das lojas.
 * Uma pesquisa a cada 2 s (limite de 40/min da API). (2.ª volta)
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { ITENS } from "../data/catalogo-lista.js";

const BASE = process.argv[2] || "https://www.xn--poupej-uta.com";
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
const saida = {};
// 3.ª volta: só os artigos cujo termo de pesquisa mudou.
const SO = new Set(["febras", "legumes para sopa", "batatas pré-fritas", "espinafres congelados", "multiusos"]);
for (const [n, it] of ITENS.filter((x) => SO.has(x.q)).entries()) {
  try {
    const r = await fetch(`${BASE}/api/precos-supermercado?q=${encodeURIComponent(it.q)}`);
    const j = await r.json();
    saida[it.q] = {
      nome: it.nome,
      lojas: (j.lojas || []).map((l) => `${l.id}:${l.ok ? "ok" : "erro"}`),
      produtos: (j.produtos || []).map((p) => ({
        loja: p.loja, nome: p.nome, categoria: p.categoria || "", unidade: p.unidade, preco: p.preco,
        precoUnidade: p.precoUnidade, qtdBase: p.qtdBase, aoPeso: p.aoPeso, id: p.id,
        validoDe: p.validoDe, validoAte: p.validoAte, soComCartao: p.soComCartao, relevancia: p.relevancia,
      })),
    };
    console.log(`${n + 1}/${ITENS.length} ${it.q}: ${saida[it.q].produtos.length}`);
  } catch (e) {
    console.log(`${n + 1}/${ITENS.length} ${it.q}: FALHOU (${e.message})`);
  }
  await espera(2000);
}
mkdirSync(new URL("../auditoria/", import.meta.url), { recursive: true });
writeFileSync(new URL("../auditoria/pesquisas.json", import.meta.url), JSON.stringify(saida));
