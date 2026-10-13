/*
 * Resumo diário dos combustíveis — as contas, sem I/O (testáveis à parte).
 *
 * Todos os dias, depois de guardar os preços da DGEG, guarda-se um resumo
 * (tabela precos_dgeg_diario): média e mínimo por combustível, para o país,
 * cada marca, cada distrito e cada concelho. Daí saem, só com dados reais:
 *   - "Combustíveis esta semana" — quanto cada marca subiu ou desceu;
 *   - o gráfico de 30 dias das páginas de distrito e de concelho.
 * Nada disto é uma previsão: é o que já aconteceu.
 */
import { slugify } from "./slug.js"; // com .js: os testes correm em node sem bundler

export const TIPOS_SEMANA = ["Gasóleo", "Gasolina 95", "Gasolina 98", "GPL Auto"];
export const PAIS = "*";
// Abaixo destes números, a média mexe com um só posto e não diz nada.
const MIN_POSTOS = { pais: 1, marca: 10, distrito: 3, concelho: 3 };

const arred3 = (n) => Math.round(n * 1000) / 1000;

/* [{ dia, tipo, escopo, chave, nome, media, minimo, n }] para um dia */
export function resumoDiario(postos, dia) {
  const grupos = new Map();
  const juntar = (tipo, escopo, chave, nome, preco) => {
    if (!chave) return;
    const k = `${tipo}|${escopo}|${chave}`;
    if (!grupos.has(k)) grupos.set(k, { tipo, escopo, chave, nomes: new Map(), precos: [] });
    const g = grupos.get(k);
    g.precos.push(preco);
    if (nome) g.nomes.set(nome, (g.nomes.get(nome) || 0) + 1);
  };
  for (const p of postos || []) {
    if (!TIPOS_SEMANA.includes(p.tipoLabel) || !(p.preco > 0)) continue;
    const marca = String(p.marca || "").trim();
    juntar(p.tipoLabel, "pais", PAIS, PAIS, p.preco);
    juntar(p.tipoLabel, "marca", marca.toLowerCase(), marca, p.preco);
    juntar(p.tipoLabel, "distrito", slugify(p.distrito || ""), p.distrito, p.preco);
    juntar(p.tipoLabel, "concelho", slugify(p.municipio || ""), p.municipio, p.preco);
  }
  const linhas = [];
  for (const g of grupos.values()) {
    if (g.precos.length < MIN_POSTOS[g.escopo]) continue;
    // O nome como a DGEG o escreve mais vezes ("GALP" ou "Galp").
    const nome = [...g.nomes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || g.chave;
    linhas.push({
      dia, tipo: g.tipo, escopo: g.escopo, chave: g.chave, nome,
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
 * Variação semanal (país e marcas). Compara o dia mais recente com o resumo
 * mais próximo de 7 dias antes (aceita 5 a 9, para sobreviver a um dia sem
 * cron). Sem esse par, diz só desde quando há dados.
 */
export function variacaoSemanal(linhas) {
  const uteis = (linhas || []).filter(l => l.escopo === "pais" || l.escopo === "marca");
  if (!uteis.length) return null;
  const dias = [...new Set(uteis.map(l => l.dia))].sort();
  const hoje = dias[dias.length - 1];
  const candidatos = dias.filter(d => { const n = diasEntre(hoje, d); return n >= 5 && n <= 9; });
  if (!candidatos.length) return { hoje, antes: null, primeiroDia: dias[0], porTipo: null };
  const antes = candidatos.reduce((a, b) => (Math.abs(diasEntre(hoje, b) - 7) < Math.abs(diasEntre(hoje, a) - 7) ? b : a));

  const doDia = (d) => new Map(uteis.filter(l => l.dia === d).map(l => [`${l.tipo}|${l.escopo}|${l.chave}`, l]));
  const A = doDia(hoje), B = doDia(antes);
  const porTipo = {};
  for (const tipo of TIPOS_SEMANA) {
    const linha = (l) => {
      const ant = B.get(`${tipo}|${l.escopo}|${l.chave}`);
      return { marca: l.nome, media: l.media, minimo: l.minimo, n: l.n, diffCent: ant ? Math.round((l.media - ant.media) * 1000) / 10 : null };
    };
    const atuais = [...A.values()].filter(l => l.tipo === tipo);
    const pais = atuais.find(l => l.escopo === "pais");
    if (!pais) continue;
    porTipo[tipo] = {
      pais: linha(pais),
      marcas: atuais.filter(l => l.escopo === "marca").map(linha)
        .filter(m => m.diffCent != null)
        .sort((a, b) => a.diffCent - b.diffCent || a.media - b.media),
    };
  }
  return { hoje, antes, primeiroDia: dias[0], porTipo };
}

/* Série para o gráfico: [{ dia, media, minimo }] por ordem de dia. */
export function serie(linhas, { escopo, chave, tipo }) {
  return (linhas || [])
    .filter(l => l.escopo === escopo && l.chave === chave && l.tipo === tipo)
    .sort((a, b) => (a.dia < b.dia ? -1 : 1))
    .map(l => ({ dia: l.dia, media: l.media, minimo: l.minimo }));
}
