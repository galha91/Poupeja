/*
 * Tarefas automáticas que correm nos GitHub Actions e não na Vercel (ver
 * .github/workflows/historico-precos.yml). O /admin junta estas às do
 * vercel.json para mostrar o horário e avisar quando uma fica atrasada.
 *
 * Os agendamentos do GitHub atrasam horas ou falham de todo (a 9 nov a
 * parte 1 das 07:17 nunca correu). Por isso o workflow acorda de hora a
 * hora e proximaTarefa escolhe a primeira tarefa que já devia ter corrido
 * hoje e ainda não correu com sucesso. Uma hora perdida é apanhada na
 * seguinte.
 */
export const CRONS_GITHUB = [
  { path: "/api/cron-paginas-marca", schedule: "40 0 * * *" },
  { path: "/api/cron-historico-precos", schedule: "17 7 * * *" },
  { path: "/api/cron-historico-precos-2", schedule: "17 13 * * *" },
  { path: "/api/cron-historico-precos-3", schedule: "17 19 * * *" },
];

const rota = (c) => c.path.split("/").pop();

/* Instante UTC de hoje em que a tarefa passa a ser devida. */
function horaDeHoje(schedule, agora) {
  const [min, hora] = schedule.split(" ").map(Number);
  return Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate(), hora, min);
}

/*
 * execucoes: { [rota]: ultimo_ok_em } (de cron_execucoes).
 * Devolve a rota a correr agora, ou null. Pela ordem do dia: uma de cada
 * vez, para não sobrepor scraping nem gerar páginas a meio do histórico.
 */
export function proximaTarefa(execucoes, agora = new Date()) {
  for (const c of CRONS_GITHUB) {
    const devida = horaDeHoje(c.schedule, agora);
    if (agora.getTime() < devida) continue;
    const ok = Date.parse(execucoes?.[rota(c)] || "");
    if (!(ok >= devida)) return rota(c);
  }
  return null;
}
