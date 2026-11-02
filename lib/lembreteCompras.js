import { emailValido, normalizarEmail } from "./subscritores.js";

/*
 * Lembrete semanal do dia das compras, por email, sem conta. A pessoa
 * escolhe o dia; nessa manhã recebe a lista que tem no PoupeJá e um botão
 * para ver onde fica mais barata. O pedido nasce no fim da comparação da
 * lista (LembreteCompras.jsx). Funções puras, testadas em
 * tests/lembreteCompras.test.mjs.
 */

export const DIAS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"]; // 1..7
export const MAX_ITENS = 25;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Só os nomes dos artigos, curtos e sem duplicados.
export function limparItens(itens) {
  if (!Array.isArray(itens)) return [];
  const vistos = new Set();
  const out = [];
  for (const i of itens) {
    const nome = String(typeof i === "string" ? i : i?.nome || "").replace(/\s+/g, " ").trim().slice(0, 60);
    const k = nome.toLowerCase();
    if (!nome || vistos.has(k)) continue;
    vistos.add(k);
    out.push(nome);
    if (out.length >= MAX_ITENS) break;
  }
  return out;
}

export const diaValido = (d) => Number.isInteger(Number(d)) && Number(d) >= 1 && Number(d) <= 7;

export function validarLembrete(corpo) {
  const { email, dia, itens, consentimento, convidado } = corpo || {};
  if (consentimento !== true) return { erro: "Falta aceitar receber o lembrete por email." };
  if (!emailValido(email)) return { erro: "Escreve um email válido." };
  if (!diaValido(dia)) return { erro: "Escolhe o dia das compras." };
  return {
    lembrete: {
      email: normalizarEmail(email),
      dia: Number(dia),
      itens: limparItens(itens),
      convidado_id: typeof convidado === "string" && UUID.test(convidado) ? convidado : null,
    },
  };
}

// Dia da semana em Lisboa, de 1 (segunda) a 7 (domingo).
export function diaDaSemanaLisboa(data = new Date()) {
  const nome = data.toLocaleDateString("en-GB", { weekday: "short", timeZone: "Europe/Lisbon" });
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(nome) + 1;
}
