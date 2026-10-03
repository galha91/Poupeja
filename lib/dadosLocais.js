import { converterGarantiaAntiga } from "./garantias.js";
import { guardarFoto, lerFoto, dataUrlParaBlob, blobParaDataUrl, apagarTodasFotos } from "./fotosDB.js";
import { calcularAvisos, chaveNotificacao, textoAviso } from "./avisos.js";
import { gerarIcs } from "./lembretes.js";
import dadosPrazos from "../data/prazos-estado.json";
import { prazoValido } from "./prazosEstado.js";
import { VERSAO_COPIA, validarCopia, juntarPorId } from "./copia.js";

/*
 * Garantias, contas que renovam e perfil dos prazos do Estado: tudo só
 * neste dispositivo. Estas chaves NÃO estão em CHAVES_SYNC (lib/sync) de
 * propósito — não vão para a conta, nem com sessão iniciada.
 */
export const CHAVES = {
  garantias: "poupeja_garantias",
  renovacoes: "poupeja_renovacoes",
  perfilPrazos: "poupeja_perfil_prazos",
  lembretesPrazos: "poupeja_prazos_lembretes",
  notificados: "poupeja_lembretes_notificados",
};

function ler(chave, porOmissao) {
  try {
    const v = JSON.parse(localStorage.getItem(chave));
    return v ?? porOmissao;
  } catch { return porOmissao; }
}
function escrever(chave, valor) {
  try { localStorage.setItem(chave, JSON.stringify(valor)); return true; } catch { return false; }
}

export const lerGarantias = () => { const v = ler(CHAVES.garantias, []); return Array.isArray(v) ? v : []; };
export const guardarGarantias = l => escrever(CHAVES.garantias, l);
export const lerRenovacoes = () => { const v = ler(CHAVES.renovacoes, []); return Array.isArray(v) ? v : []; };
export const guardarRenovacoes = l => escrever(CHAVES.renovacoes, l);
export const lerPerfilPrazos = () => { const v = ler(CHAVES.perfilPrazos, []); return Array.isArray(v) ? v : []; };
export const guardarPerfilPrazos = l => escrever(CHAVES.perfilPrazos, l);
export const lerLembretesPrazos = () => { const v = ler(CHAVES.lembretesPrazos, []); return Array.isArray(v) ? v : []; };
export const guardarLembretesPrazos = l => escrever(CHAVES.lembretesPrazos, l);

export function novoId(prefixo = "") {
  return prefixo + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function prazosDoFicheiro() {
  return (dadosPrazos.prazos || []).filter(prazoValido);
}
export const prazosAtualizado = dadosPrazos.atualizado;

/* ─── Avisos do sino ─── */

export function avisosLocais() {
  return calcularAvisos({
    garantias: lerGarantias(),
    contas: lerRenovacoes(),
    prazos: prazosDoFicheiro(),
    prazosComLembrete: lerLembretesPrazos(),
  });
}

/*
 * Notificação do sistema ao abrir a app, uma vez por marco (60 e 30 dias).
 * Nunca pede permissão — só usa a que a pessoa já deu. Sem permissão, o
 * aviso fica no sino como sempre.
 */
export async function notificarAvisosNovos(avisos) {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    if (!("serviceWorker" in navigator)) return;
    const vistos = new Set(ler(CHAVES.notificados, []));
    const novos = avisos.filter(a => !vistos.has(chaveNotificacao(a)));
    if (!novos.length) return;
    const reg = await navigator.serviceWorker.ready;
    for (const a of novos.slice(0, 3)) {
      await reg.showNotification(a.titulo, { body: textoAviso(a), icon: "/icon-192.png", badge: "/icon-192.png", tag: a.id, data: { url: "/" } });
    }
    novos.forEach(a => vistos.add(chaveNotificacao(a)));
    escrever(CHAVES.notificados, [...vistos].slice(-200));
  } catch {}
}

/* ─── Migração das garantias antigas (poupeja_taloes) ─── */

