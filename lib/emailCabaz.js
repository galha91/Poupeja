import { eur } from "./formato.js";
import { escaparHtml } from "./escapar.js";
import { dataExtenso } from "./datas.js";

// Número e € sempre juntos (espaço que não parte a linha).
const euro = (v) => `${eur(v, 2)}\u00a0€`;

/*
 * Email de quarta-feira: só o cabaz da semana.
 *
 * O resumo de segunda leva folhetos, jantar, campanha… e quem não lê emails
 * compridos nunca chega ao cabaz. Este é curto de propósito: um número no
 * assunto, a tabela das cadeias e um botão. Os dados são os mesmos do
 * Início e do Barómetro (lib/cabazInicio, lib/barometro), já calculados de
 * madrugada no GitHub; aqui não se faz conta nenhuma nova.
 *
 *   cabaz      a linha "inicio/cabaz" de paginas_marca (resumirCabaz + dia)
 *   variacao   variacao() do Barómetro, ou null
 *   natal      a linha "inicio/natal", só na época (natalServe), ou null
 */

const naLoja = (l) => `${l.loja === "apolonia" ? "na" : "no"} ${l.nome}`;

export function assuntoCabaz(cabaz) {
  const [a, b] = cabaz.porLoja || [];
  if (cabaz.empate && a && b) return `🛒 Cabaz da semana: ${a.nome} e ${b.nome} quase empatados`;
  return `🛒 Cabaz da semana: mais barato ${naLoja(cabaz)} (${euro(cabaz.total)})`;
}

