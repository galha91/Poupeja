/*
 * Semana corrente (segunda–domingo), usada para mostrar sempre a validade
 * certa dos folhetos — em vez de datas fixas gravadas em folhetos.json que
 * ficam desatualizadas assim que a semana muda.
 */
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function semanaAtual(data = new Date()) {
  const diaSemana = data.getDay();
  const seg = new Date(data);
  seg.setDate(data.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
  const dom = new Date(seg);
  dom.setDate(seg.getDate() + 6);
  const fmt = d => `${d.getDate()} ${MESES[d.getMonth()]}`;
  return {
    validade: `${fmt(seg)}–${fmt(dom)}`,
    atualizadoEm: data.toISOString().split("T")[0],
  };
}
