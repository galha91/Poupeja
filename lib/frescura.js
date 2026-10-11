/*
 * Como se conta ao utilizador a idade de um preço.
 *
 * Regra da casa: só se afirma o que se sabe. Sabemos ao certo quando
 * fomos buscar os dados (obtidoEm). A data a que os preços se referem só
 * a sabemos se a DGEG a mandar (dataPreco) — e nesse caso é essa que
 * manda, porque é a que interessa a quem vai atestar.
 *
 * Nada disto inventa datas: se não houver nenhuma, diz-se que não há.
 */

const DIA = 24 * 60 * 60 * 1000;

/*
 * Idade do preço de UM posto. Cada posto comunica o seu preço quando o
 * altera, por isso um preço de há cinco dias pode estar ao lado de um de
 * hoje na mesma lista — e quem vai atestar tem de ver a diferença.
 * Conta dias de calendário em Lisboa, não blocos de 24 horas.
 */
const DIAS_PRECO_VELHO = 3;
const diaLisboa = ms => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Lisbon" }).format(new Date(ms));

export function idadeDoPreco(dataPreco, agora = Date.now()) {
  if (!Number.isFinite(dataPreco) || dataPreco <= 0) return null;
  const dias = Math.max(0, Math.round((Date.parse(diaLisboa(agora)) - Date.parse(diaLisboa(dataPreco))) / DIA));
  const [, mes, dia] = diaLisboa(dataPreco).split("-");
  const dataCurta = `${Number(dia)}/${Number(mes)}`;
  const texto = dias === 0 ? "preço de hoje"
    : dias === 1 ? "preço de ontem"
    : `preço de ${dataCurta}`;
  return { dias, texto, velho: dias >= DIAS_PRECO_VELHO };
}

export function descreverFrescura(frescura) {
  const { obtidoEm, dataPreco, stale } = frescura || {};
  const ref = dataPreco ?? obtidoEm ?? null;
  if (!ref) {
    return { rotulo: "Sem preços disponíveis", deHoje: false, aviso: null, iso: null };
  }

  const d = new Date(ref);
  const hoje = new Date();
  const mesmoDia =
    d.getFullYear() === hoje.getFullYear() &&
    d.getMonth() === hoje.getMonth() &&
    d.getDate() === hoje.getDate();

  const dataStr = d.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });
  const horaStr = d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

  // Quando temos a data do preço, é dela que falamos; quando só temos a
  // hora da consulta, dizemos que foi uma consulta — não a mesma coisa.
  const rotulo = dataPreco
    ? `Dados DGEG · atualizados até ${dataStr}`
    : (mesmoDia ? `Consultado hoje às ${horaStr}` : `Consultado a ${dataStr}`);

  let aviso = null;
  if (!mesmoDia) {
    // "Ontem às 23h" e "há três dias" não são a mesma coisa, e arredondar
    // duas horas para "1 dia" é exagerar a idade do dado. Conta-se em
    // horas até ao primeiro dia inteiro.
    const decorrido = hoje - d;
    const idadeStr = decorrido < DIA
      ? `há ${Math.max(1, Math.round(decorrido / 3600e3))} hora${Math.round(decorrido / 3600e3) === 1 ? "" : "s"}`
      : `há ${Math.round(decorrido / DIA)} dia${Math.round(decorrido / DIA) === 1 ? "" : "s"}`;
    aviso = `Estes preços são de ${dataStr} — ${idadeStr}. ` +
            `A DGEG não devolveu dados mais recentes desde então.`;
  } else if (stale) {
    aviso = `A DGEG não respondeu à última tentativa. Estes preços são os da consulta anterior, de hoje às ${horaStr}.`;
  }

  return { rotulo, deHoje: mesmoDia && !stale, aviso, iso: d.toISOString() };
}
