import { Resend } from "resend";
import { enviarEmail } from "../../lib/enviarEmail";
import { bearerValido } from "../../lib/seguranca";
import { verificarLojas } from "../../lib/supermercados/saude";

/*
 * Verificação DIÁRIA de "Comparar preços" (Vercel Cron, ver vercel.json).
 *
 * - Alguma loja falhou → email no próprio dia, com a loja e o motivo.
 * - Tudo bem → à segunda-feira chega um resumo mesmo assim. Sem ele, o
 *   silêncio tanto queria dizer "está tudo a funcionar" como "a verificação
 *   deixou de correr" — e não havia maneira de distinguir.
 */

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function construirEmail(resultados, base) {
  const falhas = resultados.filter((r) => !r.ok);
  const subject = falhas.length
    ? `⚠️ Comparar preços: ${falhas.map((f) => f.nome).join(", ")} ${falhas.length === 1 ? "deixou" : "deixaram"} de funcionar`
    : "✅ Comparar preços: as 4 lojas estão a funcionar";
  const linhas = resultados.map((r) => `
    <tr><td style="padding:12px 0;border-top:1px solid #eee;">
      <div style="font-size:15px;font-weight:600;color:${r.ok ? "#0b6b4f" : "#b4472e"};">${r.ok ? "✓" : "✗"} ${esc(r.nome)}</div>
      <div style="font-size:13px;color:#5c6b62;margin-top:3px;">${r.ok ? r.detalhes.map(esc).join("<br>") : esc(r.erro)}</div>
    </td></tr>`).join("");
  const html = `<!doctype html><html><body style="margin:0;padding:24px 16px;background:#f6f5f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;">
    <tr><td>
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#636d66;">Verificação automática diária</div>
      <h1 style="font-size:20px;margin:6px 0 4px;color:#14231c;">${falhas.length ? "Há lojas sem preços" : "Tudo a funcionar"}</h1>
      <p style="font-size:14px;color:#5c6b62;margin:0 0 8px;">${falhas.length
        ? "Quem pesquisar vê «Não respondeu agora» nestas lojas. Normalmente é o supermercado que mudou o site e a leitura tem de ser ajustada."
        : "Todas as lojas devolveram produtos com preço válido."}</p>
    </td></tr>
    ${linhas}
    <tr><td style="padding-top:16px;font-size:12px;color:#636d66;">Testar à mão: <a href="${base}/api/precos-supermercado?q=leite" style="color:#0b6b4f;">${base}/api/precos-supermercado?q=leite</a></td></tr>
  </table></body></html>`;
  return { subject, html };
}

export default async function handler(req, res) {
  if (!bearerValido(req.headers.authorization, process.env.CRON_SECRET)) {
    return res.status(401).json({ erro: "Não autorizado." });
  }

  const resultados = await verificarLojas();
  const falhas = resultados.filter((r) => !r.ok);
  const segunda = new Date().getUTCDay() === 1;
  console.log("cron-saude-precos:", resultados.map((r) => `${r.id}=${r.ok ? "ok" : `FALHA (${r.erro})`}`).join("; "));

  let emailEnviado = false;
  if ((falhas.length || segunda) && process.env.RESEND_API_KEY) {
    const base = process.env.NEXT_PUBLIC_URL || "https://xn--poupej-uta.com";
    const { subject, html } = construirEmail(resultados, base);
    try {
      await enviarEmail(new Resend(process.env.RESEND_API_KEY), {
        from: "PoupeJá <noreply@xn--poupej-uta.com>",
        to: process.env.ADMIN_EMAIL || "ricardogalha1@hotmail.com",
        subject,
        html,
      });
      emailEnviado = true;
    } catch (e) {
      console.error("cron-saude-precos: falha no email:", e?.message);
    }
  }

  // 200 mesmo com falhas: o cron correu bem; o resultado está no corpo.
  return res.status(200).json({ ok: !falhas.length, resultados, emailEnviado });
}
