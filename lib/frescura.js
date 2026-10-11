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
    ? (mesmoDia ? `Preços de hoje · ${dataStr}` : `Preços de ${dataStr}`)
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
