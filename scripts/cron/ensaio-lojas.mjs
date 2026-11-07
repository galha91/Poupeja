/*
 * Ensaio: as lojas respondem a partir dos servidores do GitHub?
 * Não escreve nada na base de dados e não precisa de segredos.
 *
 *   node --import ./scripts/cron/carregador.mjs scripts/cron/ensaio-lojas.mjs
 *
 * Sai com código 1 se mais de metade das lojas falhar em todas as
 * pesquisas: nesse caso o histórico de preços não pode correr no GitHub.
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import { appendFileSync } from "node:fs";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const { pesquisarTudo } = await import(path.join(raiz, "lib/supermercados/index.js"));

const ARTIGOS = ["azeite", "leite meio gordo", "arroz"];
const okPorLoja = new Map();
const linhas = ["| Artigo | Loja | Resultado |", "|---|---|---|"];

for (const q of ARTIGOS) {
  const r = await pesquisarTudo(q);
  for (const l of r.lojas) {
    okPorLoja.set(l.id, (okPorLoja.get(l.id) || false) || l.ok);
    linhas.push(`| ${q} | ${l.id} | ${l.ok ? "ok" : `falhou: ${l.erro || "?"}`} |`);
  }
  await new Promise((ok) => setTimeout(ok, 700));
}

const lojas = [...okPorLoja.keys()];
const boas = lojas.filter((id) => okPorLoja.get(id));
const texto = `Lojas a responder: ${boas.length} de ${lojas.length} (${boas.join(", ") || "nenhuma"})`;
console.log(linhas.join("\n"));
console.log(texto);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Ensaio das lojas\n\n${linhas.join("\n")}\n\n**${texto}**\n`);
process.exit(boas.length * 2 >= lojas.length ? 0 : 1);