export function construirEmailCabaz({ nome, cabaz, variacao = null, natal = null, base, unsubscribeUrl }) {
  const primeiroNome = escaparHtml((nome || "").split(" ")[0] || "Olá");
  const lojas = (cabaz.porLoja || []).slice(0, 6);
  const barata = lojas[0];
  const cara = lojas[lojas.length - 1];
  const artigos = (cabaz.artigos || []).join(", ").toLowerCase();
  const link = (caminho, o) => `${base}${caminho}${caminho.includes("?") ? "&" : "?"}o=${o}`;
  const linkLista = link("/?atalho=lista", "email-cabaz");
  const linkBarometro = link("/barometro", "email-cabaz");
  const linkNatal = link("/ceia-de-natal", "email-cabaz-natal");

  const segunda = lojas[1];
  const frase = cabaz.empate
    ? `O cabaz vai de ${euro(barata.total)} ${naLoja(barata)} a ${euro(cara.total)} ${naLoja(cara)}${segunda && segunda !== cara ? `, e os dois mais baratos estão separados por ${euro(segunda.total - barata.total)}` : ""}.`
    : `O cabaz fica mais barato ${naLoja(barata)}: ${euro(barata.total)}. ${naLoja(cara).replace(/^./, (c) => c.toUpperCase())} custa ${euro(cara.total)}, mais ${euro(cara.total - barata.total)}.`;
  const fraseVariacao = variacao && Math.abs(variacao.diff) >= 0.01
    ? `Em média, ${variacao.diff > 0 ? "subiu" : "desceu"} ${euro(Math.abs(variacao.diff))} face à semana passada.`
    : variacao ? "Em média, custa o mesmo do que na semana passada." : "";

  const linhas = lojas.map((l, i) => `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#0f172a;${i === 0 ? "font-weight:700;" : ""}">${i + 1}. ${escaparHtml(l.nome)}</td>
                <td align="right" style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:700;color:${i === 0 ? "#0b6b4f" : "#0f172a"};white-space:nowrap;">${euro(l.total)}</td>
              </tr>`).join("");

  const natalOk = natal?.porLoja?.length >= 2;
  const blocoNatal = natalOk ? `
            <p style="margin:18px 0 0;font-size:13px;color:#475569;line-height:1.6;">
              🎄 A ceia de Natal para 6 pessoas vai de <strong>${euro(natal.porLoja[0].total)}</strong> ${naLoja(natal.porLoja[0])}
              a ${euro(natal.porLoja[natal.porLoja.length - 1].total)}. <a href="${linkNatal}" style="color:#0b6b4f;font-weight:700;">Ver artigo a artigo</a>
            </p>` : "";

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>Cabaz da semana — PoupeJá</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f2;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${escaparHtml(frase)}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f2;padding:28px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:460px;background:#ffffff;border-radius:18px;overflow:hidden;">
        <tr>
          <td style="padding:22px 22px 0;">
            <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#0b6b4f;text-transform:uppercase;letter-spacing:0.08em;">PoupeJá · cabaz da semana</p>
            <!-- O destaque: a resposta logo em cima, antes de qualquer texto. -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b6b4f;border-radius:16px;">
              <tr><td style="padding:20px 20px 18px;">
                <p style="margin:0;font-size:12.5px;font-weight:700;color:#bfe3d3;text-transform:uppercase;letter-spacing:0.06em;">${cabaz.empate ? "Esta semana há empate" : "Mais barato esta semana"}</p>
                <p style="margin:6px 0 0;font-size:24px;font-weight:900;color:#ffffff;line-height:1.25;">${cabaz.empate && segunda ? `${escaparHtml(barata.nome)} e ${escaparHtml(segunda.nome)}` : escaparHtml(barata.nome)}</p>
                <p style="margin:4px 0 0;font-size:38px;font-weight:900;color:#ffffff;line-height:1.1;white-space:nowrap;">${euro(barata.total)}</p>
                <p style="margin:8px 0 0;font-size:13.5px;color:#d5ece1;line-height:1.5;">${cara && cara !== barata ? `Mais ${euro(cara.total - barata.total)} ${naLoja(cara)}, pelos mesmos ${(cabaz.artigos || []).length} básicos.` : ""}${fraseVariacao ? ` ${escaparHtml(fraseVariacao)}` : ""}</p>
                <a href="${linkLista}" style="display:inline-block;margin-top:14px;background:#ffffff;color:#0b6b4f;font-weight:900;font-size:14.5px;text-decoration:none;padding:12px 22px;border-radius:12px;">Comparar a minha lista →</a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 26px 0;">
            <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">${primeiroNome}, ${escaparHtml(frase.replace(/^./, (c) => c.toLowerCase()))}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 26px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">${linhas}
            </table>
            <p style="margin:8px 0 0;font-size:11.5px;color:#94a3b8;line-height:1.5;">O mesmo cabaz em cada cadeia: ${escaparHtml(artigos)}. Preços online de ${cabaz.dia ? escaparHtml(dataExtenso(cabaz.dia, { ano: false })) : "hoje"}.</p>${blocoNatal}
          </td>
        </tr>
        <tr>
          <td style="padding:22px 26px 8px;text-align:center;">
            <a href="${linkLista}" style="display:inline-block;background:#0b6b4f;color:#ffffff;font-weight:900;font-size:15px;text-decoration:none;padding:14px 28px;border-radius:12px;">Comparar a minha lista →</a>
            <p style="margin:10px 0 0;font-size:12px;"><a href="${linkBarometro}" style="color:#64748b;">Ver a evolução no Barómetro</a></p>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 26px 22px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;line-height:1.8;">
              Recebes isto à quarta-feira porque tens conta no PoupeJá.<br>
              <a href="${unsubscribeUrl}" style="color:#059669;font-weight:600;">Deixar de receber o cabaz</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `PoupeJá — cabaz da semana

${frase} ${fraseVariacao}

${lojas.map((l, i) => `${i + 1}. ${l.nome}: ${eur(l.total, 2)} €`).join("\n")}

O mesmo cabaz em cada cadeia: ${artigos}.
${natalOk ? `\nCeia de Natal para 6 pessoas: de ${eur(natal.porLoja[0].total, 2)} € ${naLoja(natal.porLoja[0])}. ${linkNatal}\n` : ""}
Comparar a minha lista: ${linkLista}

—
Deixar de receber o cabaz: ${unsubscribeUrl}`;

  return { subject: assuntoCabaz(cabaz), html, text };
}
