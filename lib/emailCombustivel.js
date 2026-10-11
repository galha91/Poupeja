import { eur } from "./formato.js";

/*
 * Email semanal de combustível de um concelho. Função pura: recebe os dados
 * já calculados por dadosMunicipio() e devolve { subject, html, text }.
 *
 * Só diz o que sabe: os preços são os que a DGEG tinha na consulta (`rotulo`)
 * e a variação é contra o último email enviado a esta pessoa, se houver.
 */

function variacao(novo, anterior, rotulo) {
  if (novo == null || anterior == null) return null;
  const cent = Math.round((novo - anterior) * 100);
  if (cent === 0) return `${rotulo}: igual ao último email`;
  return `${rotulo}: ${cent < 0 ? "desceu" : "subiu"} ${Math.abs(cent)} cênt. desde o último email`;
}

export function construirEmailCombustivel({ dados, anterior = {}, base, unsubscribeUrl, rotulo }) {
  const { municipio, destaques, amplitude, ranking, noConcelho, proximos } = dados;
  const nome = municipio.nome;
  const gasoleo = destaques.find(d => d.tipoLabel === "Gasóleo") || null;
  const gasolina = destaques.find(d => d.tipoLabel === "Gasolina 95") || null;
  const pagina = `${base}/combustiveis/${municipio.slug}`;

  const top = tipo => noConcelho.filter(p => p.tipoLabel === tipo).slice(0, 3);
  const linhas = tipo => top(tipo).map(p =>
    ({ nome: (p.nome || p.marca || "").trim(), preco: p.preco })
  );

  // Vale a pena sair do concelho? Só se a diferença pagar o desvio (3+ cêntimos).
  const fora = gasoleo && proximos[0] && gasoleo.preco - proximos[0].preco >= 0.03 ? proximos[0] : null;

  const vGasoleo = variacao(gasoleo?.preco, anterior.gasoleo, "Gasóleo");
  const vGasolina = variacao(gasolina?.preco, anterior.gasolina, "Gasolina 95");

  const subject = gasoleo
    ? `Gasóleo em ${nome}: desde ${eur(gasoleo.preco, 3)} €/L esta semana`
    : `Combustível em ${nome} esta semana`;

  const bloco = (titulo, d, v, lista) => d ? `
    <div style="margin:0 0 20px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">${titulo}</p>
      <p style="margin:0;font-size:28px;font-weight:900;color:#0f172a;line-height:1;">${eur(d.preco, 3)} <span style="font-size:13px;font-weight:600;color:#64748b;">€/L</span></p>
      <p style="margin:4px 0 0;font-size:13px;color:#475569;">${d.nome}</p>
      ${v ? `<p style="margin:4px 0 0;font-size:12px;font-weight:600;color:#047857;">${v}</p>` : ""}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
        ${lista.map(l => `<tr><td style="padding:6px 0;border-top:1px solid #f1f5f9;font-size:13px;color:#334155;">${l.nome}</td><td align="right" style="padding:6px 0;border-top:1px solid #f1f5f9;font-size:13px;font-weight:700;color:#0f172a;white-space:nowrap;">${eur(l.preco, 3)} €</td></tr>`).join("")}
      </table>
    </div>` : "";

  const html = `<!DOCTYPE html>
<html lang="pt"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><title>Combustível em ${nome} — PoupeJá</title></head>
<body style="margin:0;padding:0;background:#f3f4f2;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 16px;"><tr><td align="center">
<table width="100%" style="max-width:500px;background:#ffffff;border-radius:20px;overflow:hidden;">
  <tr><td style="background:#0b6b4f;padding:26px 28px;">
    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:rgba(255,255,255,0.8);">PoupeJá</p>
    <h1 style="margin:0;color:#ffffff;font-size:21px;font-weight:900;line-height:1.25;">Combustível em ${nome}</h1>
  </td></tr>
  <tr><td style="padding:24px 28px 8px;">
    ${bloco("Gasóleo mais barato", gasoleo, vGasoleo, linhas("Gasóleo"))}
    ${bloco("Gasolina 95 mais barata", gasolina, vGasolina, linhas("Gasolina 95"))}
    ${amplitude ? `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#0f172a;">Num depósito de 50 litros de gasóleo, escolher o posto mais barato em vez do mais caro do concelho poupa <strong>${eur(amplitude.porDeposito, 2)} €</strong>.</p>` : ""}
    ${ranking ? `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#0f172a;">Entre os ${ranking.total} concelhos do distrito de ${ranking.distrito}, ${nome} é o <strong>${ranking.posicao}.º mais barato</strong> para o gasóleo.</p>` : ""}
    ${fora ? `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#0f172a;">Perto: em ${fora.municipio}, a ${fora.distancia} km, o gasóleo está a <strong>${eur(fora.preco, 3)} €</strong> (${(fora.nome || fora.marca || "").trim()}).</p>` : ""}
    <div style="text-align:center;margin:22px 0 12px;">
      <a href="${pagina}" style="display:inline-block;background:#0b6b4f;color:#ffffff;font-weight:800;font-size:14px;text-decoration:none;padding:13px 30px;border-radius:12px;">Ver todos os postos de ${nome}</a>
    </div>
  </td></tr>
  <tr><td style="padding:8px 28px 24px;">
    <p style="margin:0 0 8px;font-size:11px;color:#94a3b8;line-height:1.6;">Fonte: DGEG. ${rotulo}. Cada posto comunica o seu preço quando o altera; confirma no posto.</p>
    <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">Recebes este email porque o pediste no PoupeJá. <a href="${unsubscribeUrl}" style="color:#64748b;">Cancelar subscrição</a></p>
  </td></tr>
</table></td></tr></table></body></html>`;

  const txt = (t, d, v, lista) => d
    ? [`${t}: ${eur(d.preco, 3)} €/L (${d.nome})`, v, ...lista.map(l => `  - ${l.nome}: ${eur(l.preco, 3)} €`)].filter(Boolean).join("\n")
    : null;
  const text = [
    `Combustível em ${nome}`,
    txt("Gasóleo mais barato", gasoleo, vGasoleo, linhas("Gasóleo")),
    txt("Gasolina 95 mais barata", gasolina, vGasolina, linhas("Gasolina 95")),
    amplitude ? `Num depósito de 50 L de gasóleo, a diferença entre o posto mais barato e o mais caro do concelho é ${eur(amplitude.porDeposito, 2)} €.` : null,
    ranking ? `Entre os ${ranking.total} concelhos do distrito de ${ranking.distrito}, ${nome} é o ${ranking.posicao}.º mais barato para o gasóleo.` : null,
    fora ? `Perto: em ${fora.municipio}, a ${fora.distancia} km, o gasóleo está a ${eur(fora.preco, 3)} €.` : null,
    `Todos os postos: ${pagina}`,
    `Fonte: DGEG. ${rotulo}. Confirma o preço no posto.`,
    `Cancelar subscrição: ${unsubscribeUrl}`,
  ].filter(Boolean).join("\n\n");

  return { subject, html, text };
}
