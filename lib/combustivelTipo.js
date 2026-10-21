/*
 * A conta da página nacional de um combustível (/combustiveis/gasoleo…),
 * sem I/O — testável com dados à mão, como lib/distritos.
 *
 * Responde a "preço do gasóleo hoje": a média do país, os postos mais
 * baratos, os distritos do mais barato para o mais caro e os concelhos
 * onde compensa atestar.
 */
export const TIPOS_PAGINA = [
  { slug: "gasoleo", tipo: "Gasóleo", nome: "gasóleo" },
  { slug: "gasolina-95", tipo: "Gasolina 95", nome: "gasolina 95" },
  { slug: "gpl", tipo: "GPL Auto", nome: "GPL Auto" },
];

export function resumirTipo({ tipo, postos, lista, medias }) {
  const doTipo = postos.filter(p => p.tipoLabel === tipo);
  if (doTipo.length < 10) return null;

  const baratos = [...doTipo].sort((a, b) => a.preco - b.preco).slice(0, 10).map(p => ({
    nome: p.nome || p.marca, marca: p.marca || null, municipio: p.municipio || null, distrito: p.distrito || null, preco: p.preco,
  }));
  const precos = doTipo.map(p => p.preco).sort((a, b) => a - b);
  const mediana = precos[Math.floor(precos.length / 2)];

  const porDistrito = new Map();
  for (const p of doTipo) {
    if (!p.distrito) continue;
    const d = porDistrito.get(p.distrito) || { nome: p.distrito, soma: 0, n: 0, min: Infinity };
    d.soma += p.preco; d.n++; d.min = Math.min(d.min, p.preco);
    porDistrito.set(p.distrito, d);
  }
  const distritos = [...porDistrito.values()]
    .map(d => ({ nome: d.nome, media: d.soma / d.n, minimo: d.min, n: d.n }))
    .sort((a, b) => a.media - b.media);

  const concelhos = lista
    .filter(m => m.baratos[tipo])
    .map(m => ({ slug: m.slug, nome: m.nome, distrito: m.distrito, preco: m.baratos[tipo].preco }))
    .sort((a, b) => a.preco - b.preco)
    .slice(0, 15);

  return {
    media: medias[tipo] ?? doTipo.reduce((s, p) => s + p.preco, 0) / doTipo.length,
    minimo: precos[0],
    maximo: precos[precos.length - 1],
    mediana,
    nPrecos: doTipo.length,
    // Atestar 50 L no mais barato do país em vez de num posto na média.
    porDeposito: parseFloat((((medias[tipo] ?? mediana) - precos[0]) * 50).toFixed(2)),
    baratos,
    distritos,
    concelhos,
  };
}
