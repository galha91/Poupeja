import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { origemValida, excedeuLimite } from "../../lib/protecao-api";
import { caminhoValido, eBot, classificarOrigem } from "../../lib/visitas";

// Conta uma página vista, sem cookies nem identificadores. O visitante do dia
// é um hash de IP+browser+dia que fica guardado só até ao fim desse dia.
const ANFITRIAO = "xn--poupej-uta.com";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!origemValida(req)) return res.status(403).end();
  if (excedeuLimite(req, "visita", 60)) return res.status(429).end();

  const ua = req.headers["user-agent"] || "";
  if (eBot(ua)) return res.status(204).end();

  const { caminho, ref } = req.body || {};
  const c = caminhoValido(caminho);
  if (!c) return res.status(204).end();

  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).end();

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "?";
  const dia = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
  const sal = process.env.VISITAS_SAL || process.env.CRON_SECRET || "poupeja";
  const hash = createHash("sha256").update(`${ip}|${ua}|${dia}|${sal}`).digest("hex").slice(0, 32);
  const origem = classificarOrigem(typeof ref === "string" ? ref.slice(0, 300) : "", ANFITRIAO);

  const { error } = await admin.rpc("registar_visita", { p_caminho: c, p_origem: origem, p_hash: hash });
  return res.status(error ? 500 : 204).end();
}
