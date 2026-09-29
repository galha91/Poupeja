import { pesquisarTudo } from "../lib/supermercados/index.js";
import { verificarLojas } from "../lib/supermercados/saude.js";
const QS = ["leite meio gordo", "arroz", "azeite", "iogurte", "queijo", "laranjas", "atum", "detergente roupa", "papel higienico", "ovos", "bananas", "cafe", "bolachas", "frango", "salsa"];
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
for (const q of QS) {
  const r = await pesquisarTudo(q);
  const porLoja = r.lojas.map((l) => `${l.id}:${l.ok ? l.total : "ERRO " + l.erro}(${l.ms ?? "-"}ms)`).join(" ");
  console.log(`\n## ${q} [${r.modo}/${r.nomeUnidade}] ${r.ms}ms  ${porLoja}`);
  const rel = r.produtos.filter((p) => p.relevancia === 2);
  const melhor = {};
  for (const p of rel) if (!melhor[p.loja]) melhor[p.loja] = p;
  for (const p of Object.values(melhor)) console.log(`   ${p.loja.padEnd(10)} ${String(p.precoUnidade).padStart(6)}/${p.unidade} ${p.preco}€  ${p.nome} ${p.quantidade || ""}${p.aoPeso ? " (ao peso)" : ""}`);
  const apo = r.produtos.filter((p) => p.loja === "apolonia").slice(0, 3);
  for (const p of apo) console.log(`   apo> rel${p.relevancia} ${p.precoUnidade}/${p.unidade} ${p.preco}€ ${p.nome} | ${p.quantidade} | ${p.rotuloUnidade}`);
  await esperar(800);
}
console.log("\n===== SAÚDE =====");
for (const r of await verificarLojas()) console.log(JSON.stringify(r).slice(0, 300));
