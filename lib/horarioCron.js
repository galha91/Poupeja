// Horário de um cron (expressão do vercel.json) em texto, para o /admin.
const DIAS_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
export function descreverHorario(expr) {
  const [min, hora, , , dow] = String(expr).split(" ");
  const hh = `${String(hora).padStart(2, "0")}:${String(min).padStart(2, "0")} UTC`;
  if (dow && dow !== "*") return { texto: `à ${DIAS_SEMANA[Number(dow) % 7]}, ${hh}`, intervaloH: 24 * 7 };
  return { texto: `todos os dias, ${hh}`, intervaloH: 24 };
}

