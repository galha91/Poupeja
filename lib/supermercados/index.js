import { continente, pingoDoce, auchan } from "./sfcc";
import { lidl } from "./lidl";
import { aldi } from "./aldi";
import { apolonia } from "./apolonia";
import { comTaloes } from "./taloes";
import { completarUnidade, lerQuantidade, corrigirPrecoPorCem } from "./comum";
import { palavras, classificar, separarProcessados, modoComparacao, eVariante } from "./relevancia.js";

// A relevância vive à parte (sem as lojas), para se poder testar com nomes reais.
export { raiz, palavras, relevancia, classificar, separarProcessados, modoComparacao, eVariante } from "./relevancia.js";

/*
 * Pesquisa o mesmo artigo em todos os supermercados ao mesmo tempo e
 * devolve uma lista só, comparável pelo preço por kg / L / unidade.
 *
 * Porque em direto e não uma base de dados copiada todas as noites: os
 * preços online mudam várias vezes por semana e cada cadeia tem dezenas de
 * milhares de artigos. Pesquisar só o que alguém procura, com cache de
 * umas horas (na rota), dá preços do dia sem andar a copiar sites inteiros.
 */

// O Lidl junta o folheto (site) aos preços do sortido fixo vistos nos talões.
export const LOJAS = [continente, pingoDoce, auchan, comTaloes(lidl), aldi, apolonia];

/*
 * Marca própria (a "marca branca") de cada cadeia — para o filtro
 * "Marca própria / Outras marcas". No Continente, Pingo Doce e Auchan
 * vê-se pela marca; no Lidl e no Aldi quase tudo é marca própria com
 * nomes de fantasia, por isso ali conta-se ao contrário: é própria salvo
 * se for uma marca nacional conhecida.
 */
const PROPRIA = {
  continente: /continente|^é$/i,
  "pingo-doce": /pingo doce|nossa fruta|nossos frescos|^selecionad/i,
  auchan: /auchan|polegar|cultivamos o bom|cosmia|colhogar|à mesa em|ruff\b/i,
};
const MARCAS_NACIONAIS = /compal|sumol|nestl|mimosa|agros|gresso|matinal|delta|nicola|sical|buondi|oliveira da serra|gallo|milaneza|nacional|cigala|bom petisco|tri[tt]ão|ramirez|terra nostra|limiano|danone|oikos|fula|vaqueiro|becel|compal|renova|scottex|dodot|pampers|colgate|nivea|skip|omo|fairy|super bock|sagres|coca|pepsi|luso|vitalis|continente|purina|pedigree|whiskas|evax|catisfactions|nescaf|milka|kinder|lindt|oreo|cuétara|cuetara|triunfo|dan cake|bimbo|panrico|knorr|calvé|heinz|hellmann|compal|frize|pedras|licor beirão/i;

export function eMarcaPropria(loja, marca, nome = "") {
  const m = String(marca || "").trim();
  if (PROPRIA[loja]) return PROPRIA[loja].test(m) || PROPRIA[loja].test(nome.split(" ").slice(-1)[0] || "");
  if (loja === "lidl" || loja === "aldi") return !m ? true : !MARCAS_NACIONAIS.test(m);
  return false;
}


// Nome da unidade quando é "un": o que é uma unidade daquilo que se procurou.
const NOME_UNIDADE = {
  ovo: "ovo", papel: "rolo", rolo: "rolo", fralda: "fralda", capsula: "cápsula", pilha: "pilha",
  cha: "saqueta", toalhita: "toalhita", guardanapo: "guardanapo", pastilha: "pastilha", saco: "saco",
};
export function nomeUnidade(unidade, termos) {
  if (unidade === "dose") return "lavagem";
  if (unidade !== "un") return unidade === "l" ? "L" : unidade;
  return termos.map((t) => NOME_UNIDADE[t]).find(Boolean) || "un";
}

const PAUSA_MS = 3 * 60 * 1000;
const pausa = new Map();