/*
 * As garantias viviam em poupeja_taloes (tipo "garantia"), com a foto em
 * base64 no localStorage e a lista sincronizada com a conta. Passam para
 * poupeja_garantias (só local) e a foto para o IndexedDB.
 *
 * Ordem pensada para não perder nada: primeiro grava as fotos, depois a
 * lista nova, e só no fim tira as garantias dos talões — relendo os
 * talões nesse momento, porque a sincronização pode tê-los atualizado
 * entretanto. Se o IndexedDB falhar, não mexe em nada.
 */
export async function migrarGarantiasAntigas() {
  let taloes;
  try { taloes = JSON.parse(localStorage.getItem("poupeja_taloes") || "[]"); } catch { return 0; }
  if (!Array.isArray(taloes)) return 0;
  const antigas = taloes.map(converterGarantiaAntiga).filter(Boolean);
  if (!antigas.length) return 0;

  const atuais = lerGarantias();
  const existentes = new Set(atuais.map(g => g.id));
  const novas = [];
  try {
    for (const { garantia, foto } of antigas) {
      if (existentes.has(garantia.id)) continue;
      if (foto) await guardarFoto(garantia.id, await dataUrlParaBlob(foto));
      novas.push(garantia);
    }
  } catch {
    return 0;
  }
  if (novas.length && !guardarGarantias([...atuais, ...novas])) return 0;

  try {
    const agora = JSON.parse(localStorage.getItem("poupeja_taloes") || "[]");
    if (Array.isArray(agora)) localStorage.setItem("poupeja_taloes", JSON.stringify(agora.filter(t => t?.tipo !== "garantia")));
  } catch {}
  return novas.length;
}

/* ─── Cópia de segurança ─── */

export async function criarCopia() {
  const garantias = lerGarantias();
  const fotos = {};
  for (const g of garantias) {
    if (!g.temFoto) continue;
    try {
      const blob = await lerFoto(g.id);
      if (blob) fotos[g.id] = await blobParaDataUrl(blob);
    } catch {}
  }
  return {
    app: "poupeja",
    versao: VERSAO_COPIA,
    criadaEm: new Date().toISOString(),
    garantias,
    fotos,
    renovacoes: lerRenovacoes(),
    perfilPrazos: lerPerfilPrazos(),
    lembretesPrazos: lerLembretesPrazos(),
  };
}

export async function restaurarCopia(c) {
  const v = validarCopia(c);
  if (!v.ok) return v;
  const garantiasLocais = lerGarantias();
  const ids = new Set(garantiasLocais.map(g => g.id));
  for (const g of c.garantias) {
    if (!g?.id || ids.has(g.id) || !c.fotos?.[g.id]) continue;
    try { await guardarFoto(g.id, await dataUrlParaBlob(c.fotos[g.id])); } catch {}
  }
  guardarGarantias(juntarPorId(garantiasLocais, c.garantias));
  guardarRenovacoes(juntarPorId(lerRenovacoes(), c.renovacoes));
  if (Array.isArray(c.perfilPrazos) && !lerPerfilPrazos().length) guardarPerfilPrazos(c.perfilPrazos);
  if (Array.isArray(c.lembretesPrazos)) guardarLembretesPrazos([...new Set([...lerLembretesPrazos(), ...c.lembretesPrazos])]);
  return { ok: true, garantias: c.garantias.length, renovacoes: c.renovacoes.length };
}

/** Para "apagar conta" e afins: as fotos não estão no localStorage. */
export function apagarFotosLocais() {
  return apagarTodasFotos().catch(() => {});
}

/* ─── Ficheiros: descarregar e partilhar ─── */

export function descarregar(nome, conteudo, tipo) {
  const blob = conteudo instanceof Blob ? conteudo : new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Partilha pelo menu do telemóvel quando dá; senão, descarrega. */
export async function partilharOuDescarregar(nome, blob, titulo) {
  try {
    const f = new File([blob], nome, { type: blob.type });
    if (navigator.canShare?.({ files: [f] })) {
      await navigator.share({ files: [f], title: titulo });
      return "partilhado";
    }
  } catch (e) {
    if (e?.name === "AbortError") return "cancelado";
  }
  descarregar(nome, blob);
  return "descarregado";
}

/** Lembretes em .ics — o calendário do telemóvel avisa mesmo com a app fechada. */
export function exportarIcs(nome, eventos) {
  descarregar(nome, gerarIcs(eventos), "text/calendar;charset=utf-8");
}
