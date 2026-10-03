import { diasEntre, somarDias, paraData } from "./datas.js";

/*
 * Lembretes de garantias, renovações de contas e prazos do Estado.
 *
 * Um PWA não consegue agendar uma notificação para daqui a 60 dias: o
 * service worker não acorda sozinho, e a API que o permitia (Notification
 * Triggers) nunca saiu do Chrome experimental. Notificações push a sério
 * precisavam que as datas ficassem num servidor — e estes dados ficam só
 * no dispositivo. Por isso há três camadas, todas locais:
 *
 *   1. aviso no sino da app (PainelAvisos) quando o marco é atingido;
 *   2. notificação do sistema ao abrir a app, se a pessoa já deu permissão;
 *   3. ficheiro .ics: o calendário do telemóvel avisa na data certa,
 *      mesmo com a app fechada — é o único lembrete que não falha.
 */

export const ANTECEDENCIA_CONTAS = [60, 30];
export const ANTECEDENCIA_GARANTIAS = [60, 30];
// Prazos do Estado: 60 dias antes de "entregar o IRS" é cedo demais para
// ser útil; uma semana antes ainda dá para tratar com calma.
export const ANTECEDENCIA_PRAZOS = [30, 7];

/** Datas em que o lembrete deve aparecer (mais cedo primeiro). */
export function datasLembrete(alvo, antecedencias) {
  if (!paraData(alvo)) return [];
  return [...antecedencias]
    .sort((a, b) => b - a)
    .map(dias => ({ dias, data: somarDias(alvo, -dias) }));
}

/**
 * Em que ponto está um lembrete hoje.
 *   dias:  dias até ao alvo (negativo = já passou)
 *   ativo: entre o primeiro marco e o próprio dia
 *   marco: o marco mais próximo já atingido (60 ou 30, p. ex.), ou null
 */
export function estadoLembrete(alvo, hoje, antecedencias) {
  const dias = diasEntre(hoje, alvo);
  if (dias == null) return { dias: null, ativo: false, marco: null };
  const atingidos = antecedencias.filter(a => dias <= a).sort((a, b) => a - b);
  const marco = atingidos.length ? atingidos[0] : null;
  return { dias, ativo: dias >= 0 && marco != null, marco };
}

/* ─── .ics (RFC 5545) ─── */

function escaparTexto(s) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Linhas com mais de 75 octetos dobram-se com CRLF + espaço. Conta-se em
// bytes UTF-8 (um "ã" são dois) e nunca se parte um carácter ao meio.
function dobrar(linha) {
  const enc = new TextEncoder();
  if (enc.encode(linha).length <= 75) return linha;
  const partes = [];
  let atual = "", tam = 0, limite = 75;
  for (const ch of linha) {
    const n = enc.encode(ch).length;
    if (tam + n > limite) {
      partes.push(atual);
      atual = "";
      tam = 0;
      limite = 74; // as continuações começam com um espaço
    }
    atual += ch;
    tam += n;
  }
  partes.push(atual);
  return partes.join("\r\n ");
}

const dataIcs = iso => iso.replace(/-/g, "");

function carimbo(agora) {
  return agora.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// O evento de dia inteiro começa à meia-noite; "-P30D" tocava às 00:00.
// Recua-se um dia a menos e 15 horas: toca às 9:00 do dia certo.
export function gatilho(dias) {
  return dias >= 1 ? `-P${dias - 1}DT15H` : "PT9H";
}

/**
 * eventos: [{ uid, titulo, descricao?, data: "AAAA-MM-DD", alarmes: [60, 30], url? }]
 * Cada evento é de dia inteiro, na data-alvo, com um alarme por antecedência.
 */
export function gerarIcs(eventos, agora = new Date()) {
  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PoupeJa//Lembretes//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const ev of eventos) {
    if (!paraData(ev.data)) continue;
    const fim = somarDias(ev.data, 1);
    linhas.push(
      "BEGIN:VEVENT",
      `UID:${ev.uid}@poupeja.com`,
      `DTSTAMP:${carimbo(agora)}`,
      `DTSTART;VALUE=DATE:${dataIcs(ev.data)}`,
      `DTEND;VALUE=DATE:${dataIcs(fim)}`,
      `SUMMARY:${escaparTexto(ev.titulo)}`,
    );
    if (ev.descricao) linhas.push(`DESCRIPTION:${escaparTexto(ev.descricao)}`);
    if (ev.url) linhas.push(`URL:${ev.url}`);
    for (const dias of ev.alarmes || []) {
      linhas.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escaparTexto(ev.titulo)}`,
        `TRIGGER:${gatilho(dias)}`,
        "END:VALARM",
      );
    }
    linhas.push("END:VEVENT");
  }
  linhas.push("END:VCALENDAR");
  return linhas.map(dobrar).join("\r\n") + "\r\n";
}
