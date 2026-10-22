/*
 * Páginas públicas da Euribor (/euribor, /euribor/<prazo>) — leitura da
 * série do BCE e as contas, sem I/O nas funções de cálculo.
 *
 * Série MENSAL (média do mês, zona euro), a mesma de /api/euribor: é a que
 * os bancos portugueses usam para rever a taxa do crédito à habitação.
 */
import { prestacao, taxaAnual } from "./credito.js";

export const PRAZOS_EURIBOR = [
  { slug: "3-meses", id: "3M", codigo: "EURIBOR3MD_", nome: "Euribor a 3 meses", curto: "3 meses" },
  { slug: "6-meses", id: "6M", codigo: "EURIBOR6MD_", nome: "Euribor a 6 meses", curto: "6 meses" },
  { slug: "12-meses", id: "12M", codigo: "EURIBOR1YD_", nome: "Euribor a 12 meses", curto: "12 meses" },
];
export const prazoPorSlug = (slug) => PRAZOS_EURIBOR.find((p) => p.slug === slug) || null;

/* Resposta jsondata do BCE → [{ periodo: "2026-09", valor }] por ordem. */
export function lerSerieBce(data) {
  const series = data?.dataSets?.[0]?.series;
  const chave = series && Object.keys(series)[0];
  const obs = chave ? series[chave].observations : null;
  const periodos = data?.structure?.dimensions?.observation?.[0]?.values || [];
  if (!obs) return [];
  return Object.keys(obs)
    .map((k) => ({ periodo: periodos[Number(k)]?.id, valor: obs[k]?.[0] }))
    .filter((p) => p.periodo && Number.isFinite(p.valor))
    .map((p) => ({ periodo: p.periodo, valor: Math.round(p.valor * 1000) / 1000 }))
    .sort((a, b) => a.periodo.localeCompare(b.periodo));
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const nomeMes = (periodo) => {
  const [a, m] = String(periodo).split("-").map(Number);
  return a && m ? `${MESES[m - 1]} de ${a}` : "";
};
export const pct = (v, casas = 3) => `${v.toLocaleString("pt-PT", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;
const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* O crédito de referência das contas: 150 000 € a 30 anos, spread 1%. */
export const CREDITO_REF = { capital: 150000, anos: 30, spread: 1 };

/*
 * Resumo de uma série: o valor do mês, a variação num mês e num ano, e o
 * efeito na prestação do crédito de referência. Frases tiradas dos números.
 */
export function resumirEuribor(serie, prazo, ref = CREDITO_REF) {
  if (!serie?.length) return null;
  const atual = serie[serie.length - 1];
  const mesAntes = serie[serie.length - 2] || null;
  const anoAntes = serie.find((p) => p.periodo === `${Number(atual.periodo.slice(0, 4)) - 1}${atual.periodo.slice(4)}`) || null;
  const meses = ref.anos * 12;
  const pAtual = prestacao(ref.capital, taxaAnual(atual.valor, ref.spread), meses);
  const pAno = anoAntes ? prestacao(ref.capital, taxaAnual(anoAntes.valor, ref.spread), meses) : null;
  const frases = [];
  frases.push(`A ${prazo.nome} ficou em ${pct(atual.valor)} em ${nomeMes(atual.periodo)} (média do mês, dados do BCE).`);
  if (mesAntes) {
    const d = Math.round((atual.valor - mesAntes.valor) * 1000) / 1000;
    frases.push(Math.abs(d) < 0.001
      ? `Ficou igual ao mês anterior.`
      : `${d < 0 ? "Desceu" : "Subiu"} ${pct(Math.abs(d))} face a ${nomeMes(mesAntes.periodo)} (${pct(mesAntes.valor)}).`);
  }
  if (anoAntes && pAno != null) {
    const dp = Math.round((pAtual - pAno) * 100) / 100;
    frases.push(`Num crédito de ${eur(ref.capital).replace(",00", "")} € a ${ref.anos} anos com spread de ${pct(ref.spread, 1)}, a prestação ronda ${eur(pAtual)} € — ${Math.abs(dp) < 1 ? "praticamente o mesmo que" : `${eur(Math.abs(dp))} € ${dp < 0 ? "menos" : "mais"} do que`} há um ano.`);
  } else {
    frases.push(`Num crédito de ${eur(ref.capital).replace(",00", "")} € a ${ref.anos} anos com spread de ${pct(ref.spread, 1)}, a prestação ronda ${eur(pAtual)} €.`);
  }
  return { atual, mesAntes, anoAntes, prestacao: Math.round(pAtual * 100) / 100, frases };
}
