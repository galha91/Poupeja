/*
 * Páginas públicas de apoios (/apoios/<apoio>) e prazos (/prazos/<prazo>)
 * do Estado — slugs, ligações entre uns e outros e o texto do próximo
 * prazo. Sem I/O, para se testar à parte.
 */
import { slugify } from "./slug.js";
import { proximoPeriodo } from "./prazosEstado.js";
import { diasEntre } from "./datas.js";

export const slugApoio = (a) => slugify(a.id);
export const slugPrazo = (p) => slugify(p.id);

/* Apoio ↔ prazo que falam da mesma coisa (só os que existem nos dois ficheiros). */
const LIGACOES = [
  ["tarifa-social-eletricidade", "tarifa-social-energia"],
  ["tarifa-social-gas", "tarifa-social-energia"],
  ["porta-65-jovem", "porta-65-jovem"],
  ["irs-jovem", "irs-jovem"],
  ["irs-jovem", "entrega-irs"],
  ["abono-familia", "prova-escolar"],
  ["passe-sub23", "passe-jovem-navegante"],
];
export const prazosDoApoio = (apoioId, prazos) =>
  LIGACOES.filter(([a]) => a === apoioId).map(([, p]) => prazos.find((x) => x.id === p)).filter(Boolean);
export const apoiosDoPrazo = (prazoId, apoios) =>
  LIGACOES.filter(([, p]) => p === prazoId).map(([a]) => apoios.find((x) => x.id === a)).filter(Boolean);

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export function dataLonga(iso) {
  const [a, m, d] = String(iso).split("-").map(Number);
  return a && m && d ? `${d} de ${MESES[m - 1]} de ${a}` : "";
}

/*
 * O próximo prazo em linguagem simples, a partir de hoje:
 *   { aberto, fim, inicio, dias, frase }  — ou null nos contínuos.
 */
export function estadoPrazo(prazo, hoje) {
  const p = proximoPeriodo(prazo.prazo, hoje);
  if (!p) return null;
  const dias = diasEntre(hoje, p.fim);
  const frase = p.aberto
    ? dias === 0 ? `Acaba hoje, ${dataLonga(p.fim)}.` : `Está a decorrer: acaba a ${dataLonga(p.fim)} — faltam ${dias} dia${dias !== 1 ? "s" : ""}.`
    : `Abre a ${dataLonga(p.inicio)} e acaba a ${dataLonga(p.fim)} — faltam ${diasEntre(hoje, p.inicio)} dias para abrir.`;
  return { ...p, dias, frase };
}
