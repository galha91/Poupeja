/*
 * "Combustíveis esta semana" — as contas, sem I/O (testáveis à parte).
 *
 * Todos os dias, depois de guardar os preços da DGEG, guarda-se um resumo:
 * média e mínimo por combustível e por marca (e do país, marca "*"). Com
 * uma semana de resumos dá para dizer, só com dados reais, quanto cada
 * marca subiu ou desceu. Não é uma previsão: é o que já aconteceu.
 */
export const TIPOS_SEMANA = ["Gasóleo", "Gasolina 95", "Gasolina 98", "GPL Auto"];
export const PAIS = "*";
const MIN_POSTOS_MARCA = 10; // abaixo disto, a média de uma marca mexe com um só posto

const arred3 = (n) => Math.round(n * 1000) / 1000;

/* [{ dia, tipo, marca, media, minimo, n }] para um dia */
export function resumoDiario(postos, dia) {
  const grupos = new Map(); // `${tipo}|${chave}` → { tipo, marca, precos[] }
  const nomes = new Map();  // chave normalizada → nome como a DGEG o escreve (o mais frequente)
  for (const p of postos || []) {
    if (!TIPOS_SEMANA.includes(p.tipoLabel) || !(p.preco > 0)) continue;
    const marca = String(p.marca || "").trim();
    for (const chave of [PAIS, marca.toLowerCase()]) {
      if (!chave) continue;
      const k = `${p.tipoLabel}|${chave}`;
      if (!grupos.has(k)) grupos.set(k, { tipo: p.tipoLabel, chave, precos: [] });
      grupos.get(k).precos.push(p.preco);
    }
    if (marca) {
      const c = nomes.get(marca.toLowerCase()) || new Map();
      c.set(marca, (c.get(marca) || 0) + 1);
      nomes.set(marca.toLowerCase(), c);
    }
  }
  const nomeDe = (chave) => {
    if (chave === PAIS) return PAIS;
    const c = nomes.get(chave);
    return c ? [...c.entries()].sort((a, b) => b[1] - a[1])[0][0] : chave;
  };
  const linhas = [];
  for (const g of grupos.values()) {
    if (g.chave !== PAIS && g.precos.length < MIN_POSTOS_MARCA) continue;
    linhas.push({
      dia, tipo: g.tipo, marca: nomeDe(g.chave),
      media: arred3(g.precos.reduce((s, v) => s + v, 0) / g.precos.length),
      minimo: arred3(Math.min(...g.precos)),
      n: g.precos.length,
    });
  }
  return linhas;
}

const DIA_MS = 86400000;
const diasEntre = (a, b) => Math.round((Date.parse(a) - Date.parse(b)) / DIA_MS);

/*
 * Variação semanal a partir dos resumos guardados. Compara o dia mais
 * recente com o resumo mais próximo de 7 dias antes (aceita 5 a 9, para
 * sobreviver a um dia sem cron). Sem esse par, devolve null.
 */
export function variacaoSemanal(linhas) {
  if (!linhas?.length) return null;
  const dias = [...new Set(linhas.map(l => l.dia))].sort();
  const hoje = dias[dias.length - 1];
  const candidatos = dias.filter(d => { const n = diasEntre(hoje, d); return n >= 5 && n <= 9; });
  if (!candidatos.length) return { hoje, antes: null, primeiroDia: dias[0], porTipo: null };
  const antes = candidatos.reduce((a, b) => (Math.abs(diasEntre(hoje, b) - 7) < Math.abs(diasEntre(hoje, a) - 7) ? b : a));

  const doDia = (d) => new Map(linhas.filter(l => l.dia === d).map(l => [`${l.tipo}|${l.marca.toLowerCase()}`, l]));
  const A = doDia(hoje), B = doDia(antes);
  const porTipo = {};
  for (const tipo of TIPOS_SEMANA) {
    const linha = (l) => {
      const ant = B.get(`${tipo}|${l.marca.toLowerCase()}`);
      return { marca: l.marca, media: l.media, minimo: l.minimo, n: l.n, diffCent: ant ? Math.round((l.media - ant.media) * 1000) / 10 : null };
    };
    const atuais = [...A.values()].filter(l => l.tipo === tipo);
    const pais = atuais.find(l => l.marca === PAIS);
    if (!pais) continue;
    porTipo[tipo] = {
      pais: linha(pais),
      marcas: atuais.filter(l => l.marca !== PAIS).map(linha)
        .filter(m => m.diffCent != null)
        .sort((a, b) => a.diffCent - b.diffCent || a.media - b.media),
    };
  }
  return { hoje, antes, primeiroDia: dias[0], porTipo };
}
