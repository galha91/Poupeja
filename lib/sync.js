import { supabase } from "./supabase";

/*
 * Sincronização dos dados locais com o Supabase (tabela dados_utilizador).
 *
 * Estratégia: o resto da app continua a ler/escrever localStorage como sempre.
 * Este módulo intercepta as escritas às chaves poupeja_* e envia-as (debounced)
 * para o Supabase. No arranque/login faz pull: para cada chave, ganha a versão
 * mais recente (last-write-wins por chave).
 *
 * Se a tabela ainda não existir no Supabase, todas as operações falham em
 * silêncio e a app funciona apenas com localStorage, como até aqui.
 */

const CHAVES_SYNC = [
  "poupeja_taloes",
  "poupeja_lista_compras",
  "poupeja_prefs",
  "poupeja_alertas_ev",
  "poupeja_favoritos_lojas",
  "poupeja_avisos",
  "poupeja_casa",
  "poupeja_irs",
  "poupeja_contas",
  "poupeja_contas_pago",
  "poupeja_desafio52",
  "poupeja_meta",
];

const META_KEY = "poupeja_sync_meta"; // { [chave]: timestamp ms da última escrita local }

let userId = null;
let patched = false;
let aplicandoPull = false; // evita que escritas vindas do pull voltem a ser enviadas
const timers = {};

function lerMeta() {
  try { return JSON.parse(localStorage.getItem(META_KEY) || "{}"); } catch { return {}; }
}
function guardarMeta(meta) {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch {}
}

function valorParaJson(raw) {
  try { return JSON.parse(raw); } catch { return raw; }
}

async function push(chave) {
  if (!userId) return;
  const raw = localStorage.getItem(chave);
  if (raw == null) return;
  const meta = lerMeta();
  const ts = meta[chave] || Date.now();
  try {
    await supabase.from("dados_utilizador").upsert({
      user_id: userId,
      chave,
      valor: valorParaJson(raw),
      atualizado_em: new Date(ts).toISOString(),
    });
  } catch {}
}

function agendarPush(chave) {
  clearTimeout(timers[chave]);
  timers[chave] = setTimeout(() => push(chave), 1500);
}

function pushTudoPendente() {
  Object.keys(timers).forEach(chave => {
    if (timers[chave]) {
      clearTimeout(timers[chave]);
      timers[chave] = null;
      push(chave);
    }
  });
}

function patchLocalStorage() {
  if (patched || typeof window === "undefined") return;
  patched = true;
  const original = Storage.prototype.setItem;
  Storage.prototype.setItem = function (chave, valor) {
    original.call(this, chave, valor);
    if (this !== window.localStorage) return;
    if (!CHAVES_SYNC.includes(chave) || aplicandoPull) return;
    const meta = lerMeta();
    meta[chave] = Date.now();
    guardarMeta(meta);
    agendarPush(chave);
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") pushTudoPendente();
  });
}

async function pull() {
  if (!userId) return;
  let rows;
  try {
    const { data, error } = await supabase
      .from("dados_utilizador")
      .select("chave, valor, atualizado_em")
      .eq("user_id", userId);
    if (error) return;
    rows = data || [];
  } catch { return; }

  const meta = lerMeta();
  const remotas = new Set();
  let mudou = false;

  for (const row of rows) {
    if (!CHAVES_SYNC.includes(row.chave)) continue;
    remotas.add(row.chave);
    const tsRemoto = new Date(row.atualizado_em).getTime();
    const tsLocal = meta[row.chave] || 0;
    if (tsRemoto > tsLocal) {
      aplicandoPull = true;
      try {
        localStorage.setItem(row.chave, typeof row.valor === "string" ? row.valor : JSON.stringify(row.valor));
        meta[row.chave] = tsRemoto;
        mudou = true;
      } catch {}
      aplicandoPull = false;
    }
  }
  guardarMeta(meta);

  // Chaves que existem localmente mas ainda não estão no Supabase → enviar
  for (const chave of CHAVES_SYNC) {
    if (!remotas.has(chave) && localStorage.getItem(chave) != null) {
      const m = lerMeta();
      if (!m[chave]) { m[chave] = Date.now(); guardarMeta(m); }
      push(chave);
    }
  }

  if (mudou) window.dispatchEvent(new CustomEvent("poupeja:sync-updated"));
}

/** Chamar depois do login / no arranque com sessão ativa. */
export function iniciarSync(idUtilizador) {
  if (!idUtilizador || typeof window === "undefined") return;
  const novoUser = userId !== idUtilizador;
  userId = idUtilizador;
  patchLocalStorage();
  if (novoUser) pull();
}

/** Chamar no logout. Os dados locais mantêm-se; deixa apenas de sincronizar. */
export function pararSync() {
  pushTudoPendente();
  userId = null;
}
