/*
 * Compensação por despedimento e fim de contrato (cessação em 2026). Fonte
 * única para a página pública /indemnizacao-despedimento. Confirmado a
 * 22/10/2026.
 *
 * Código do Trabalho, art. 366.º (despedimento coletivo; aplica-se também à
 * extinção do posto de trabalho e à inadaptação): 14 dias de retribuição
 * base e diuturnidades por ano completo desde 1/5/2023 (Lei 13/2023, antes
 * 12). Contratos mais antigos somam períodos com outros dias, pelo regime
 * transitório da Lei 69/2013 (DGERT):
 *   - contrato anterior a 1/11/2011: 30 dias até 31/10/2012 e 20 dias até
 *     30/9/2013;
 *   - contrato de 1/11/2011 a 30/9/2013: 20 dias até 30/9/2013;
 *   - de 1/10/2013 a 30/4/2023: 12 dias, ou 18 dias nos três primeiros
 *     anos do contrato se, a 1/10/2013, ainda não tinha três anos.
 * Limites: retribuição até 20 × RMMG (exceto na parcela anterior a
 * 1/11/2012) e total até 12 × retribuição (ou 240 × RMMG). Nos contratos
 * anteriores a 1/11/2011 o total não pode ser inferior a três meses. A
 * parcela mais antiga que já atinja o limite fica sozinha.
 *
 * Caducidade do contrato a termo por iniciativa do empregador (art. 344.º
 * e 345.º): 24 dias por ano desde 1/5/2023; de 1/10/2013 a 30/4/2023, 18
 * dias nos três primeiros anos e 12 nos seguintes; calculada nos termos do
 * art. 366.º. Resolução com justa causa pelo trabalhador (art. 396.º): 15
 * a 45 dias por ano, mínimo de três meses.
 */
export const VERIFICADO_INDEMNIZACAO = "2026-10-22";
export const RMMG_2026 = 920;
export const FONTE_LEI_13_2023 = "https://diariodarepublica.pt/dr/detalhe/lei/13-2023-211340863";
export const FONTE_DGERT_366 = "https://www.dgert.gov.pt/compensacao-por-despedimento-coletivo-artigo-366-o";
export const FONTE_GUIA_CESSACAO = "https://www.occ.pt/sites/default/files/public/2024-03/Guia_Pratico_CESSA.pdf";
export const SIMULADOR_ACT = "https://portal.act.gov.pt/Pages/SimuladorCompensacaoCessacaoContratoTrabalho.aspx";

const MS_DIA = 86400000;
const ts = (s) => {
  const [y, m, d] = String(s).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const parte = (t) => { const x = new Date(t); return { y: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate() }; };
const maisAnos = (t, n) => { const p = parte(t); return Date.UTC(p.y + n, p.m - 1, p.d); };
const diasDoMes = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/* Meses (com fração em dias de 30) entre duas datas, a primeira incluída e a segunda não. */
export function mesesEntre(de, ate) {
  if (!(ate > de)) return 0;
  const a = parte(de);
  const b = parte(ate);
  let meses = (b.y - a.y) * 12 + (b.m - a.m);
  let dias = b.d - a.d;
  if (dias < 0) {
    meses -= 1;
    const mAnt = b.m === 1 ? 12 : b.m - 1;
    dias += diasDoMes(b.m === 1 ? b.y - 1 : b.y, mAnt);
  }
  return meses + dias / 30;
}

const T = {
  nov2011: ts("2011-11-01"), nov2012: ts("2012-11-01"), out2013: ts("2013-10-01"), mai2023: ts("2023-05-01"),
};
const cent = (v) => Math.round(v * 100 + 1e-6) / 100;

/* Troços [de, ate) com os dias por ano de cada um, na ordem do tempo. */
function troços(tipo, inicio, fim) {
  const lista = [];
  const junta = (de, ate, dias, anterior2012 = false) => {
    const d = Math.max(de, inicio);
    const a = Math.min(ate, fim);
    if (a > d) lista.push({ de: d, ate: a, dias, anterior2012 });
  };
  if (tipo === "termo") {
    const t3 = maisAnos(inicio, 3);
    junta(inicio, Math.min(t3, T.mai2023), 18);
    junta(t3, T.mai2023, 12);
    junta(T.mai2023, fim, 24);
    return lista;
  }
  if (inicio < T.nov2011) {
    junta(inicio, T.nov2012, 30, true);
    junta(T.nov2012, T.out2013, 20);
  } else if (inicio < T.out2013) {
    junta(inicio, T.out2013, 20);
  }
  if (inicio < T.out2013) {
    const t3 = maisAnos(inicio, 3);
    if (t3 > T.out2013) {
      junta(T.out2013, Math.min(t3, T.mai2023), 18);
      junta(t3, T.mai2023, 12);
    } else {
      junta(T.out2013, T.mai2023, 12);
    }
  } else {
    junta(inicio, T.mai2023, 12);
  }
  junta(T.mai2023, fim, 14);
  return lista;
}

/*
 * tipo: "coletivo" (despedimento coletivo, extinção do posto ou
 * inadaptação, contrato sem termo) | "termo" (caducidade do contrato a
 * termo por iniciativa do empregador) | "justa-causa" (resolução pelo
 * trabalhador). retribuicao: base + diuturnidades por mês. inicio e fim:
 * primeiro e último dia do contrato, "AAAA-MM-DD".
 */
export function calcularCompensacao({ tipo = "coletivo", retribuicao, inicio, fim, rmmg = RMMG_2026 }) {
  const R = Number(retribuicao);
  if (!(R > 0) || !inicio || !fim) return null;
  const i = ts(inicio);
  const f = ts(fim) + MS_DIA; // o último dia conta
  if (!Number.isFinite(i) || !Number.isFinite(f) || f <= i) return null;
  const antiguidadeMeses = mesesEntre(i, f);
  const tetoRetribuicao = 20 * rmmg;
  const retribuicaoLimitada = Math.min(R, tetoRetribuicao);
  const base = { retribuicao: R, antiguidadeMeses, minimo: cent(3 * R) };

  if (tipo === "justa-causa") {
    const anos = antiguidadeMeses / 12;
    const diario = R / 30;
    return { ...base, tipo, minimoLegal: cent(Math.max(3 * R, 15 * diario * anos)), maximoLegal: cent(Math.max(3 * R, 45 * diario * anos)) };
  }
  if (tipo === "termo" && i < T.out2013) return { ...base, tipo, foraDoAmbito: true };

  const partes = troços(tipo, i, f).map((t) => {
    const meses = mesesEntre(t.de, t.ate);
    const diario = (t.anterior2012 ? R : retribuicaoLimitada) / 30;
    return { dias: t.dias, meses, valor: (t.dias * (meses / 12)) * diario };
  });
  const teto = 12 * retribuicaoLimitada;
  let acumulado = 0;
  let total = 0;
  let aplicadas = 0;
  let limitado = false;
  for (const p of partes) {
    if (acumulado >= teto) break;
    acumulado += p.valor;
    aplicadas += 1;
    if (acumulado >= teto && aplicadas > 1) { acumulado = teto; limitado = true; }
  }
  total = acumulado;
  const subminimo = tipo === "coletivo" && i < T.nov2011 && total < 3 * retribuicaoLimitada;
  if (subminimo) total = 3 * retribuicaoLimitada;
  return {
    ...base, tipo, partes: partes.slice(0, aplicadas).map((p) => ({ ...p, valor: cent(p.valor) })),
    teto: cent(teto), tetoRetribuicao, retribuicaoLimitada, limitado, subminimo, total: cent(total),
  };
}
