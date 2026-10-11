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

export function descreverFrescura(frescura, agora = new Date()) {
  const { obtidoEm, dataPreco, stale } = frescura || {};
  /*
   * A referência é o momento em que fomos buscar os preços à DGEG, e não
   * a data do posto mais recentemente atualizado: esse é quase sempre
   * "hoje" (há sempre algum posto a mexer no preço), por isso uma lista
   * com um dia de atraso ia continuar a dizer "preços de hoje".
   */
  const ref = obtidoEm ?? dataPreco ?? null;
  if (!ref) {
    return { rotulo: "Sem preços disponíveis", deHoje: false, aviso: null, iso: null };
  }

  const d = new Date(ref);
  const hoje = agora;
  const mesmoDia =
    d.getFullYear() === hoje.getFullYear() &&
    d.getMonth() === hoje.getMonth() &&
    d.getDate() === hoje.getDate();

  const dataStr = d.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });
  const horaStr = d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Lisbon" });

  const rotulo = mesmoDia
    ? `Preços DGEG · consultados hoje às ${horaStr}`
    : `Preços DGEG · consultados a ${dataStr}`;

  let aviso = null;
  if (!mesmoDia) {
    // "Ontem às 23h" e "há três dias" não são a mesma coisa, e arredondar
    // duas horas para "1 dia" é exagerar a idade do dado. Conta-se em
    // horas até ao primeiro dia inteiro.
    const decorrido = hoje - d;
    const idadeStr = decorrido < DIA
      ? `há ${Math.max(1, Math.round(decorrido / 3600e3))} hora${Math.round(decorrido / 3600e3) === 1 ? "" : "s"}`
      : `há ${Math.round(decorrido / DIA)} dia${Math.round(decorrido / DIA) === 1 ? "" : "s"}`;
    aviso = `Estes preços foram consultados à DGEG a ${dataStr} — ${idadeStr}. ` +
            `Ainda não conseguimos uma consulta mais recente.`;
  } else if (stale) {
    aviso = `A DGEG não respondeu à última tentativa. Estes preços são os da consulta anterior, de hoje às ${horaStr}.`;
  }

  return { rotulo, deHoje: mesmoDia && !stale, aviso, iso: d.toISOString() };
}
