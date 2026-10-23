import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma, transacaoSegura, ErroNegocio } from "../db.js";
import { config } from "../config.js";
import { validar } from "../middleware/validar.js";
import { limiteAuth } from "../middleware/limites.js";
import { emitirSessao, terminarSessao, exigirAuth } from "../middleware/auth.js";
import { movimentar, valorConfig } from "../servicos/moedas.js";
import { enviarVerificacao } from "../servicos/email.js";

export const rotasAuth = Router();

const esquemaRegisto = z.object({
  email: z.string().email("Email inválido"),
  nome: z.string().min(3, "Mínimo 3 caracteres").max(24).regex(/^[a-zA-Z0-9_.-]+$/, "Só letras, números e _ . -"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(128),
  codigoReferral: z.string().max(24).optional(),
});

function novoCodigoReferral() {
  return `FRB${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function utilizadorPublico(u) {
  return {
    id: u.id, email: u.email, nome: u.nome, papel: u.papel,
    saldo: u.saldo, emailVerificado: u.emailVerificado, codigoReferral: u.codigoReferral,
  };
}

// ---------- registo (com bónus e referral) ----------
rotasAuth.post("/registo", limiteAuth, validar(esquemaRegisto), async (req, res, next) => {
  try {
    const { email, nome, password, codigoReferral } = req.dados;
    const emailNorm = email.toLowerCase();

    const user = await transacaoSegura(async (tx) => {
      const existente = await tx.user.findFirst({
        where: { OR: [{ email: emailNorm }, { nome }] },
      });
      if (existente) throw new ErroNegocio("Esse email ou nome de utilizador já está registado.");

      const padrinho = codigoReferral
        ? await tx.user.findUnique({ where: { codigoReferral: codigoReferral.toUpperCase() } })
        : null;
      if (codigoReferral && !padrinho) throw new ErroNegocio("Código de convite inválido.");

      const criado = await tx.user.create({
        data: {
          email: emailNorm,
          nome,
          passwordHash: await bcrypt.hash(password, 12),
          papel: emailNorm === config.adminEmail ? "ADMIN" : "UTILIZADOR",
          codigoReferral: novoCodigoReferral(),
          tokenVerificacao: crypto.randomBytes(24).toString("hex"),
        },
      });

      const bonusRegisto = await valorConfig(tx, "BONUS_REGISTO");
      await movimentar(tx, criado.id, "BONUS_REGISTO", bonusRegisto);

      if (padrinho) {
        const bonusReferral = await valorConfig(tx, "BONUS_REFERRAL");
        await tx.referral.create({
          data: { padrinhoId: padrinho.id, afilhadoId: criado.id, moedas: bonusReferral },
        });
        await movimentar(tx, padrinho.id, "BONUS_REFERRAL", bonusReferral, { afilhado: criado.id });
        await movimentar(tx, criado.id, "BONUS_REFERRAL", bonusReferral, { padrinho: padrinho.id });
      }

      return tx.user.findUniqueOrThrow({ where: { id: criado.id } });
    });

    enviarVerificacao(user.email, user.tokenVerificacao).catch(() => {});
    emitirSessao(res, user);
    res.status(201).json({ user: utilizadorPublico(user) });
  } catch (e) {
    next(e);
  }
});

// ---------- login ----------
rotasAuth.post(
  "/entrar",
  limiteAuth,
  validar(z.object({ email: z.string().email(), password: z.string().min(1) })),
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({ where: { email: req.dados.email.toLowerCase() } });
      if (!user?.passwordHash || !(await bcrypt.compare(req.dados.password, user.passwordHash))) {
        return res.status(401).json({ erro: "Email ou password errados." });
      }
      emitirSessao(res, user);
      res.json({ user: utilizadorPublico(user) });
    } catch (e) {
      next(e);
    }
  }
);

rotasAuth.post("/sair", (_req, res) => {
  terminarSessao(res);
  res.json({ ok: true });
});

rotasAuth.get("/eu", (req, res) => {
  res.json({ user: req.user || null, pagamentosAtivos: config.pagamentosAtivos });
});

// ---------- verificação de email ----------
rotasAuth.post(
  "/verificar",
  limiteAuth,
  validar(z.object({ token: z.string().min(10).max(64) })),
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({ where: { tokenVerificacao: req.dados.token } });
      if (!user) return res.status(400).json({ erro: "Token inválido ou já usado." });
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerificado: true, tokenVerificacao: null },
      });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);

rotasAuth.post("/reenviar-verificacao", limiteAuth, exigirAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user.id } });
    if (user.emailVerificado) return res.json({ ok: true });
    let token = user.tokenVerificacao;
    if (!token) {
      token = crypto.randomBytes(24).toString("hex");
      await prisma.user.update({ where: { id: user.id }, data: { tokenVerificacao: token } });
    }
    await enviarVerificacao(user.email, token);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ---------- OAuth Google (opcional — precisa de credenciais no .env) ----------
rotasAuth.get("/google", (req, res) => {
  if (!config.google.clientId) return res.status(501).json({ erro: "OAuth Google não configurado." });
  const p = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: `${config.backendUrl}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${p}`);
});

rotasAuth.get("/google/callback", async (req, res, next) => {
  try {
    if (!config.google.clientId) return res.status(501).json({ erro: "OAuth Google não configurado." });
    const { code } = req.query;
    const respostaToken = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code || ""),
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: `${config.backendUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await respostaToken.json();
    if (!tokens.access_token) throw new ErroNegocio("Falha na autenticação Google.");
    const perfil = await (
      await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
    ).json();

    const email = perfil.email?.toLowerCase();
    if (!email) throw new ErroNegocio("A conta Google não tem email.");

    let user = await prisma.user.findFirst({ where: { OR: [{ googleId: perfil.id }, { email }] } });
    if (!user) {
      user = await transacaoSegura(async (tx) => {
        const base = (perfil.given_name || email.split("@")[0]).replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 18) || "fruta";
        let nome = base;
        for (let i = 0; await tx.user.findUnique({ where: { nome } }); i++) nome = `${base}${i + 2}`;
        const criado = await tx.user.create({
          data: {
            email,
            nome,
            googleId: perfil.id,
            emailVerificado: true, // o Google já verificou o email
            papel: email === config.adminEmail ? "ADMIN" : "UTILIZADOR",
            codigoReferral: novoCodigoReferral(),
          },
        });
        const bonusRegisto = await valorConfig(tx, "BONUS_REGISTO");
        await movimentar(tx, criado.id, "BONUS_REGISTO", bonusRegisto);
        return criado;
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({ where: { id: user.id }, data: { googleId: perfil.id } });
    }

    emitirSessao(res, user);
    res.redirect(config.frontendUrl);
  } catch (e) {
    next(e);
  }
});
