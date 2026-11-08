/*
 * Tarefas automáticas que correm nos GitHub Actions e não na Vercel (ver
 * .github/workflows/historico-precos.yml). O /admin junta estas às do
 * vercel.json para mostrar o horário e avisar quando uma fica atrasada.
 * Os horários têm de ser os do workflow (tests/cronsGithub.test.mjs
 * confirma). As reservas do workflow não entram aqui: só correm quando a
 * principal falhou.
 */
export const CRONS_GITHUB = [
  { path: "/api/cron-historico-precos", schedule: "17 7 * * *" },
  { path: "/api/cron-historico-precos-2", schedule: "17 13 * * *" },
  { path: "/api/cron-historico-precos-3", schedule: "17 19 * * *" },
  { path: "/api/cron-paginas-marca", schedule: "40 0 * * *" },
];
