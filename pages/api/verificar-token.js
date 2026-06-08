import crypto from "crypto";

const SECRET = process.env.TOKEN_SECRET || "poupeja-fallback";

export default function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ erro: "Token em falta." });

  const parts = token.split(".");
  if (parts.length !== 2) return res.status(400).json({ erro: "Token inválido." });

  const [payload, sig] = parts;
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  if (sig !== expected) return res.status(400).json({ erro: "Token inválido." });

  let dados;
  try {
    dados = JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return res.status(400).json({ erro: "Token corrompido." });
  }

  if (Date.now() > dados.exp)
    return res.status(400).json({ erro: "Link expirado. Regista-te novamente." });

  res.status(200).json({
    user: {
      nome: dados.nome,
      email: dados.email,
      password: dados.password,
      criado: new Date().toISOString(),
    },
  });
}
