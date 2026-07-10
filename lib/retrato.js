/*
 * Retrato do mês — o "Wrapped" mensal da poupança.
 * Cálculo 100% a partir dos talões reais; devolve null se não há dados
 * suficientes (nunca inventamos números).
 */
import { DESAFIOS_MENSAIS } from "./desafios";

const MESES_PT = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

function lerTaloes() {
  try { return JSON.parse(localStorage.getItem("poupeja_taloes") || "[]"); } catch { return []; }
}

const dataDe = t => t.dataCompra || (t.criadoEm || "").slice(0, 10) || null;
const chaveMesDe = iso => (iso || "").slice(0, 7);

/* Mês anterior ao atual: { chave: "2026-06", nome: "junho", indice: 5, ano: 2026 } */
export function mesAnterior(agora = new Date()) {
  const d = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  return {
    chave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    nome: MESES_PT[d.getMonth()],
    indice: d.getMonth(),
    ano: d.getFullYear(),
  };
}

/* Calcula o retrato de um mês (por defeito, o anterior). null se sem compras. */
export function calcularRetrato(agora = new Date()) {
  const mes = mesAnterior(agora);
  const taloes = lerTaloes();

  const compras = taloes.filter(t =>
    t.tipo === "compra" && t.valorPoupado != null && chaveMesDe(dataDe(t)) === mes.chave
  );
  if (!compras.length) return null;

  const total = compras.reduce((acc, t) => acc + (t.valorPoupado || 0), 0);
  const melhor = compras.reduce((a, b) => (b.valorPoupado > a.valorPoupado ? b : a));

  // Mês antes do retratado, para tendência
  const dAnt = new Date(mes.ano, mes.indice - 1, 1);
  const chaveAnt = `${dAnt.getFullYear()}-${String(dAnt.getMonth() + 1).padStart(2, "0")}`;
  const totalAnt = taloes
    .filter(t => t.tipo === "compra" && t.valorPoupado != null && chaveMesDe(dataDe(t)) === chaveAnt)
    .reduce((acc, t) => acc + (t.valorPoupado || 0), 0);
  const tendencia = totalAnt > 0 ? Math.round(((total - totalAnt) / totalAnt) * 100) : null;

  // Streak semanal no fim do mês retratado (semanas consecutivas com talões)
  const segunda = iso => {
    const d = new Date(iso);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  };
  const semanas = new Set(taloes.map(dataDe).filter(Boolean).map(segunda));
  const fimMes = new Date(mes.ano, mes.indice + 1, 0); // último dia do mês
  let streak = 0;
  const cursor = new Date(segunda(fimMes.toISOString().slice(0, 10)));
  while (semanas.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }

  const desafio = DESAFIOS_MENSAIS[mes.indice];
  const desafioCompleto = desafio ? total >= desafio.meta : false;

  return {
    mes,
    total,
    nTaloes: compras.length,
    melhorPoupanca: melhor.valorPoupado,
    melhorLoja: melhor.nome || null,
    tendencia,           // % vs mês anterior, ou null se não há base
    streak,              // semanas consecutivas a terminar no fim do mês
    desafio: desafio ? { nome: desafio.nome, emoji: desafio.emoji, meta: desafio.meta, completo: desafioCompleto } : null,
  };
}

/* Há retrato por ver? Mostra nos primeiros 7 dias do mês, uma vez por mês. */
export function retratoPorVer(agora = new Date()) {
  if (agora.getDate() > 7) return null;
  const mes = mesAnterior(agora);
  try {
    if (localStorage.getItem("poupeja_retrato_visto") === mes.chave) return null;
  } catch {}
  return calcularRetrato(agora);
}

export function marcarRetratoVisto(chaveMes) {
  try { localStorage.setItem("poupeja_retrato_visto", chaveMes); } catch {}
}
