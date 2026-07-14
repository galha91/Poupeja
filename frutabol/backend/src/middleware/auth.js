import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { prisma } from "../db.js";

const COOKIE = "frutabol_sessao";

export function emitirSessao(res, user) {
  const token = jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: "30d" });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    secure: !config.dev,
    sameSite: config.dev ? "lax" : "none",
    maxAge: 30 * 24 * 3600 * 1000,
  });
}

export function terminarSessao(res) {
  res.clearCookie(COOKIE);
}

// Anexa req.user se houver sessão válida (não obriga).
export async function comUtilizador(req, _res, next) {
  try {
    const token = req.cookies?.[COOKIE];
    if (token) {
      const { sub } = jwt.verify(token, config.jwtSecret);
      req.user = await prisma.user.findUnique({
        where: { id: sub },
        select: { id: true, email: true, nome: true, papel: true, saldo: true, emailVerificado: true, codigoReferral: true },
      });
    }
  } catch {
    // token inválido/expirado → segue sem sessão
  }
  next();
}

export function exigirAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ erro: "Inicia sessão primeiro." });
  next();
}

export function exigirAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ erro: "Inicia sessão primeiro." });
  if (req.user.papel !== "ADMIN") return res.status(403).json({ erro: "Sem permissões." });
  next();
}
