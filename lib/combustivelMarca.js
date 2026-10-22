/*
 * A conta da página de uma marca de combustível (/combustiveis/marca/galp…),
 * sem I/O — testável com dados à mão, como lib/distritos.
 *
 * Responde a "preço gasóleo Galp hoje": a média da marca contra o país,
 * o lugar entre as marcas, os postos mais baratos dela e os distritos onde
 * está mais barata. Só marcas com postos suficientes (MIN_POSTOS_MARCA):
 * uma marca com 4 postos não diz nada sobre "a Galp".
 */
import { slugify } from "./slug.js";

export const MIN_POSTOS_MARCA = 20;
export const TIPOS_MARCA = ["Gasóleo", "Gasolina 95", "GPL Auto"];

const idPosto = (p) => p.id ?? `${p.nome}|${p.lat}|${p.lon}`;

/* Marcas com página: [{ slug, nome, nPostos }], da maior para a menor. */
export function listarMarcasCombustivel(postos) {
  const m = new Map();
  for (const p of postos) {
    if (!p.marca) continue;
    const slug = slugify(p.marca);
    if (!slug) continue;
    if (!m.has(slug)) m.set(slug, { slug, nome: p.marca, ids: new Set() });
    m.get(slug).ids.add(idPosto(p));
  }
  return [...m.values()]
    .map(({ slug, nome, ids }) => ({ slug, nome, nPostos: ids.size }))
    .filter((x) => x.nPostos >= MIN_POSTOS_MARCA)
    .sort((a, b) => b.nPostos - a.nPostos || a.nome.localeCompare(b.nome, "pt"));
}

const media = (v) => v.reduce((s, x) => s + x, 0) / v.length;

export function resumirMarca({ slug, postos, medias }) {
  const daMarca = postos.filter((p) => p.marca && slugify(p.marca) === slug);
  const marcas = listarMarcasCombustivel(postos);
  const info = marcas.find((x) => x.slug === slug);
  if (!info) return null;

  const tipos = TIPOS_MARCA.map((tipo) => {
    const doTipo = daMarca.filter((p) => p.tipoLabel === tipo);
    if (!doTipo.length) return null;
    const precos = doTipo.map((p) => p.preco);
    const m = media(precos);
    // Lugar entre as marcas com página, pela média deste combustível.
    const ranking = marcas
      .map((x) => {
        const v = postos.filter((p) => p.tipoLabel === tipo && p.marca && slugify(p.marca) === x.slug).map((p) => p.preco);
        return v.length ? { slug: x.slug, media: media(v) } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.media - b.media);
    return {
      tipo,
      n: doTipo.length,
      media: m,
      minimo: Math.min(...precos),
      vsPais: medias[tipo] ? Math.round((m - medias[tipo]) * 1000) / 10 : null, // cêntimos/litro, 1 casa
      posicao: ranking.findIndex((r) => r.slug === slug) + 1,
      deMarcas: ranking.length,
    };
  }).filter(Boolean);

  const gasoleo = daMarca.filter((p) => p.tipoLabel === "Gasóleo");
  const baratos = [...gasoleo].sort((a, b) => a.preco - b.preco).slice(0, 10)
    .map((p) => ({ nome: p.nome || p.marca, municipio: p.municipio || null, distrito: p.distrito || null, preco: p.preco }));

  const porDistrito = new Map();
  for (const p of gasoleo) {
    if (!p.distrito) continue;
    if (!porDistrito.has(p.distrito)) porDistrito.set(p.distrito, []);
    porDistrito.get(p.distrito).push(p.preco);
  }
  const distritos = [...porDistrito.entries()]
    .map(([nome, v]) => ({ nome, media: media(v), minimo: Math.min(...v), n: v.length }))
    .sort((a, b) => a.media - b.media);

  return { marca: { slug, nome: info.nome, nPostos: info.nPostos }, tipos, baratos, distritos, outras: marcas.filter((x) => x.slug !== slug).slice(0, 12) };
}
