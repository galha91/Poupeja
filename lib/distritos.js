/*
 * A conta de uma página de distrito, sem I/O — testável com dados à mão
 * (lib/municipios importa a DGEG e os slugs das páginas, que trazem JSON;
 * os testes em node não os conseguem carregar).
 */
const TIPOS_DESTAQUE = ["Gasóleo", "Gasolina 95", "GPL Auto"]; // os mesmos de lib/municipios

export function resumirDistrito({ nome, postos, lista, medias }) {
  const doDistrito = postos.filter(p => p.distrito === nome);
  if (!doDistrito.length) return null;

  const destaques = TIPOS_DESTAQUE.map(t => {
    const doTipo = doDistrito.filter(p => p.tipoLabel === t);
    if (!doTipo.length) return null;
    const melhor = doTipo.reduce((a, b) => (b.preco < a.preco ? b : a));
    const media = doTipo.reduce((s, p) => s + p.preco, 0) / doTipo.length;
    return {
      tipoLabel: t,
      preco: melhor.preco,
      nome: melhor.nome || melhor.marca,
      municipio: melhor.municipio,
      mediaDistrito: media,
      // Média contra média, em cêntimos/litro (ver dadosMunicipio).
      vsPais: medias[t] ? Math.round((media - medias[t]) * 100) : null,
    };
  }).filter(Boolean);

  const gasoleos = doDistrito.filter(p => p.tipoLabel === "Gasóleo").map(p => p.preco);
  const amplitude = gasoleos.length >= 2
    ? {
        min: Math.min(...gasoleos),
        max: Math.max(...gasoleos),
        porDeposito: parseFloat(((Math.max(...gasoleos) - Math.min(...gasoleos)) * 50).toFixed(2)),
      }
    : null;

  // Concelhos com página, do gasóleo mais barato para o mais caro; os sem
  // gasóleo vão para o fim, por nome.
  const concelhos = lista
    .filter(m => m.distrito === nome)
    .map(m => ({
      slug: m.slug, nome: m.nome, nPostos: m.nPostos,
      gasoleo: m.baratos["Gasóleo"]?.preco ?? null,
      gasolina: m.baratos["Gasolina 95"]?.preco ?? null,
    }))
    .sort((a, b) =>
      (a.gasoleo == null) - (b.gasoleo == null) ||
      (a.gasoleo ?? 0) - (b.gasoleo ?? 0) ||
      a.nome.localeCompare(b.nome, "pt"));

  const nPostos = new Set(doDistrito.map(p => p.id ?? `${p.nome}|${p.lat}|${p.lon}`)).size;
  return { destaques, amplitude, concelhos, nPostos };
}

