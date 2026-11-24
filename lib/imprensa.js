/*
 * Peças publicadas sobre o PoupeJá. Fonte única para a página /imprensa e
 * para a linha "Visto no…" do Início. Acrescentar à cabeça quando sair outra.
 */
export const NA_IMPRENSA = [
  { meio: "Pplware", data: "novembro de 2026", titulo: "Este site português reúne e compara preços de supermercados, combustíveis e muito mais",
    href: "https://pplware.sapo.pt/informacao/este-site-portugues-reune-e-compara-precos-de-supermercados-combustiveis-e-muito-mais/" },
  { meio: "HR Portugal", data: "7 de novembro de 2026", titulo: "Onde é mais barato? Nova app gratuita permite comparar preços de supermercados e combustíveis em tempo real",
    href: "https://hrportugal.sapo.pt/nova-app-gratuita-permite-comparar-precos-de-supermercados-e-combustiveis-em-tempo-real/" },
];

/* "Pplware e HR Portugal" · "A, B e C" */
export const MEIOS_IMPRENSA = (() => {
  const m = [...new Set(NA_IMPRENSA.map((n) => n.meio))];
  return m.length <= 1 ? m.join("") : `${m.slice(0, -1).join(", ")} e ${m[m.length - 1]}`;
})();
