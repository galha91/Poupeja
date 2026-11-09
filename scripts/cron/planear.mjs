/*
 * Escolhe a tarefa que o workflow historico-precos deve correr agora (ver
 * lib/cronsGithub.proximaTarefa) e escreve-a em GITHUB_OUTPUT como `args`.
 * Sem dependências do npm: corre antes de as instalar, e quando não há
 * nada a fazer o workflow termina em segundos.
 */
import { appendFileSync } from "node:fs";
import { proximaTarefa } from "../../lib/cronsGithub.js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !chave) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const r = await fetch(`${url}/rest/v1/cron_execucoes?select=nome,ultimo_ok_em`, {
  headers: { apikey: chave, authorization: `Bearer ${chave}` },
  signal: AbortSignal.timeout(15000),
});
if (!r.ok) {
  console.error(`cron_execucoes: HTTP ${r.status}`);
  process.exit(1);
}
const execucoes = Object.fromEntries((await r.json()).map((l) => [l.nome, l.ultimo_ok_em]));
const tarefa = proximaTarefa(execucoes) || "";
console.log(tarefa ? `A correr: ${tarefa}` : "Nada para fazer nesta hora.");
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `args=${tarefa}\n`);
