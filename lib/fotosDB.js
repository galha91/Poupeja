/*
 * Fotos de talões/faturas das garantias — IndexedDB, só neste dispositivo.
 *
 * Porquê IndexedDB e não localStorage: o localStorage tem ~5 MB para a app
 * inteira e só guarda texto (uma foto em base64 pesa mais um terço). O
 * IndexedDB guarda o Blob tal como é e tem quota muito maior. As fotos
 * nunca entram na sincronização com a conta.
 */

const BD = "poupeja-fotos";
const LOJA = "fotos";

let ligacao = null;

function abrir() {
  if (ligacao) return ligacao;
  ligacao = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("Sem IndexedDB neste browser."));
    const pedido = indexedDB.open(BD, 1);
    pedido.onupgradeneeded = () => pedido.result.createObjectStore(LOJA);
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
  ligacao.catch(() => { ligacao = null; });
  return ligacao;
}

function transacao(modo, fn) {
  return abrir().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(LOJA, modo);
    const r = fn(tx.objectStore(LOJA));
    tx.oncomplete = () => resolve(r?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }));
}

export function guardarFoto(id, blob) {
  return transacao("readwrite", s => s.put(blob, id));
}

export function lerFoto(id) {
  return transacao("readonly", s => s.get(id));
}

export function apagarFoto(id) {
  return transacao("readwrite", s => s.delete(id));
}

export function idsFotos() {
  return transacao("readonly", s => s.getAllKeys());
}

export function apagarTodasFotos() {
  return transacao("readwrite", s => s.clear());
}

export async function dataUrlParaBlob(dataUrl) {
  const r = await fetch(dataUrl);
  return r.blob();
}

export function blobParaDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}
