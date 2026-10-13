import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { origemValida, excedeuLimite } from "../../lib/protecao-api";
import { caminhoValido, eBot, classificarOrigem, origemEtiqueta, regiaoDe, tipoDispositivo, modoValido, recorrenciaValida } from "../../lib/visitas";
import { EMAILS_EXCLUIDOS } from "../../lib/adminAuth";

// Conta uma página vista, sem cookies nem identificadores. O visitante do dia
// é um hash de IP+browser+dia que fica guardado só até ao fim desse dia.
const ANFITRIAO = "xn--poupej-uta.com";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!origemValida(req)) return res.status(403).end();
  if (excedeuLimite(req, "visita", 60)) return res.status(429).end();

  const ua = req.headers["user-agent"] || "";
  if (eBot(ua)) return res.status(204).end();

  const { caminho, ref, o, modo, rec } = req.body || {};
  const c = caminhoValido(caminho);
  if (!c) return res.status(204).end();

  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).end();

  // Com sessão do dono, não conta — e diz ao browser para não voltar a
  // contar neste dispositivo, mesmo sem sessão.
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) {
    const { data } = await admin.auth.getUser(auth.slice(7)).catch(() => ({}));
    if (EMAILS_EXCLUIDOS.has((data?.user?.email || "").toLowerCase())) {
      res.setHeader("X-Nao-Contar", "1");
      return res.status(204).end();
    }
  }

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "?";
  const dia = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
  const sal = process.env.VISITAS_SAL || process.env.CRON_SECRET || "poupeja";
  const hash = createHash("sha256").update(`${ip}|${ua}|${dia}|${sal}`).digest("hex").slice(0, 32);
  const origem = origemEtiqueta(o) || classificarOrigem(typeof ref === "string" ? ref.slice(0, 300) : "", ANFITRIAO);

  // Perfil largo e anónimo: o distrito vem do IP (cabeçalhos da Vercel), nunca
  // o próprio IP. Só entra na contagem na primeira visita do dia.
  const { error } = await admin.rpc("registar_visita", {
    p_caminho: c, p_origem: origem, p_hash: hash,
    p_regiao: regiaoDe(req.headers["x-vercel-ip-country"], req.headers["x-vercel-ip-country-region"]),
    p_dispositivo: tipoDispositivo(ua),
    p_modo: modoValido(modo),
    p_recorrencia: recorrenciaValida(rec),
  });
  return res.status(error ? 500 : 204).end();
}
