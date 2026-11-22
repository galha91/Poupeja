/*
 * Pôr os ingredientes de uma receita na Lista de Compras do dispositivo
 * (a mesma chave do localStorage que a app usa). Serve a app (Receitas)
 * e as páginas públicas /receitas/[id]: o site e a app são a mesma origem,
 * por isso o que entra aqui aparece na lista quando a app abre.
 */
const LS_LISTA = "poupeja_lista_compras";

/*
 * Junta artigos à Lista de Compras com o nome do catálogo (assim a
 * comparação de preços reconhece-os). Os que já lá estão por comprar não
 * se duplicam. Devolve quantos entraram.
 */
export async function adicionarALista(artigos) {
  const [{ adicionar }, { doCatalogo }] = await Promise.all([import("../listaCompras.js"), import("../catalogoLista.js")]);
  let lista = [];
  try { lista = JSON.parse(localStorage.getItem(LS_LISTA) || "[]"); } catch {}
  const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  let novos = 0;
  for (const a of artigos) {
    const nome = a.compra || a.nome;
    const final = doCatalogo(nome)?.nome || nome;
    if (lista.some((i) => !i.feito && norm(i.nome) === norm(final))) continue;
    lista = adicionar(lista, nome, { doCatalogo });
    novos++;
  }
  try { localStorage.setItem(LS_LISTA, JSON.stringify(lista)); } catch {}
  return novos;
}

