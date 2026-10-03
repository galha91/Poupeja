import { diasEntre, paraData, somarMeses, hojeIso } from "./datas.js";

/*
 * Contas que renovam: eletricidade, gás, telecomunicações e seguros.
 *
 * O PoupeJá não calcula tarifas de energia. A conta certa depende da
 * potência, da opção horária, dos períodos de consumo, dos descontos e de
 * impostos que mudam (IVA a taxas diferentes por escalão, IEC, CAV…) — um
 * erro aqui seria um valor inventado. Quem compara é o simulador oficial
 * da ERSE; a app prepara os dados que ele pede e guarda o resultado que a
 * pessoa lá obtiver. (A ERSE publica a base de dados das ofertas, mas
 * transformá-la em preços finais é refazer o simulador — fica de fora.)
 *
 * Telecomunicações e seguros não têm fonte aberta fiável: registo manual.
 */

export const TIPOS = {
  eletricidade: { label: "Eletricidade", erse: "https://simuladorprecos.erse.pt/eletricidade/" },
  gas:          { label: "Gás natural",  erse: "https://simuladorprecos.erse.pt/" },
  telecom:      { label: "Internet e telemóvel" },
  seguro:       { label: "Seguro" },
};

export const FONTE_ERSE = {
  verificado: "2026-10-03",
  pagina: "https://www.erse.pt/simuladores/precos-de-energia/",
};

export const PERIODICIDADES = {
  mensal:     { label: "por mês",       porAno: 12 },
  trimestral: { label: "por trimestre", porAno: 4 },
  semestral:  { label: "por semestre",  porAno: 2 },
  anual:      { label: "por ano",       porAno: 1 },
};

export const POTENCIAS_KVA = ["1,15", "2,3", "3,45", "4,6", "5,75", "6,9", "10,35", "13,8", "17,25", "20,7", "27,6", "34,5", "41,4"];
export const OPCOES_HORARIAS = { simples: "Simples", bi: "Bi-horária", tri: "Tri-horária" };

export function anualizar(valor, periodicidade = "mensal") {
  const v = Number(valor);
  const p = PERIODICIDADES[periodicidade];
  if (!Number.isFinite(v) || v < 0 || !p) return null;
  return Math.round(v * p.porAno * 100) / 100;
}

export function mensalizar(valor, periodicidade = "mensal") {
  const a = anualizar(valor, periodicidade);
  return a == null ? null : Math.round((a / 12) * 100) / 100;
}

/**
 * A renovação é um aniversário: se a data indicada já passou, a próxima é
 * daqui a um ano (ou dois…). O fim da fidelização é uma data única — se já
 * passou, deixa de contar (a pessoa já está livre para mudar).
 */
export function proximaRenovacao(dataRenovacao, hoje = hojeIso()) {
  if (!paraData(dataRenovacao)) return null;
  let d = dataRenovacao, anos = 0;
  while (diasEntre(hoje, d) < 0 && anos < 100) {
    anos += 1;
    d = somarMeses(dataRenovacao, 12 * anos);
  }
  return d;
}

/** A próxima data que merece lembrete: { data, motivo: "fidelizacao" | "renovacao" } ou null. */
export function proximoMarco(conta, hoje = hojeIso()) {
  const cands = [];
  if (paraData(conta.fimFidelizacao) && diasEntre(hoje, conta.fimFidelizacao) >= 0) {
    cands.push({ data: conta.fimFidelizacao, motivo: "fidelizacao" });
  }
  const ren = proximaRenovacao(conta.dataRenovacao, hoje);
  if (ren) cands.push({ data: ren, motivo: "renovacao" });
  if (!cands.length) return null;
  cands.sort((a, b) => diasEntre(b.data, a.data));
  return cands[0];
}

/** Poupança anual se mudar para a oferta que a pessoa encontrou (nunca negativa). */
export function poupancaPossivel(conta) {
  const atual = anualizar(conta.valor, conta.periodicidade);
  const alt = Number(conta.resultadoErse?.valorAnual);
  if (atual == null || !Number.isFinite(alt) || alt <= 0) return null;
  return Math.max(0, Math.round((atual - alt) * 100) / 100);
}

export function normalizarConta(dados) {
  const tipo = TIPOS[dados.tipo] ? dados.tipo : null;
  if (!tipo) return { ok: false, erro: "Escolhe o tipo de conta." };
  const valor = Number(String(dados.valor ?? "").replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) return { ok: false, erro: "Indica quanto pagas (um valor acima de 0)." };
  const periodicidade = PERIODICIDADES[dados.periodicidade] ? dados.periodicidade : "mensal";
  const dataRenovacao = paraData(dados.dataRenovacao) ? dados.dataRenovacao : null;
  const fimFidelizacao = paraData(dados.fimFidelizacao) ? dados.fimFidelizacao : null;
  if (!dataRenovacao && !fimFidelizacao) return { ok: false, erro: "Indica a data de renovação ou o fim da fidelização." };
  return {
    ok: true,
    conta: {
      tipo,
      nome: String(dados.nome || "").trim().slice(0, 40),
      valor: Math.round(valor * 100) / 100,
      periodicidade,
      dataRenovacao,
      fimFidelizacao,
      potencia: POTENCIAS_KVA.includes(dados.potencia) ? dados.potencia : null,
      opcaoHoraria: OPCOES_HORARIAS[dados.opcaoHoraria] ? dados.opcaoHoraria : null,
    },
  };
}
