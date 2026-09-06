import { Resend } from "resend";
import { bearerValido } from "../../lib/seguranca";
import { atualizarSnapshot, idadeSnapshot, IDADE_PREOCUPANTE } from "../../lib/precosSnapshot";

/*
 * Actualização HORÁRIA dos preços da DGEG.
 * Disparado pelo Vercel Cron (ver vercel.json).
 *
 * Existe para a frescura não depender do tráfego: sem isto, os preços só
 * eram actualizados quando alguém visitava uma página e calhava apanhar uma
 * instância com a cache expirada. Um dia sem visitas era um dia sem dados
 * novos, e uma instância fria com a DGEG em baixo não tinha nada para mostrar.
 *
 * Duas regras:
 *  - nunca substituir um snapshot bom por uma falha (é quando ele faz falta);
 *  - se ficar horas sem conseguir actualizar, avisar por email, porque um
 *    site a mostrar preços de anteontem em silêncio é o pior dos casos.
 */
export default async function handler(req, res) {
  if (!bearerValido(req.headers.authorization, process.env.CRON_SECRET)) {
    return res.status(401).json({ erro: "Não autorizado." });
  }

  const r = await atualizarSnapshot();

  if (r.ok) {
    console.log(`cron-precos: OK — ${r.nPostos} preços${r.parcial ? " (alguns distritos vieram de cache)" : ""}`);
    return res.status(200).json({
      ok: true,
      nPostos: r.nPostos,
      obtidoEm: new Date(r.obtidoEm).toISOString(),
      dataPreco: r.dataPreco ? new Date(r.dataPreco).toISOString() : null,
      parcial: r.parcial,
    });
  }

  /*
   * Falhou. O snapshot anterior ficou intacto — o site continua a servir
   * preços reais, com a data deles. Só é preciso saber há quanto tempo isto
   * dura: uma falha isolada não é notícia, meio dia sem actualizar é.
   */
  const idade = await idadeSnapshot();
  const idadeH = idade ? (idade.idadeMs / 3600e3).toFixed(1) : null;
  console.error(`cron-precos: FALHOU — ${r.motivo}. Snapshot com ${idadeH ?? "?"}h.`);

  const preocupante = !idade || idade.idadeMs > IDADE_PREOCUPANTE;
  if (preocupante && process.env.RESEND_API_KEY) {
    try {
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: "PoupeJá <noreply@xn--poupej-uta.com>",
        to: "poupeja.portugal@gmail.com",
        subject: `PoupeJá — preços da DGEG sem actualizar há ${idadeH ?? "?"}h`,
        text:
          `A actualização horária dos preços falhou.\n\n` +
          `Motivo: ${r.motivo}\n` +
          `Idade do último snapshot bom: ${idadeH ?? "não existe nenhum"}h\n` +
          `Postos guardados: ${idade?.nPostos ?? 0}\n\n` +
          `O site continua a mostrar os últimos preços reais, com a data deles ` +
          `bem visível, e deixa de os mostrar ao fim de 7 dias.\n\n` +
          `Se isto se repetir, vale a pena confirmar se a API da DGEG mudou:\n` +
          `https://precoscombustiveis.dgeg.gov.pt/`,
      });
    } catch (e) {
      console.error("cron-precos: falhou também o email de aviso:", e.message);
    }
  }

  // 200 de propósito: a falha é da DGEG, não desta rota. Um 500 só faria o
  // Vercel marcar o cron como partido quando ele fez exactamente o que devia.
  return res.status(200).json({
    ok: false,
    motivo: r.motivo,
    snapshotIdadeHoras: idadeH,
    avisoEnviado: preocupante,
  });
}
