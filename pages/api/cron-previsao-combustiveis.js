import { Resend } from "resend";
import { enviarEmail } from "../../lib/enviarEmail";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { bearerValido } from "../../lib/seguranca";
import { urlCancelarComb } from "../../lib/subscritoresToken";
import { pesquisarPrevisao } from "../../lib/pesquisarPrevisao";
import { hojeLisboa, proximaSegunda, validarPrevisao, vaiSubir, construirEmailPrevisao } from "../../lib/previsaoCombustivel";

/*
 * Alerta "os combustíveis sobem na segunda" — sexta à tarde, com nova
 * tentativa ao sábado de manhã (ver vercel.json). Só um alerta por semana:
 * a tabela previsoes_combustivel guarda a semana já tratada.
 *
 * Recebe quem marcou "avisa-me quando for subir" ao subscrever o email de
 * combustível (subscritores_combustivel.alerta_subidas), uma vez por email.
 *
 * ?teste=1 faz a pesquisa e envia só para EMAIL_ADMIN, sem gravar nada.
 *
 * Requer: SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, ANTHROPIC_API_KEY, CRON_SECRET.
 */
const EMAIL_ADMIN = process.env.EMAIL_ADMIN || "poupeja.portugal@gmail.com";

export default async function handler(req, res) {
  if (!bearerValido(req.headers.authorization, process.env.CRON_SECRET)) {
    return res.status(401).json({ erro: "Não autorizado." });
  }
  const admin = getSupabaseAdmin();
  if (!admin) return res.status(500).json({ erro: "SUPABASE_SERVICE_ROLE_KEY em falta." });
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ erro: "RESEND_API_KEY em falta." });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ erro: "ANTHROPIC_API_KEY em falta." });
  const teste = req.query.teste === "1";
  const base = process.env.NEXT_PUBLIC_URL || "https://xn--poupej-uta.com";
  const semana = proximaSegunda();

  if (!teste) {
    const { data: feito } = await admin.from("previsoes_combustivel").select("semana").eq("semana", semana).maybeSingle();
    if (feito) return res.status(200).json({ ok: true, semana, jaTratada: true });
  }

  let previsao = null;
  try {
    previsao = validarPrevisao(await pesquisarPrevisao({ hoje: hojeLisboa(), semana }), semana);
  } catch (e) {
    console.error("cron-previsao-combustiveis: falha na pesquisa:", e?.message);
  }
  // Sem notícias ainda (ou resposta inválida): não grava, o cron de sábado tenta outra vez.
  if (!previsao) return res.status(200).json({ ok: true, semana, encontrado: false });

  const subir = vaiSubir(previsao);
  const resend = new Resend(process.env.RESEND_API_KEY);

  if (teste) {
    const { subject, html, text } = construirEmailPrevisao({ previsao, base, unsubscribeUrl: `${base}/privacidade` });
    await enviarEmail(resend, { from: "PoupeJá <noreply@xn--poupej-uta.com>", to: EMAIL_ADMIN, subject: `[teste] ${subject}`, html, text });
    return res.status(200).json({ ok: true, teste: true, previsao, subir });
  }

  let enviados = 0, falhas = 0;
  if (subir) {
    const { data: subs, error } = await admin
      .from("subscritores_combustivel")
      .select("id, email, concelho")
      .eq("alerta_subidas", true)
      .is("cancelado_em", null)
      .order("criado_em")
      .limit(5000);
    if (error) {
      console.error("cron-previsao-combustiveis: erro a ler subscritores:", error.message);
      return res.status(500).json({ erro: "Erro a ler subscritores." });
    }
    // Um alerta por pessoa, mesmo que siga vários concelhos (fica o primeiro).
    const porEmail = new Map();
    for (const s of subs || []) if (!porEmail.has(s.email.toLowerCase())) porEmail.set(s.email.toLowerCase(), s);

    for (const sub of porEmail.values()) {
      const unsubscribeUrl = `${urlCancelarComb(base, sub.id)}&so=alerta`;
      const { subject, html, text } = construirEmailPrevisao({
        previsao, base, pagina: `${base}/combustiveis/${sub.concelho}`, unsubscribeUrl,
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
      } catch (e) {
        falhas++;
        console.error("cron-previsao-combustiveis: falha de envio:", e?.message); // sem o email nos logs
      }
      await new Promise(r => setTimeout(r, 120));
    }
  }

  await admin.from("previsoes_combustivel").insert({
    semana,
    gasoleo_cent: previsao.gasoleo,
    gasolina_cent: previsao.gasolina,
    fontes: previsao.fontes,
    resumo: previsao.resumo,
    alerta_enviado: subir,
    enviados,
  });

  console.log(`cron-previsao-combustiveis: semana=${semana} subir=${subir} enviados=${enviados} falhas=${falhas}`);
  return res.status(200).json({ ok: true, semana, previsao, subir, enviados, falhas });
}
