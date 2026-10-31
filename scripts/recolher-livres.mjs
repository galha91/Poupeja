/*
 * Recolhe, para cada pesquisa de data/pesquisas-livres.js, o que a API do
 * site devolve — com o MESMO termo que a app envia (catálogo → q; senão o
 * texto limpo). Escreve auditoria/livres.json. Uma pesquisa a cada 2 s.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { PESQUISAS_LIVRES } from "../data/pesquisas-livres.js";
import { doCatalogo } from "../lib/catalogoLista.js";
import { termoDePesquisa, eGenerico } from "../lib/comparacao.js";

const BASE = process.argv[2] || "https://www.xn--poupej-uta.com";
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
const saida = {};
for (const [n, termo] of PESQUISAS_LIVRES.entries()) {
  const cat = doCatalogo(termo);
  const q = cat?.q || termoDePesquisa(termo);
  const generico = !cat && eGenerico(termo);
  saida[termo] = { q, catalogo: cat?.nome || null, generico, produtos: [] };
  if (!generico) {
    try {
      const r = await fetch(`${BASE}/api/precos-supermercado?q=${encodeURIComponent(q)}`);
      const j = await r.json();
      saida[termo].produtos = (j.produtos || []).map((p) => ({
        loja: p.loja, nome: p.nome, categoria: p.categoria || "", unidade: p.unidade, preco: p.preco,
        precoUnidade: p.precoUnidade, qtdBase: p.qtdBase, aoPeso: p.aoPeso, id: p.id,
        validoDe: p.validoDe, validoAte: p.validoAte, soComCartao: p.soComCartao, relevancia: p.relevancia,
      }));
    } catch (e) { saida[termo].erro = e.message; }
    await espera(2000);
  }
  console.log(`${n + 1}/${PESQUISAS_LIVRES.length} ${termo} → ${q}: ${saida[termo].produtos.length}`);
}
mkdirSync(new URL("../auditoria/", import.meta.url), { recursive: true });
writeFileSync(new URL("../auditoria/livres.json", import.meta.url), JSON.stringify(saida));
