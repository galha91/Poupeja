// TEMPORÁRIO — teste do motor com o Aldi e da verificação diária.
import { register } from "node:module";
register("data:text/javascript," + encodeURIComponent(`
export async function resolve(s, c, n) { try { return await n(s, c); } catch (e) { if (s.startsWith(".")) return n(s + ".js", c); throw e; } }
`), import.meta.url);
const { pesquisarTudo } = await import("../lib/supermercados/index.js");
const { melhoresPorLoja, custoPorLoja } = await import("../lib/comparacao.js");
const { verificarLojas } = await import("../lib/supermercados/saude.js");
const f = (n) => (n == null ? "—" : n.toFixed(2).replace(".", ","));
for (const q of ["laranjas", "leite meio gordo", "ovos", "azeite", "arroz", "salsa", "papel higiénico", "detergente roupa", "frango", "bolachas", "café", "iogurte natural", "pão de forma", "manteiga", "atum"]) {
  const r = await pesquisarTudo(q);
  const { modo, melhores } = melhoresPorLoja(r);
  const { custos, referencia } = custoPorLoja(r);
  console.log(`\n### ${q} [${modo}, ${r.nomeUnidade}, ref=${JSON.stringify(referencia)}] ${r.lojas.map((l) => `${l.id}:${l.ok ? l.total : "FALHA " + l.erro}`).join(" ")}`);
  for (const l of r.lojas) {
    const p = melhores[l.id];
    console.log(`  ${l.nome.padEnd(10)} ${p ? `${f(modo === "embalagem" ? p.preco : p.precoUnidade)} ${modo === "embalagem" ? "€" : "€/" + p.nomeUnidade} | ${p.nome.slice(0, 44)} | ${p.quantidade || ""} | pago ${f(p.preco)} | cesto ${f(custos[l.id]?.custo)}${p.onde === "loja" ? " [loja]" : ""}` : "—"}`);
  }
  await new Promise((ok) => setTimeout(ok, 1200));
}
console.log("\n### VERIFICAÇÃO DIÁRIA");
for (const r of await verificarLojas()) console.log(r.ok ? `  ✓ ${r.nome}: ${r.detalhes.join(" · ")}` : `  ✗ ${r.nome}: ${r.erro}`);
