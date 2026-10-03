import { estadoLembrete, ANTECEDENCIA_CONTAS, ANTECEDENCIA_GARANTIAS, ANTECEDENCIA_PRAZOS } from "./lembretes.js";
import { proximoMarco, TIPOS } from "./renovacoes.js";
import { proximoPeriodo } from "./prazosEstado.js";
import { hojeIso } from "./datas.js";

/*
 * Junta, numa lista só, tudo o que tem lembrete ativo hoje: garantias a
 * acabar, contas a renovar e prazos do Estado. É o que o sino mostra.
 * Função pura — os dados entram por parâmetro (ver lib/dadosLocais).
 */
export function calcularAvisos({ garantias = [], contas = [], prazos = [], prazosComLembrete = [] }, hoje = hojeIso()) {
  const avisos = [];

  for (const g of garantias) {
    if (g.lembrete === false) continue;
    const e = estadoLembrete(g.fim, hoje, ANTECEDENCIA_GARANTIAS);
    if (!e.ativo) continue;
    avisos.push({ id: `g:${g.id}`, tipo: "garantia", titulo: g.produto, data: g.fim, dias: e.dias, marco: e.marco });
  }

  for (const c of contas) {
    if (!c.lembrete) continue;
    const m = proximoMarco(c, hoje);
    if (!m) continue;
    const e = estadoLembrete(m.data, hoje, ANTECEDENCIA_CONTAS);
    if (!e.ativo) continue;
    avisos.push({
      id: `c:${c.id}:${m.data}`,
      tipo: "conta",
      motivo: m.motivo,
      titulo: c.nome || TIPOS[c.tipo]?.label || "Conta",
      data: m.data,
      dias: e.dias,
      marco: e.marco,
    });
  }

  const comLembrete = new Set(prazosComLembrete);
  for (const p of prazos) {
    if (!comLembrete.has(p.id)) continue;
    const prox = proximoPeriodo(p.prazo, hoje);
    if (!prox) continue;
    const e = estadoLembrete(prox.fim, hoje, ANTECEDENCIA_PRAZOS);
    if (!e.ativo) continue;
    avisos.push({ id: `p:${p.id}:${prox.fim}`, tipo: "prazo", titulo: p.titulo, data: prox.fim, dias: e.dias, marco: e.marco });
  }

  return avisos.sort((a, b) => a.dias - b.dias);
}

/** Chave de "já notifiquei este marco": cada aviso notifica uma vez por marco (60, 30…). */
export function chaveNotificacao(aviso) {
  return `${aviso.id}@${aviso.marco}`;
}

export function textoAviso(a) {
  const quando = a.dias === 0 ? "hoje" : a.dias === 1 ? "amanhã" : `daqui a ${a.dias} dias`;
  if (a.tipo === "garantia") return `A garantia acaba ${quando}.`;
  if (a.tipo === "conta") {
    return a.motivo === "fidelizacao"
      ? `A fidelização acaba ${quando}. Boa altura para comparar ou renegociar.`
      : `Renova ${quando}. Boa altura para comparar ou renegociar.`;
  }
  return `O prazo acaba ${quando}.`;
}
