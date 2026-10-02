/*
 * Pesquisa no catálogo da lista — tolerante, como se escreve à pressa no
 * supermercado: sem acentos ("macas" acha "Maçãs"), singular ou plural
 * ("ovo" acha "Ovos") e um erro ou dois ("bacalao" acha "Bacalhau").
 *
 * Sem dependências: o catálogo tem ~230 artigos, uma passagem linear por
 * tecla é instantânea.
 */

const semAcentos = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Singular aproximado — só para comparar palavras, não é gramática.
export function raiz(w) {
  if (w.length <= 3) return w;
  if (w.endsWith("oes") || w.endsWith("aes")) return w.slice(0, -3) + "ao";
  if (w.endsWith("ais")) return w.slice(0, -2) + "l";
  if (w.endsWith("ns")) return w.slice(0, -2) + "m";
  if (/[rsz]es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith("s")) return w.slice(0, -1);
  return w;
}

const VAZIAS = new Set(["de", "da", "do", "das", "dos", "e", "com", "para", "em", "a", "o"]);
export const palavras = (t) => semAcentos(t).split(/[^a-z0-9]+/).filter((w) => w && !VAZIAS.has(w)).map(raiz);

// Distância de edição com transposições (Damerau, versão simples), com corte.
function distancia(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let menor = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      menor = Math.min(menor, d[i][j]);
    }
    if (menor > max) return max + 1;
  }
  return d[a.length][b.length];
}

const tolerancia = (t) => (t.length >= 7 ? 2 : t.length >= 4 ? 1 : 0);

/* Quão bem uma palavra escrita casa com uma palavra do artigo (0 = nada). */
function casaPalavra(t, w, ultima) {
  if (w === t) return 3;
  if (ultima && w.startsWith(t)) return 2; // a escrever ainda: "baca" → bacalhau
  const k = tolerancia(t);
  if (!k) return 0;
  if (distancia(t, w, k) <= k) return 1;
  if (ultima && w.length > t.length && distancia(t, w.slice(0, t.length), k) <= k) return 1;
  return 0;
}

/* Pontuação de um texto (nome ou sinónimo) para as palavras pesquisadas. */
function pontuar(termos, texto) {
  const ws = palavras(texto);
  if (!ws.length) return 0;
  let total = 0;
  for (let i = 0; i < termos.length; i++) {
    const ultima = i === termos.length - 1;
    const melhor = Math.max(0, ...ws.map((w) => casaPalavra(termos[i], w, ultima)));
    if (!melhor) return 0; // todas as palavras escritas têm de aparecer
    total += melhor;
  }
  // Preferir o artigo cujo nome é só aquilo ("Alho" antes de "Alho-francês")
  // e o que começa pelo que se escreveu.
  if (ws.length === termos.length) total += 1;
  if (casaPalavra(termos[0], ws[0], termos.length === 1) >= 2) total += 1;
  return total;
}

/**
 * @param texto o que se escreveu
 * @param itens [{ nome, sin, top }]
 * @returns itens ordenados pela relevância (no máximo `limite`)
 */
export function pesquisarCatalogo(texto, itens, limite = 12) {
  const termos = palavras(texto);
  if (!termos.length || semAcentos(texto).trim().length < 2) return [];
  const res = [];
  for (const it of itens) {
    const pNome = pontuar(termos, it.nome);
    // Um sinónimo vale um pouco menos do que o nome.
    const pSin = Math.max(0, ...(it.sin || []).map((s) => pontuar(termos, s) - 0.5));
    const p = Math.max(pNome, pSin);
    if (p > 0) res.push({ it, p: p + (it.top ? 0.25 : 0) });
  }
  return res.sort((a, b) => b.p - a.p || a.it.nome.localeCompare(b.it.nome, "pt")).slice(0, limite).map((r) => r.it);
}

/* O texto escrito é exatamente um artigo do catálogo (ou um sinónimo)? */
export function correspondeExato(texto, it) {
  const t = palavras(texto).join(" ");
  return [it.nome, ...(it.sin || [])].some((n) => palavras(n).join(" ") === t);
}
