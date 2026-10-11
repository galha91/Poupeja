import { Resend } from "resend";
import { enviarEmail } from "../../lib/enviarEmail";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { bearerValido } from "../../lib/seguranca";
import { dadosMunicipio } from "../../lib/municipios";
import { descreverFrescura } from "../../lib/frescura";
import { urlCancelarComb } from "../../lib/subscritoresToken";
import { construirEmailCombustivel } from "../../lib/emailCombustivel";

/*
 * Email semanal de combustível por concelho (segundas-feiras — ver
 * vercel.json). Quem recebe é quem o pediu nas páginas /combustiveis/<concelho>.
 * O de folhetos é outro, noutro dia (cron-email-semanal).
 *
 * Requer: SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, CRON_SECRET.
 */
export default async function handler(req, res) {
  if (!bearerValido(req.headers.authorization, process.env.CRON_SECRET)) {
    return res.status(401).json({ erro: "Não autorizado." });
  }
  const admin = getSupabaseAdmin();
  if (!admin) return res.status(500).json({ erro: "SUPABASE_SERVICE_ROLE_KEY em falta." });
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ erro: "RESEND_API_KEY em falta." });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const base = process.env.NEXT_PUBLIC_URL || "https://xn--poupej-uta.com";

  const { data: subs, error } = await admin
    .from("subscritores_combustivel")
    .select("id, email, concelho, ultimo_gasoleo, ultima_gasolina")
    .is("cancelado_em", null)
    .limit(2000);
  if (error) {
    console.error("cron-email-combustiveis: erro a ler subscritores:", error.message);
    return res.status(500).json({ erro: "Erro a ler subscritores." });
  }

  const cache = new Map(); // dados por concelho: calcula-se uma vez
  let enviados = 0, ignorados = 0, falhas = 0;

  for (const sub of subs || []) {
    if (!cache.has(sub.concelho)) cache.set(sub.concelho, await dadosMunicipio(sub.concelho).catch(() => null));
    const dados = cache.get(sub.concelho);
    // Sem dados do concelho, ou dados de uma consulta com mais de um dia:
    // melhor não enviar do que mandar preços que não são os desta semana.
    const idade = dados ? descreverFrescura(dados.frescura) : null;
    if (!dados || !idade?.iso || Date.now() - Date.parse(idade.iso) > 36 * 3600e3) { ignorados++; continue; }

    const unsubscribeUrl = urlCancelarComb(base, sub.id);
    const { subject, html, text } = construirEmailCombustivel({
      dados,
      anterior: { gasoleo: sub.ultimo_gasoleo, gasolina: sub.ultima_gasolina },
      base, unsubscribeUrl, rotulo: idade.rotulo,
    });
    try {
      await enviarEmail(resend, {
        from: "PoupeJá <noreply@xn--poupej-uta.com>",
        to: sub.email,
        replyTo: "ricardogalha1@hotmail.com",
        subject, html, text,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      enviados++;
      const g = dados.destaques.find(d => d.tipoLabel === "Gasóleo");
      const p = dados.destaques.find(d => d.tipoLabel === "Gasolina 95");
      await admin.from("subscritores_combustivel").update({
        ultimo_envio: new Date().toISOString(),
        ultimo_gasoleo: g?.preco ?? null,
        ultima_gasolina: p?.preco ?? null,
      }).eq("id", sub.id);
    } catch (e) {
      falhas++;
      console.error("cron-email-combustiveis: falha de envio:", e?.message); // sem o email nos logs
    }
    await new Promise(r => setTimeout(r, 120));
  }

  console.log(`cron-email-combustiveis: enviados=${enviados} ignorados=${ignorados} falhas=${falhas}`);
  return res.status(200).json({ ok: true, enviados, ignorados, falhas });
}
