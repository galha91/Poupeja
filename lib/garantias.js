import { somarMeses, diasEntre, paraData, hojeIso } from "./datas.js";

/*
 * Garantias — cálculo do fim, estado e migração dos registos antigos.
 *
 * Regra legal (Decreto-Lei n.º 84/2021, em vigor desde 1/1/2022), tal como
 * a Direção-Geral do Consumidor a explica no Portal do Consumidor
 * (consumidor.gov.pt, "Perguntas Frequentes" e "Guia das Garantias"):
 *   - bens móveis novos: 3 anos;
 *   - bens móveis usados: 3 anos, que podem ser reduzidos a 18 meses
 *     por acordo entre comprador e vendedor;
 *   - recondicionados contam como novos (3 anos).
 * Verificado a 3/10/2026. Garantias comerciais (do fabricante ou da loja)
 * podem ser mais longas — a duração é sempre editável.
 */
export const MESES_GARANTIA_LEGAL = 36;
export const MESES_USADO_MINIMO = 18;
export const DIAS_A_EXPIRAR = 60;

export const FONTE_GARANTIA = {
  verificado: "2026-10-03",
  href: "https://www.consumidor.gov.pt/consumidor_4/perguntas-frequentes1",
  guia: "https://www.consumidor.gov.pt/upload/processos/i005521.pdf",
};

export const LINKS_RECLAMACAO = {
  livro: "https://www.livroreclamacoes.pt/inicio",
  portal: "https://www.consumidor.gov.pt/",
};

/** Duração sugerida. `usadoComAcordo`: a fatura diz que a garantia foi reduzida. */
export function mesesPorOmissao(estado = "novo", usadoComAcordo = false) {
  return estado === "usado" && usadoComAcordo ? MESES_USADO_MINIMO : MESES_GARANTIA_LEGAL;
}

export function fimGarantia(dataCompra, meses = MESES_GARANTIA_LEGAL) {
  const m = Number(meses);
  if (!paraData(dataCompra) || !Number.isFinite(m) || m <= 0) return null;
  return somarMeses(dataCompra, Math.round(m));
}

/** "valida" | "a_expirar" (≤ 60 dias) | "expirada" */
export function estadoGarantia(fim, hoje = hojeIso()) {
  const dias = diasEntre(hoje, fim);
  if (dias == null) return { estado: "valida", dias: null };
  if (dias < 0) return { estado: "expirada", dias };
  if (dias <= DIAS_A_EXPIRAR) return { estado: "a_expirar", dias };
  return { estado: "valida", dias };
}

export const ROTULO_ESTADO = { valida: "Válida", a_expirar: "A expirar", expirada: "Expirada" };

/** Quem expira primeiro aparece primeiro; as expiradas vão para o fim (a mais recente à frente). */
export function ordenarGarantias(lista, hoje = hojeIso()) {
  return [...lista].sort((a, b) => {
    const da = diasEntre(hoje, a.fim), db = diasEntre(hoje, b.fim);
    const ea = da == null ? Infinity : da, eb = db == null ? Infinity : db;
    const xa = ea < 0, xb = eb < 0;
    if (xa !== xb) return xa ? 1 : -1;
    return xa ? eb - ea : ea - eb;
  });
}

/** Valida e normaliza o que vem do formulário. Devolve { ok, erro?, garantia? }. */
export function normalizarGarantia(dados, hoje = hojeIso()) {
  const produto = String(dados.produto || "").trim().slice(0, 80);
  if (!produto) return { ok: false, erro: "Escreve o nome do produto." };
  if (!paraData(dados.dataCompra)) return { ok: false, erro: "Indica a data de compra." };
  if (diasEntre(hoje, dados.dataCompra) > 0) return { ok: false, erro: "A data de compra não pode ser no futuro." };
  const meses = Math.round(Number(dados.meses));
  if (!Number.isFinite(meses) || meses < 1 || meses > 240) return { ok: false, erro: "Duração da garantia inválida (1 a 240 meses)." };
  let preco = null;
  if (dados.preco !== "" && dados.preco != null) {
    preco = Number(String(dados.preco).replace(",", "."));
    if (!Number.isFinite(preco) || preco < 0) return { ok: false, erro: "Preço inválido." };
    preco = Math.round(preco * 100) / 100;
  }
  return {
    ok: true,
    garantia: {
      produto,
      loja: String(dados.loja || "").trim().slice(0, 60),
      dataCompra: dados.dataCompra,
      preco,
      estado: dados.estado === "usado" ? "usado" : "novo",
      meses,
      fim: fimGarantia(dados.dataCompra, meses),
    },
  };
}

/**
 * Garantias antigas (separador "Garantias" dos talões, poupeja_taloes com
 * tipo "garantia") no formato novo. A foto vem à parte para ir para o
 * IndexedDB. Não mexe em nada — só traduz.
 */
export function converterGarantiaAntiga(t) {
  if (!t || t.tipo !== "garantia") return null;
  const dataCompra = paraData(t.dataCompra) ? t.dataCompra
    : (t.criadoEm ? String(t.criadoEm).slice(0, 10) : null);
  if (!paraData(dataCompra)) return null;
  let meses = Number(t.duracao);
  let fim = paraData(t.dataExpiracao) ? t.dataExpiracao : null;
  if (!Number.isFinite(meses) || meses <= 0) meses = MESES_GARANTIA_LEGAL;
  if (!fim) fim = fimGarantia(dataCompra, meses);
  return {
    garantia: {
      id: `t${t.id}`,
      produto: String(t.nome || "Produto").slice(0, 80),
      loja: "",
      dataCompra,
      preco: null,
      estado: "novo",
      meses,
      fim,
      temFoto: !!t.imagem,
      criadoEm: t.criadoEm || null,
    },
    foto: t.imagem || null,
  };
}