export async function pesquisarTudo(q, lojas = LOJAS) {
  const termos = palavras(q);
  const modo = modoComparacao(termos);
  const inicio = Date.now();

  const respostas = await Promise.allSettled(
    lojas.map(async (loja) => {
      // Uma loja que acabou de recusar pedidos (403/429) fica uns minutos
      // de fora: insistir só prolongava o bloqueio, e as outras respondem.
      if (Date.now() < (pausa.get(loja.id) || 0)) throw new Error("em pausa depois de recusar pedidos");
      const t0 = Date.now();
      try {
        const itens = await loja.pesquisar(q);
        return { loja, itens, ms: Date.now() - t0 };
      } catch (e) {
        if (/HTTP (403|429)/.test(e?.message || "")) pausa.set(loja.id, Date.now() + PAUSA_MS);
        throw e;
      }
    }),
  );

  const estado = [];
  const produtos = [];
  respostas.forEach((r, i) => {
    const loja = lojas[i];
    if (r.status === "rejected") {
      estado.push({ id: loja.id, nome: loja.nome, ok: false, erro: String(r.reason?.message || r.reason).slice(0, 120) });
      return;
    }
    let n = 0;
    for (const bruto of r.value.itens) {
      if (!bruto?.nome || !(bruto.preco > 0)) continue;
      const rel = classificar(bruto, termos, loja.id, modo, q);
      if (!rel) continue;
      const p = completarUnidade(bruto);
      // Quantidade da embalagem na unidade de comparação (2 kg, 12 ovos…):
      // serve para somar uma lista de compras em quantidades iguais.
      const qtd = p.aoPeso ? null : lerQuantidade(p.quantidade) || lerQuantidade(p.nome);
      produtos.push({
        loja: loja.id, lojaNome: loja.nome, onde: "online", ...p,
        precoUnidade: qtd && qtd.unidade === p.unidade ? corrigirPrecoPorCem(p.preco, p.precoUnidade, qtd) : p.precoUnidade,
        nomeUnidade: nomeUnidade(p.unidade, termos),
        marcaPropria: eMarcaPropria(loja.id, p.marca, p.nome),
        qtdBase: qtd && qtd.unidade === p.unidade ? Math.round(qtd.qtd * 1000) / 1000 : null,
        relevancia: rel,
        ...(rel === 2 && eVariante(p.nome, q) ? { variante: true } : {}),
      });
      n++;
    }
    estado.push({ id: loja.id, nome: loja.nome, ok: true, total: n, ms: r.value.ms });
  });

  separarProcessados(produtos, q);

  const ordenados = ordenar(produtos, modo);
  const principal = ordenados.find((p) => p.relevancia === 2)?.unidade || ordenados[0]?.unidade || null;
  return {
    q, termos, modo,
    // Como mostrar a unidade de comparação ("kg", "L", "ovo", "rolo", "lavagem").
    nomeUnidade: principal ? nomeUnidade(principal, termos) : null,
    produtos: ordenados, lojas: estado, ms: Date.now() - inicio,
  };
}

/*
 * Ordem: primeiro o que é mesmo o artigo procurado; dentro disso, a
 * unidade mais comum (não se compara €/kg com €/un) e o preço por
 * unidade. O resto vem depois, pela mesma lógica.
 */
export function ordenar(produtos, modo = "unidade") {
  const contagem = {};
  for (const p of produtos) if (p.relevancia === 2) contagem[p.unidade] = (contagem[p.unidade] || 0) + 1;
  const principal = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0]?.[0];
  const peso = (p) => (p.relevancia === 2 ? 0 : 2) + (modo === "embalagem" || p.unidade === principal ? 0 : 1);
  const valor = (p) => (modo === "embalagem" ? p.preco : p.precoUnidade);
  return [...produtos].sort((a, b) => peso(a) - peso(b) || valor(a) - valor(b) || a.preco - b.preco);
}
