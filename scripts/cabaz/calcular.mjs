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
    tema, titulo: t.titulo, social: t.social || null, hashtagsLojas: config.hashtagsLojas || {}, dia: linhas.map((l) => String(l.dia).slice(0, 10)).sort().pop() || null,
    lojas: config.lojas, nomesLojas: config.nomesLojas, generoLojas: config.generoLojas || {}, itens, totais, ordem, maisBarata, maisCara,
    poupanca, poupancaPct: Math.round((poupanca / totais[maisCara]) * 100),
    robusto, empate: empate || !robusto, suspeitos,
    // Quanto a mais custa a loja mais cara face à média das outras (para o "quase empate").
    extraMaisCaraPct: Math.round((totais[maisCara] / mediaOutras - 1) * 100),
  };
}

const eur = (n) => n.toFixed(2).replace(".", ",") + "\u00a0€";

/*
 * Legenda do Instagram/TikTok. Regra (docs/cabaz-social.md, "Legenda"):
 *  1. gancho de curiosidade, até 125 caracteres e no máximo 1 emoji;
 *  2. o tema, com 2-3 palavras-chave ditas com naturalidade;
 *  3. 1-2 frases com os números desta execução, a data e "os preços podem variar";
 *  4. um só apelo (guardar ou enviar) e "Compara grátis: link na bio.";
 *  5. exatamente 5 hashtags específicas.
 * Sempre na 1.ª pessoa, em PT-PT simples.
 */
export const MAX_GANCHO = 125;

export function hashtagsCabaz(c) {
  const tags = ["#precosdosupermercado", "#compararprecos", "#cabazdasemana",
    c.social?.hashtag || "#cabaz", c.hashtagsLojas?.[c.maisBarata] || "#supermercados"];
  return [...new Set(tags)];
}

export function legenda(c) {
  const n = c.nomesLojas;
  const g = (l) => (c.generoLojas?.[l] === "a" ? "a" : "o");
  const no = (l) => `${g(l) === "a" ? "na" : "no"} ${n[l]}`;
  const artigo = (l) => `${g(l) === "a" ? "A" : "O"} ${n[l]}`;
  const contexto = c.social?.contexto || `do cabaz "${c.titulo.toLowerCase()}"`;
  const nLojas = c.ordem.length;
  const lojasTexto = c.lojas.map((l) => n[l]).join(", ").replace(/, ([^,]*)$/, " e $1");
  const data = String(c.dia).split("-").reverse().join("/");
  const segunda = c.ordem[1];

  const gancho = c.empate
    ? `Pus o mesmo cabaz em ${nLojas} supermercados e dois quase empataram. Adivinhas qual ficou mais caro? 👀`
    : `Pus o mesmo cabaz em ${nLojas} supermercados e a diferença foi de ${eur(c.poupanca)}. Adivinhas onde ficou mais barato? 👀`;
  const tema = `Comparei os preços do supermercado de 10 artigos ${contexto} em ${nLojas} supermercados (${lojasTexto}), para ver onde o cabaz fica mais barato.`;
  const numeros = c.empate
    ? `${artigo(c.maisBarata)} (${eur(c.totais[c.maisBarata])}) e ${g(segunda)} ${n[segunda]} (${eur(c.totais[segunda])}) quase empatam, mas ${g(c.maisCara)} ${n[c.maisCara]} fica ${c.extraMaisCaraPct}% acima da média das outras (${eur(c.totais[c.maisCara])}).`
    : `O cabaz mais barato ficou ${no(c.maisBarata)}, com ${eur(c.totais[c.maisBarata])}, e o mais caro ${no(c.maisCara)}, com ${eur(c.totais[c.maisCara])}.`;
  const fonte = `Preços online de ${data}; os preços podem variar.`;
  const apelo = c.social?.apelo || "Guarda para a próxima vez que fores às compras.";

  return [gancho, "", tema, "", `${numeros} ${fonte}`, "", `${apelo} Compara grátis: link na bio.`, "", hashtagsCabaz(c).join(" ")].join("\n");
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
