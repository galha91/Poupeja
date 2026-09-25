import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { origemValida } from "../../lib/protecao-api";

/*
 * Apaga a conta de quem está autenticado — e tudo o que lhe pertence.
 *
 * Obrigatório para a Play Store: uma app onde se cria conta tem de deixar
 * apagá-la dentro da própria app (Definições → Conta) e também a partir de
 * uma página web (/apagar-conta). As duas chamam esta rota.
 *
 * Só a sessão decide QUEM é apagado: o id sai do token, nunca do pedido.
 * dados_utilizador e push_subscriptions têm ON DELETE CASCADE sobre
 * auth.users, por isso apagar o utilizador leva os dados com ele. As listas
 * partilhadas não guardam dono (são de quem tiver o link) e ficam.
 */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido." });
  if (!origemValida(req)) return res.status(403).json({ erro: "Origem não permitida." });

  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).json({ erro: "Serviço indisponível." });

  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ erro: "Sem autorização." });

  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !user) return res.status(401).json({ erro: "Sessão inválida." });

  // Confirmação explícita no corpo: um pedido acidental não apaga nada.
  if ((req.body || {}).confirmar !== "APAGAR") {
    return res.status(400).json({ erro: "Falta a confirmação." });
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("apagar-conta: falhou:", error.message);
    return res.status(500).json({ erro: "Não foi possível apagar a conta agora." });
  }

  console.log("apagar-conta: conta apagada");
  return res.status(200).json({ ok: true });
}
