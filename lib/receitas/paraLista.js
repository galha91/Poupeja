import { INGREDIENTES } from "./ingredientes.js";
import { PASSOS_KG, eFrescoAoKg } from "../quantidadeFresca.js";

/*
 * Pôr os ingredientes de uma receita na Lista de Compras do dispositivo
 * (a mesma chave do localStorage que a app usa). Serve a app (Receitas)
 * e as páginas públicas /receitas/[id]: o site e a app são a mesma origem,
 * por isso o que entra aqui aparece na lista quando a app abre.
 */
const LS_LISTA = "poupeja_lista_compras";
const MAX_QTY = 999;

/* Gramas (ou ml) de um ingrediente da receita, ou null se não der para saber (q.b., colheres sem peso). */
function quantidadeBase(ing) {
  const q = Number(ing?.q);
  if (!(q > 0)) return null;
  if (ing.u === "g" || ing.u === "ml") return q;
  const g = INGREDIENTES[ing.key]?.g;
  return g > 0 ? q * g : null;
}

/*
 * Quanto levar, na unidade em que a lista conta o artigo do catálogo.
 * Antes entrava tudo com 1: 600 g de bacalhau ou 9 ovos ficavam "1", e a
 * comparação de preços fazia as contas a essa quantidade. Arredonda-se
 * sempre para cima (não se compra meia dúzia de 9 ovos).
 *   cat.un "kg"    fruta e legumes: o peso, no passo seguinte do − / +;
 *                  o resto: kg inteiros (embalagens de 1 kg)
 *   cat.un "L"     litros inteiros
 *   cat.un "dúzia" dúzias, a partir das unidades
 *   un., lata, molho, emb.: o número que a receita pede, se for a mesma unidade
 * Devolve { qty } ou { kg }; sem conversão possível, { qty: 1 }.
 */
export function quantidadeNaLista(ing, cat) {
  const um = { qty: 1 };
  if (!cat || !ing) return um;
  const teto = (v) => Math.min(MAX_QTY, Math.max(1, Math.ceil(v - 1e-9)));
  const base = quantidadeBase(ing);
  if (cat.un === "kg") {
    if (base == null) return um;
    const kg = base / 1000;
    if (eFrescoAoKg(cat)) return { kg: PASSOS_KG.find((p) => p >= kg - 1e-9) ?? Math.ceil(kg) };
    return { qty: teto(kg) };
  }
  if (cat.un === "L") return base == null ? um : { qty: teto(base / 1000) };
  if (cat.un === "dúzia") return ing.u === "un" ? { qty: teto(ing.q / 12) } : um;
  const mesma = { "un.": "un", lata: "lata", molho: "molho", "emb.": "emb." }[cat.un];
  if (mesma && ing.u === mesma) return { qty: teto(ing.q) };
  return um;
}

/*
 * Junta artigos à Lista de Compras com o nome do catálogo (assim a
 * comparação de preços reconhece-os), já com a quantidade da receita. Os
 * que já lá estão por comprar não se duplicam. Devolve quantos entraram.
 */
export async function adicionarALista(artigos) {
  const [{ adicionar }, { doCatalogo }] = await Promise.all([import("../listaCompras.js"), import("../catalogoLista.js")]);
  let lista = [];
  try { lista = JSON.parse(localStorage.getItem(LS_LISTA) || "[]"); } catch {}
  const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  let novos = 0;
  for (const a of artigos) {
    const nome = a.compra || a.nome;
    const cat = doCatalogo(nome);
    const final = cat?.nome || nome;
    if (lista.some((i) => !i.feito && norm(i.nome) === norm(final))) continue;
    lista = adicionar(lista, nome, { doCatalogo });
    // adicionar() põe o novo artigo à cabeça, com 1; aqui fica a quantidade da receita.
    const qtd = quantidadeNaLista(a, cat);
    lista = [{ ...lista[0], ...(qtd.kg ? { kg: qtd.kg } : { qty: qtd.qty }) }, ...lista.slice(1)];
    novos++;
  }
  try { localStorage.setItem(LS_LISTA, JSON.stringify(lista)); } catch {}
  return novos;
}
