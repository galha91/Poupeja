/*
 * Auditoria da comparação da lista de compras (corre de 15 em 15 dias,
 * .github/workflows/auditar-comparacao.yml).
 *
 * Para cada artigo do catálogo pergunta à API do site o que as lojas têm
 * hoje e vê que produto entra na soma em cada loja — o mesmo que a app
 * escolhe (melhoresPorLoja, estrito). Assinala para rever:
 *   - artigos com menos de 2 lojas;
 *   - preços fora do normal: uma loja 3× acima ou abaixo da mediana das
 *     outras (quase sempre é outro produto, ou outra embalagem);
 *   - o que mudou desde a última auditoria (produto escolhido diferente).
 * Escreve data/auditoria-comparacao.json (o que ficou escolhido, para a
 * próxima comparar) e data/auditoria-comparacao.md (o relatório).
 *
 * Uso:  node scripts/auditar-comparacao.mjs [https://www.xn--poupej-uta.com]
 *       node scripts/auditar-comparacao.mjs --dados pesquisas.json   (sem rede, para testar)
 * Uma pesquisa a cada 2 s (limite de 40/min da API): uns 8 minutos.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { ITENS } from "../data/catalogo-lista.js";
import { melhoresPorLoja } from "../lib/comparacao.js";

const args = process.argv.slice(2);
const local = args[0] === "--dados" ? JSON.parse(readFileSync(args[1], "utf8")) : null;
const BASE = (!local && args[0]) || process.env.BASE_URL || "https://www.xn--poupej-uta.com";
const SNAP = new URL("../data/auditoria-comparacao.json", import.meta.url);
const RELATORIO = new URL("../data/auditoria-comparacao.md", import.meta.url);
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
const anterior = existsSync(SNAP) ? JSON.parse(readFileSync(SNAP, "utf8")).artigos || {} : {};

async function produtosDe(q) {
  if (local) return local[q]?.produtos || null;
  const r = await fetch(`${BASE}/api/precos-supermercado?q=${encodeURIComponent(q)}`);
  const j = await r.json();
  if (!r.ok && !j.produtos) throw new Error(j.erro || `HTTP ${r.status}`);
  return j.produtos || [];
}

const artigos = {}, poucas = [], suspeitos = [], mudou = [], falhas = [];
for (const [n, it] of ITENS.entries()) {
  try {
    const produtos = await produtosDe(it.q);
    if (!produtos) throw new Error("sem dados");
    const { melhores, unidade } = melhoresPorLoja({ modo: it.q && /^(salsa|coentros|hortel)/.test(it.q) ? "embalagem" : "unidade", produtos }, undefined, { estrito: true });
    const lojas = Object.fromEntries(Object.entries(melhores).map(([loja, p]) => [loja, { produto: p.nome, preco: p.precoUnidade, unidade: p.unidade }]));
    artigos[it.q] = { nome: it.nome, unidade: unidade || null, lojas };
    const n2 = Object.keys(lojas).length;
    if (n2 < 2) poucas.push({ it, lojas });
    const valores = Object.values(lojas).map((x) => x.preco).filter((x) => x > 0).sort((a, b) => a - b);
    if (valores.length >= 3) {
      const med = valores[Math.floor(valores.length / 2)];
      const fora = Object.entries(lojas).filter(([, x]) => x.preco > med * 3 || x.preco < med / 3);
      if (fora.length) suspeitos.push({ it, lojas, fora: fora.map(([l]) => l), med });
    }
    const antes = anterior[it.q]?.lojas;
    if (antes) {
      const trocas = Object.entries(lojas).filter(([l, x]) => antes[l] && antes[l].produto !== x.produto)
        .map(([l, x]) => ({ loja: l, de: antes[l].produto, para: x.produto }));
      if (trocas.length) mudou.push({ it, trocas });
    }
    console.log(`${n + 1}/${ITENS.length} ${it.q}: ${n2} lojas`);
  } catch (e) {
    falhas.push(it);
    console.log(`${n + 1}/${ITENS.length} ${it.q}: FALHOU (${e.message})`);
  }
  if (!local) await espera(2000);
}

const hoje = new Date().toISOString().slice(0, 10);
const linhaLojas = (lojas, marcar = []) => Object.entries(lojas)
  .map(([l, x]) => `  - ${marcar.includes(l) ? "**⚠ " : ""}${l}: ${x.produto} — ${x.preco} €/${x.unidade}${marcar.includes(l) ? "**" : ""}`).join("\n");
const md = [
  `# Auditoria da comparação — ${hoje}`,
  "",
  `${Object.keys(artigos).length} artigos auditados · ${suspeitos.length} com preço fora do normal · ${poucas.length} com menos de 2 lojas · ${mudou.length} com produto diferente da última vez · ${falhas.length} falharam.`,
  "",
  "Rever sobretudo os ⚠: quase sempre é outro produto (ou outra embalagem) a passar pelo artigo. Corrige-se em lib/supermercados/relevancia.js e junta-se o caso a tests/relevancia.test.mjs.",
  "",
  `## Preço fora do normal (${suspeitos.length})`,
  ...suspeitos.map(({ it, lojas, fora }) => `- **${it.nome}** (\`${it.q}\`)\n${linhaLojas(lojas, fora)}`),
  "",
  `## Produto diferente da última auditoria (${mudou.length})`,
  ...mudou.map(({ it, trocas }) => `- **${it.nome}** (\`${it.q}\`)\n${trocas.map((t) => `  - ${t.loja}: ~~${t.de}~~ → ${t.para}`).join("\n")}`),
  "",
  `## Menos de 2 lojas (${poucas.length})`,
  ...poucas.map(({ it, lojas }) => `- **${it.nome}** (\`${it.q}\`)${Object.keys(lojas).length ? "\n" + linhaLojas(lojas) : " — nenhuma"}`),
  ...(falhas.length ? ["", `## Falharam (${falhas.length})`, falhas.map((it) => `\`${it.q}\``).join(", ")] : []),
  "",
].join("\n");

writeFileSync(SNAP, JSON.stringify({ auditadoEm: hoje, artigos }, null, 1) + "\n");
writeFileSync(RELATORIO, md);
console.log(`\n${md.split("\n")[2]}`);
