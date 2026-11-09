/*
 * Corre uma rota de cron de pages/api fora da Vercel (GitHub Actions).
 *
 *   node --import ./scripts/cron/carregador.mjs scripts/cron/correr.mjs cron-historico-precos
 *   ... correr.mjs cron-historico-precos-2 --reserva 4
 *
 * Porquê: no plano Hobby a Vercel dá 4 h de CPU ativo por mês, e o
 * histórico de preços (scraping de 5 lojas, 3 vezes por dia) gastava a
 * maior parte. Nos Actions de um repositório público os minutos são grátis.
 *
 * O handler é o mesmo da rota (com o comRegisto), por isso cada execução
 * continua a aparecer no /admin (Qualidade → Tarefas automáticas).
 *
 * --reserva H  só corre se a tarefa não tiver corrido com sucesso nas
 *              últimas H horas. É a segunda tentativa do dia: o GitHub
 *              atrasa ou salta execuções agendadas quando está carregado.
 *
 * Sai com código 1 quando a tarefa falha (o GitHub avisa por email).
 */
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const rota = args[0];
const opcao = (nome) => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : undefined; };

if (!rota || !/^[a-z0-9-]+$/.test(rota)) {
  console.error("Uso: correr.mjs <rota> [--reserva HORAS]");
  process.exit(2);
}

for (const nome of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
  if (!process.env[nome]) {
    console.error(`Falta o segredo ${nome} (GitHub → Settings → Secrets and variables → Actions).`);
    process.exit(1);
  }
}

// O handler confirma o Bearer contra o CRON_SECRET. Aqui o pedido nasce
// dentro do próprio processo, por isso um segredo de ocasião chega: nunca
// sai deste processo.
if (!process.env.CRON_SECRET) process.env.CRON_SECRET = randomBytes(24).toString("hex");

const { getSupabaseAdmin } = await import(path.join(raiz, "lib/supabaseAdmin.js"));

const horasReserva = Number(opcao("--reserva"));
if (horasReserva > 0) {
  const { data, error } = await getSupabaseAdmin().from("cron_execucoes").select("ultimo_ok_em").eq("nome", rota).maybeSingle();
  if (error) console.warn(`Não consegui ler cron_execucoes (${error.message}); corre na mesma.`);
  const ultimoOk = data?.ultimo_ok_em ? new Date(data.ultimo_ok_em).getTime() : 0;
  if (Date.now() - ultimoOk < horasReserva * 36e5) {
    console.log(`${rota}: já correu com sucesso às ${data.ultimo_ok_em}. Nada a fazer.`);
    process.exit(0);
  }
  console.log(`${rota}: sem sucesso nas últimas ${horasReserva} h. A correr a reserva.`);
}

const { default: handler } = await import(path.join(raiz, "pages/api", `${rota}.js`));

const req = {
  method: "GET",
  url: `/api/${rota}`,
  query: {},
  headers: { authorization: `Bearer ${process.env.CRON_SECRET}`, host: "github-actions" },
  fora: true,
};
const res = {
  statusCode: 200,
  corpo: undefined,
  status(c) { this.statusCode = c; return this; },
  setHeader() { return this; },
  json(b) { this.corpo = b; return this; },
  send(b) { this.corpo = b; return this; },
  end() { return this; },
};

const inicio = Date.now();
let codigo = 0;
try {
  await handler(req, res);
  const c = res.corpo;
  console.log(`${rota}: HTTP ${res.statusCode} em ${Math.round((Date.now() - inicio) / 1000)} s`);
  console.log(JSON.stringify(c));
  if (res.statusCode >= 400) codigo = 1;
  // Nenhuma pesquisa correu bem: as lojas recusaram (ex.: bloqueio de IP).
  if (c && c.feitos === 0 && c.falhas > 0) {
    console.error(`${rota}: nenhuma pesquisa registada (${c.falhas} falhadas).`);
    codigo = 1;
  }
} catch (e) {
  console.error(`${rota}: falhou`, e);
  codigo = 1;
}
// O que ficou por registar no contador de tráfego do Supabase (lib/consumoSupabase).
try {
  const { terminarConsumo } = await import(path.join(raiz, "lib/consumoSupabase.js"));
  await terminarConsumo();
} catch {}
// O cliente do Supabase deixa ligações abertas; sair sem esperar por elas.
process.exit(codigo);
