// Calcula o cabaz de um tema a partir das linhas de precos_supermercado_historico.
// Uso: node scripts/cabaz/calcular.mjs <tema> <linhas.json> <saida.json> [usadosRecentes.json]
//   linhas.json: [{ q, loja, valor, dia }]   (o dia mais recente de cada q)
//   usadosRecentes.json (opcional): { "<q>": "<dia da última vez>" }
import fs from "node:fs";

export const N_ARTIGOS = 10;
// Se o preço mais alto for mais de 3x o mais baixo, a pesquisa apanhou produtos
// diferentes (ex.: fruta embalada) e o artigo não é comparável: sai do cabaz.
export const RAZAO_MAXIMA = 3;
// Entre 2x e 3x o artigo é comparável mas suspeito (muitas vezes a pesquisa de
// uma loja apanhou outro produto): só entra se faltarem artigos mais seguros.
export const RAZAO_SUSPEITA = 2;

export function escolherArtigos(artigos, linhas, lojas, usados = {}) {
  const porQ = {};
  for (const l of linhas) (porQ[l.q] ||= {})[l.loja] = Number(l.valor);
  const razao = (a) => {
    const v = lojas.map((l) => porQ[a.q]?.[l]);
    if (v.some((x) => !(x > 0))) return Infinity;
    return Math.max(...v) / Math.min(...v);
  };
  const comparaveis = artigos.filter((a) => razao(a) <= RAZAO_MAXIMA);
  // 1.º os de preço consistente (razão <= 2x); depois os suspeitos, do menos
  // para o mais disperso. Dentro de cada grupo, os que há mais tempo não saíram
  // (sem registo = nunca saíram).
  const suspeito = (a) => razao(a) > RAZAO_SUSPEITA;
  const ordenados = [...comparaveis].sort((a, b) =>
    (suspeito(a) - suspeito(b)) ||
    (suspeito(a) ? razao(a) - razao(b) : 0) ||
    String(usados[a.q] || "").localeCompare(String(usados[b.q] || "")));
  return { escolhidos: ordenados.slice(0, N_ARTIGOS), porQ, suspeitos: ordenados.slice(0, N_ARTIGOS).filter(suspeito).map((a) => a.q) };
}

export function calcularCabaz({ tema, config, linhas, usados = {} }) {
  const t = config.temas[tema];
  if (!t) throw new Error(`Tema desconhecido: ${tema}`);
  const { escolhidos, porQ, suspeitos } = escolherArtigos(t.artigos, linhas, config.lojas, usados);
  if (escolhidos.length < N_ARTIGOS) throw new Error(`Só ${escolhidos.length} artigos comparáveis no tema ${tema}; precisa de ${N_ARTIGOS}.`);
  const arredondar = (n) => Math.round(n * 100) / 100;
  const itens = escolhidos.map((a) => ({
    q: a.q, nome: a.nome, rotulo: a.rotulo,
    custos: Object.fromEntries(config.lojas.map((l) => [l, arredondar(porQ[a.q][l] * a.qtd)])),
  }));
  const totais = Object.fromEntries(config.lojas.map((l) => [l, arredondar(itens.reduce((s, i) => s + i.custos[l], 0))]));
  const ordem = [...config.lojas].sort((a, b) => totais[a] - totais[b]);
  const maisBarata = ordem[0], maisCara = ordem[ordem.length - 1];
  const poupanca = arredondar(totais[maisCara] - totais[maisBarata]);
  // O vencedor é fiável se não muda ao tirar qualquer artigo e se ganha por >=3%.
  const vencedorSem = (i) => [...config.lojas].sort((a, b) => (totais[a] - i.custos[a]) - (totais[b] - i.custos[b]))[0];
  const robusto = itens.every((i) => vencedorSem(i) === maisBarata);
  const empate = (totais[ordem[1]] - totais[maisBarata]) / totais[maisBarata] < 0.03;
  const mediaOutras = ordem.slice(0, -1).reduce((s, l) => s + totais[l], 0) / (ordem.length - 1);
  return {
    tema, titulo: t.titulo, dia: linhas.map((l) => String(l.dia).slice(0, 10)).sort().pop() || null,
    lojas: config.lojas, nomesLojas: config.nomesLojas, generoLojas: config.generoLojas || {}, itens, totais, ordem, maisBarata, maisCara,
    poupanca, poupancaPct: Math.round((poupanca / totais[maisCara]) * 100),
    robusto, empate: empate || !robusto, suspeitos,
    // Quanto a mais custa a loja mais cara face à média das outras (para o "quase empate").
    extraMaisCaraPct: Math.round((totais[maisCara] / mediaOutras - 1) * 100),
  };
}

const eur = (n) => n.toFixed(2).replace(".", ",") + " €";

export function legenda(c) {
  const n = c.nomesLojas;
  const g = (l) => (c.generoLojas?.[l] === "a" ? "a" : "o");
  const no = (l) => `${g(l) === "a" ? "na" : "no"} ${n[l]}`;
  const linhas = c.ordem.map((l, i) => `${["🥇", "🥈", "🥉", "4º"][i]} ${n[l]}: ${eur(c.totais[l])}`);
  const resumo = c.empate
    ? [`🛒 Cabaz "${c.titulo}": 10 artigos. As lojas do topo quase empatam, mas ${g(c.maisCara)} ${n[c.maisCara]} custa ${c.extraMaisCaraPct}% mais que a média das outras.`,
       `Do mais barato ao mais caro: ${eur(c.totais[c.maisBarata])} contra ${eur(c.totais[c.maisCara])} (${eur(c.poupanca)} de diferença).`]
    : [`🛒 Cabaz "${c.titulo}": 10 artigos, ${eur(c.totais[c.maisBarata])} ${no(c.maisBarata)} e ${eur(c.totais[c.maisCara])} ${no(c.maisCara)}.`,
       `Mesmo cabaz, ${eur(c.poupanca)} de diferença (${c.poupancaPct}%).`];
  return [
    ...resumo,
    "", ...linhas, "",
    `Artigos: ${c.itens.map((i) => `${i.nome.toLowerCase()} (${i.rotulo})`).join(", ")}.`,
    "Preço mais baixo de cada artigo em cada loja, comparado ao quilo/litro/unidade. Preços de " + String(c.dia).split("-").reverse().join("/") + ", podem mudar.",
    "", "Compara a tua lista grátis em PoupeJá.com (link na bio)",
    "", "#poupar #supermercado #cabaz #poupanca #continente #pingodoce #auchan #dicasdepoupanca #portugal",
  ].join("\n");
}

if (process.argv[1]?.endsWith("calcular.mjs")) {
  const [tema, ficheiroLinhas, saida, ficheiroUsados] = process.argv.slice(2);
  const config = JSON.parse(fs.readFileSync(new URL("../../data/cabazes-social.json", import.meta.url)));
  const linhas = JSON.parse(fs.readFileSync(ficheiroLinhas));
  const usados = ficheiroUsados ? JSON.parse(fs.readFileSync(ficheiroUsados)) : {};
  const cabaz = calcularCabaz({ tema, config, linhas, usados });
  fs.writeFileSync(saida, JSON.stringify(cabaz, null, 2));
  fs.writeFileSync(saida.replace(/\.json$/, "-legenda.txt"), legenda(cabaz));
  console.log(legenda(cabaz));
}
