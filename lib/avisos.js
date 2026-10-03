import { estadoLembrete, ANTECEDENCIA_CONTAS, ANTECEDENCIA_GARANTIAS, ANTECEDENCIA_PRAZOS } from "./lembretes.js";
import { proximoMarco, TIPOS } from "./renovacoes.js";
import { proximoPeriodo } from "./prazosEstado.js";
import { hojeIso, diasEntre } from "./datas.js";

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

/*
 * Lembretes FUTUROS (não só os de hoje): para agendar notificações no
 * telemóvel (app nativa) ou para o servidor avisar com a app fechada,
 * se a pessoa o pedir. Cada um leva a data-alvo e as antecedências; o
 * título é o mínimo para se perceber o aviso — sem preço, loja nem foto.
 */
export function lembretesFuturos({ garantias = [], contas = [], prazos = [], prazosComLembrete = [] }, hoje = hojeIso()) {
  const out = [];
  for (const g of garantias) {
    if (g.lembrete === false) continue;
    const e = estadoLembrete(g.fim, hoje, ANTECEDENCIA_GARANTIAS);
    if (e.dias == null || e.dias < 0) continue;
    out.push({ id: `g:${g.id}`, tipo: "garantia", titulo: g.produto, data: g.fim, antecedencias: ANTECEDENCIA_GARANTIAS });
  }
  for (const c of contas) {
    if (!c.lembrete) continue;
    const m = proximoMarco(c, hoje);
    if (!m) continue;
    out.push({ id: `c:${c.id}:${m.data}`, tipo: "conta", motivo: m.motivo, titulo: c.nome || TIPOS[c.tipo]?.label || "Conta", data: m.data, antecedencias: ANTECEDENCIA_CONTAS });
  }
  const comLembrete = new Set(prazosComLembrete);
  for (const p of prazos) {
    if (!comLembrete.has(p.id)) continue;
    const prox = proximoPeriodo(p.prazo, hoje);
    if (!prox) continue;
    out.push({ id: `p:${p.id}:${prox.fim}`, tipo: "prazo", titulo: p.titulo, data: prox.fim, antecedencias: ANTECEDENCIA_PRAZOS });
  }
  return out.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
}

/** Texto da notificação para um lembrete a `dias` da data-alvo (servidor e app nativa). */
export function textoLembrete(l, dias) {
  return textoAviso({ ...l, dias });
}

const EMOJI = { garantia: "🛡️", conta: "🔁", prazo: "📅" };
const DESTINO = { garantia: "/?atalho=garantias", conta: "/?atalho=renovacoes", prazo: "/?atalho=prazos" };

/**
 * Para o cron do servidor: dos lembretes enviados pela pessoa (opt-in),
 * os que fazem hoje exatamente uma das antecedências. Defensivo — os
 * dados vêm de um cliente e podem estar mal formados.
 */
export function lembretesDoDia(lista, hoje) {
  if (!Array.isArray(lista)) return [];
  const out = [];
  for (const l of lista.slice(0, 100)) {
    if (!l || typeof l !== "object" || !EMOJI[l.tipo]) continue;
    const dias = diasEntre(hoje, l.data);
    if (dias == null || !Array.isArray(l.antecedencias) || !l.antecedencias.includes(dias)) continue;
    const titulo = String(l.titulo || "").slice(0, 80) || "Lembrete";
    out.push({ titulo: `${EMOJI[l.tipo]} ${titulo}`, texto: textoLembrete(l, dias), url: DESTINO[l.tipo] });
  }
  return out;
}
