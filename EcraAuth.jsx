import { useState } from "react";
import Link from "next/link";
import {
  PiggyBank, Receipt, Tag, Fuel, BarChart2, ShieldCheck,
  ArrowRight, ArrowLeft, Eye, EyeOff, Check, AlertCircle, KeyRound,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { evento } from "./lib/analytics";
import BannerInstalar from "./BannerInstalar";
import Onboarding from "./Onboarding";

const FEATURES = [
  { icon: Receipt,     text: "Guarda talões e garantias digitalmente" },
  { icon: BarChart2,   text: "Acompanha quanto já poupaste por mês" },
  { icon: Tag,         text: "Folhetos de todos os supermercados" },
  { icon: Fuel,        text: "Preços de combustível em tempo real" },
];

/* Mensagens de erro do Supabase traduzidas */
function traduzErro(msg = "") {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou password incorretos. Tenta novamente.";
  if (m.includes("email not confirmed"))       return "Confirma primeiro o teu email. Verifica a caixa de entrada (e o spam).";
  if (m.includes("user already registered"))   return "Já existe uma conta com este email. Entra em vez disso.";
  if (m.includes("rate limit"))                return "Demasiadas tentativas. Aguarda uns minutos e tenta de novo.";
  if (m.includes("password should be"))        return "A password precisa de ter pelo menos 6 caracteres.";
  return msg || "Ocorreu um erro. Tenta novamente.";
}

/* ── Campo de input reutilizável ── */
function Campo({ label, type = "text", value, onChange, placeholder, action }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.09em] mb-1.5" style={{ color: "#8a978e" }}>{label}</p>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onInput={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3.5 rounded-2xl border font-medium text-sm placeholder:text-[#8a978e] focus:outline-none focus:border-[#0b6b4f] focus:shadow-[0_0_0_3px_rgba(11,107,79,0.12)] transition-all"
          style={{ background: "#fbfaf6", borderColor: "#e4e2d8", color: "#14231c" }}
        />
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="pj-tap absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center"
            style={{ color: "#8a978e" }}
          >
            {action.icon}
          </button>
        )}
      </div>
    </div>
  );
}

/* Logótipo oficial do Google, para o botão "Continuar com Google" */
export function IconGoogle({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.6 4.6-6 7.9-11.3 7.9-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.1-5.1C33.4 6 28.9 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.1-7.7 19.1-19.1 0-1.3-.1-2.3-.3-3.4z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6 4.4C13.9 15.2 18.6 12 24 12c3 0 5.8 1.1 7.9 3l5.1-5.1C33.4 6 28.9 4 24 4c-7.5 0-14 4.2-17.7 10.7z"/>
      <path fill="#4CAF50" d="M24 44c4.8 0 9.2-1.8 12.5-4.9l-5.8-4.7C28.9 36 26.6 36.8 24 36.8c-5.3 0-9.7-3.4-11.3-8l-6 4.6C9.9 39.6 16.4 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.3-2.2 4.2-4.1 5.6l5.8 4.7C40.5 35 44 30.1 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

async function entrarComGoogle() {
  evento("login", { method: "google_attempt" });
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
  });
}

/* Logótipo oficial do Facebook, para o botão "Continuar com Facebook" */
export function IconFacebook({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#1877F2" d="M24 4C12.95 4 4 12.95 4 24c0 9.98 7.31 18.25 16.87 19.76V29.7h-5.08V24h5.08v-4.34c0-5.02 2.99-7.79 7.56-7.79 2.19 0 4.48.39 4.48.39v4.92h-2.52c-2.49 0-3.26 1.54-3.26 3.13V24h5.55l-.89 5.7h-4.66v14.06C36.69 42.25 44 33.98 44 24c0-11.05-8.95-20-20-20z"/>
    </svg>
  );
}

async function entrarComFacebook() {
  evento("login", { method: "facebook_attempt" });
  await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
  });
}

/* ── Ecrã Landing ── */
function Landing({ onRegister, onLogin, onConvidado, convidadoLoading, convidadoErro }) {
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "#f6f5f0" }}>
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-6 pt-16 pb-8">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
          style={{ background: "#0b6b4f" }}
        >
          <PiggyBank size={38} className="text-white" />
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.09em] mb-2" style={{ color: "#8a978e" }}>
          A tua carteira digital portuguesa
        </p>
        <h1 className="font-display text-4xl text-center leading-tight" style={{ color: "#14231c", fontWeight: 600, letterSpacing: "-0.01em" }}>
          Poupe<span style={{ color: "#0b6b4f" }}>Já</span>
        </h1>

        {/* Features */}
        <div className="mt-6 flex flex-col gap-2.5 w-full max-w-xs">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#eeece4" }}>
                <f.icon size={15} style={{ color: "#0b6b4f" }} />
              </div>
              <p className="font-semibold text-[13px]" style={{ color: "#14231c" }}>{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex-1 px-6 pt-2 flex flex-col gap-3" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem) + 1rem)" }}>
        <p className="text-center text-[11px] font-medium mb-1" style={{ color: "#8a978e" }}>
          Grátis · Sem cartão · Conta válida em qualquer dispositivo
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={entrarComGoogle}
            className="press pj-tap flex-1 py-4 rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2"
            style={{ background: "#fff", color: "#14231c", border: "1.5px solid #e4e2d8" }}
          >
            <IconGoogle size={17} /> Google
          </button>
          <button
            onClick={entrarComFacebook}
            className="press pj-tap flex-1 py-4 rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2"
            style={{ background: "#fff", color: "#14231c", border: "1.5px solid #e4e2d8" }}
          >
            <IconFacebook size={17} /> Facebook
          </button>
        </div>
        <button
          onClick={onConvidado}
          disabled={convidadoLoading}
          className="press pj-tap w-full py-4 rounded-2xl font-semibold text-[14px]"
          style={{ background: "#fbfaf6", color: "#0b6b4f", border: "1.5px dashed #0b6b4f66", opacity: convidadoLoading ? 0.6 : 1 }}
        >
          {convidadoLoading ? "A preparar a tua conta…" : "Espreitar como convidado — sem registo"}
        </button>
        <p className="text-center text-[11px] font-medium -mt-1" style={{ color: "#8a978e" }}>
          Conhece a app primeiro · regista-te quando quiseres
        </p>
        {convidadoErro && (
          <p className="text-center text-[12px] font-semibold" style={{ color: "#cf5a3c" }}>{convidadoErro}</p>
        )}
        <p className="text-center text-[12.5px] font-medium mt-1.5" style={{ color: "#8a978e" }}>
          Preferes email?{" "}
          <button onClick={onRegister} className="press font-semibold underline underline-offset-2" style={{ color: "#0b6b4f" }}>
            Criar conta
          </button>
          {" · "}
          <button onClick={onLogin} className="press font-semibold underline underline-offset-2" style={{ color: "#0b6b4f" }}>
            Já tenho conta
          </button>
        </p>

        <BannerInstalar inline />
      </div>
    </div>
  );
}

/* ── Ecrã Registo ── */
function Registo({ onVoltar }) {
  const [nome, setNome]           = useState("");
  const [email, setEmail]         = useState("");
  const [pass, setPass]           = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [aceitou, setAceitou]     = useState(false);
  const [erro, setErro]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);

  async function submeter(e) {
    e.preventDefault();
    setErro("");
    if (!nome.trim())           return setErro("Escreve o teu nome.");
    if (!email.includes("@"))   return setErro("Escreve um email válido.");
    if (pass.length < 6)        return setErro("A password precisa de ter pelo menos 6 caracteres.");
    if (!aceitou)               return setErro("Tens de aceitar a Política de Privacidade para continuar.");

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: pass,
        options: {
          data: { nome: nome.trim(), ref: (() => { try { return localStorage.getItem("poupeja_ref") || undefined; } catch { return undefined; } })() },
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) throw new Error(traduzErro(error.message));
      // Quando o email já existe, o Supabase devolve user sem identities
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new Error("Já existe uma conta com este email. Entra em vez disso.");
      }
      evento("sign_up", { method: "email" });
      setEmailEnviado(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f6f5f0" }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <button onClick={onVoltar} className="press pj-tap flex items-center gap-1.5 text-sm font-semibold mb-4" style={{ color: "#5c6b62" }}>
          <ArrowLeft size={16} /> Voltar
        </button>
        <p className="text-[11px] font-semibold uppercase tracking-[0.09em]" style={{ color: "#8a978e" }}>Nova conta</p>
        <h2 className="font-display text-2xl mt-0.5" style={{ color: "#14231c", fontWeight: 600 }}>Cria a tua conta</h2>
        <p className="text-[12px] mt-0.5" style={{ color: "#5c6b62" }}>Grátis, sem cartão, sem compromisso.</p>
      </div>

      {emailEnviado ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-2" style={{ background: "#eeece4" }}>
            <ShieldCheck size={36} style={{ color: "#0b6b4f" }} />
          </div>
          <h2 className="font-display text-2xl" style={{ color: "#14231c", fontWeight: 600 }}>Confirma o teu email</h2>
          <p className="text-[14px] leading-relaxed" style={{ color: "#5c6b62" }}>
            Enviámos um email para <strong style={{ color: "#14231c" }}>{email}</strong>.{" "}
            Clica no link para ativar a tua conta.
          </p>
          <div className="rounded-2xl p-3.5 w-full text-left" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
            <p className="text-[12px] leading-relaxed" style={{ color: "#5c6b62" }}>
              Não vês o email? Verifica a pasta de spam ou lixo.
            </p>
          </div>
          <button type="button" onClick={onVoltar} className="press pj-tap text-sm font-semibold mt-2" style={{ color: "#8a978e" }}>
            Voltar ao início
          </button>
        </div>
      ) : (
      <form onSubmit={submeter} className="flex-1 px-5 pt-6 pb-10 flex flex-col gap-4">
        <Campo
          label="O teu nome"
          value={nome}
          onChange={setNome}
          placeholder="Ex: João Silva"
        />
        <Campo
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="exemplo@email.com"
        />
        <Campo
          label="Password"
          type={showPass ? "text" : "password"}
          value={pass}
          onChange={setPass}
          placeholder="Mínimo 6 caracteres"
          action={{
            onClick: () => setShowPass(s => !s),
            icon: showPass ? <EyeOff size={16} /> : <Eye size={16} />,
          }}
        />

        {erro && (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(207,90,60,0.08)", border: "1px solid rgba(207,90,60,0.25)" }}>
            <AlertCircle size={14} className="flex-shrink-0" style={{ color: "#cf5a3c" }} />
            <p className="text-[12px] font-semibold" style={{ color: "#cf5a3c" }}>{erro}</p>
          </div>
        )}

        <div className="rounded-xl p-3 flex gap-2" style={{ background: "#eeece4", border: "1px solid #e4e2d8" }}>
          <ShieldCheck size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#0b6b4f" }} />
          <p className="text-[11px] leading-relaxed" style={{ color: "#5c6b62" }}>
            A tua conta fica guardada em segurança e funciona em qualquer dispositivo.
          </p>
        </div>

        {/* Checkbox privacidade */}
        <label className="flex items-start gap-3 cursor-pointer">
          <button
            type="button"
            onClick={() => setAceitou(a => !a)}
            className="pj-tap w-5 h-5 rounded-md flex-shrink-0 mt-0.5 flex items-center justify-center transition-all"
            style={{
              background: aceitou ? "#0b6b4f" : "#fbfaf6",
              border: aceitou ? "2px solid #0b6b4f" : "2px solid #e4e2d8",
            }}
          >
            {aceitou && <Check size={12} className="text-white" strokeWidth={3} />}
          </button>
          <p className="text-[12px] leading-relaxed" style={{ color: "#5c6b62" }}>
            Li e aceito a{" "}
            <Link href="/privacidade" target="_blank" className="pj-tap font-semibold underline underline-offset-2" style={{ color: "#0b6b4f" }}>
              Política de Privacidade
            </Link>
            .
          </p>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="press pj-tap w-full py-4 rounded-2xl text-white font-semibold text-[15px] flex items-center justify-center gap-2 mt-2"
          style={{ background: "#0b6b4f", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "A criar conta..." : <>Criar conta <ArrowRight size={17} /></>}
        </button>
      </form>
      )}
    </div>
  );
}

/* ── Ecrã Recuperar Password ── */
function RecuperarPass({ onVoltar }) {
  const [email, setEmail]     = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro]       = useState("");
  const [loading, setLoading] = useState(false);

  async function submeter(e) {
    e.preventDefault();
    setErro("");
    if (!email.includes("@")) return setErro("Escreve um email válido.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      });
      if (error) throw new Error(traduzErro(error.message));
      setEnviado(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f6f5f0" }}>
      <div className="px-4 pt-12 pb-6">
        <button onClick={onVoltar} className="press pj-tap flex items-center gap-1.5 text-sm font-semibold mb-4" style={{ color: "#5c6b62" }}>
          <ArrowLeft size={16} /> Voltar
        </button>
        <p className="text-[11px] font-semibold uppercase tracking-[0.09em]" style={{ color: "#8a978e" }}>Recuperar acesso</p>
        <h2 className="font-display text-2xl mt-0.5" style={{ color: "#14231c", fontWeight: 600 }}>Esqueceu a password?</h2>
        <p className="text-[12px] mt-0.5" style={{ color: "#5c6b62" }}>
          Enviamos-te um link por email para definires uma nova.
        </p>
      </div>

      {enviado ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-2" style={{ background: "#eeece4" }}>
            <ShieldCheck size={36} style={{ color: "#0b6b4f" }} />
          </div>
          <h2 className="font-display text-2xl" style={{ color: "#14231c", fontWeight: 600 }}>Verifica o teu email</h2>
          <p className="text-[14px] leading-relaxed" style={{ color: "#5c6b62" }}>
            Se existir uma conta com <strong style={{ color: "#14231c" }}>{email}</strong>,{" "}
            vais receber um link para definir uma nova password.
          </p>
          <button type="button" onClick={onVoltar} className="press pj-tap text-sm font-semibold mt-2" style={{ color: "#8a978e" }}>
            Voltar ao login
          </button>
        </div>
      ) : (
        <form onSubmit={submeter} className="flex-1 px-5 pt-6 pb-10 flex flex-col gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#eeece4" }}>
            <KeyRound size={26} style={{ color: "#0b6b4f" }} />
          </div>

          <Campo
            label="Email da conta"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="exemplo@email.com"
          />

          {erro && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(207,90,60,0.08)", border: "1px solid rgba(207,90,60,0.25)" }}>
              <AlertCircle size={14} className="flex-shrink-0" style={{ color: "#cf5a3c" }} />
              <p className="text-[12px] font-semibold" style={{ color: "#cf5a3c" }}>{erro}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="press pj-tap w-full py-4 rounded-2xl text-white font-semibold text-[15px] flex items-center justify-center gap-2 mt-2"
            style={{ background: "#0b6b4f", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "A enviar..." : <>Enviar link <ArrowRight size={17} /></>}
          </button>
        </form>
      )}
    </div>
  );
}

/* ── Ecrã Definir Nova Password (após clicar no link de recuperação) ── */
export function DefinirNovaPass({ onConcluido }) {
  const [novaPass, setNovaPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [erro, setErro]         = useState("");
  const [loading, setLoading]   = useState(false);

  async function submeter(e) {
    e.preventDefault();
    setErro("");
    if (novaPass.length < 6) return setErro("A password precisa de ter pelo menos 6 caracteres.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaPass });
      if (error) throw new Error(traduzErro(error.message));
      onConcluido();
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f6f5f0" }}>
      <div className="px-4 pt-12 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.09em]" style={{ color: "#8a978e" }}>Recuperar acesso</p>
        <h2 className="font-display text-2xl mt-0.5" style={{ color: "#14231c", fontWeight: 600 }}>Define a nova password</h2>
        <p className="text-[12px] mt-0.5" style={{ color: "#5c6b62" }}>Escolhe uma password segura para a tua conta.</p>
      </div>

      <form onSubmit={submeter} className="flex-1 px-5 pt-6 pb-10 flex flex-col gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#eeece4" }}>
          <KeyRound size={26} style={{ color: "#0b6b4f" }} />
        </div>

        <Campo
          label="Nova password"
          type={showPass ? "text" : "password"}
          value={novaPass}
          onChange={setNovaPass}
          placeholder="Mínimo 6 caracteres"
          action={{
            onClick: () => setShowPass(s => !s),
            icon: showPass ? <EyeOff size={16} /> : <Eye size={16} />,
          }}
        />

        {erro && (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(207,90,60,0.08)", border: "1px solid rgba(207,90,60,0.25)" }}>
            <AlertCircle size={14} className="flex-shrink-0" style={{ color: "#cf5a3c" }} />
            <p className="text-[12px] font-semibold" style={{ color: "#cf5a3c" }}>{erro}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="press pj-tap w-full py-4 rounded-2xl text-white font-semibold text-[15px] flex items-center justify-center gap-2 mt-2"
          style={{ background: "#0b6b4f", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "A guardar..." : <>Guardar nova password <ArrowRight size={17} /></>}
        </button>
      </form>
    </div>
  );
}

/* ── Ecrã Login ── */
function Login({ onVoltar, onAuth, onEsqueceu }) {
  const [email, setEmail]       = useState("");
  const [pass, setPass]         = useState("");
  const [showPass, setShowPass] = useState(false);
  const [erro, setErro]         = useState("");
  const [loading, setLoading]   = useState(false);

  async function submeter(e) {
    e.preventDefault();
    setErro("");
    if (!email || !pass) return setErro("Preenche o email e a password.");

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: pass,
      });
      if (error) throw new Error(traduzErro(error.message));
      const u = data.user;
      evento("login", { method: "email" });
      onAuth({
        nome: u.user_metadata?.nome || u.email.split("@")[0],
        email: u.email,
        criado: u.created_at,
      });
    } catch (err) {
      setErro(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f6f5f0" }}>
      <div className="px-4 pt-12 pb-6">
        <button onClick={onVoltar} className="press pj-tap flex items-center gap-1.5 text-sm font-semibold mb-4" style={{ color: "#5c6b62" }}>
          <ArrowLeft size={16} /> Voltar
        </button>
        <p className="text-[11px] font-semibold uppercase tracking-[0.09em]" style={{ color: "#8a978e" }}>Bem-vindo de volta</p>
        <h2 className="font-display text-2xl mt-0.5" style={{ color: "#14231c", fontWeight: 600 }}>Entrar na conta</h2>
        <p className="text-[12px] mt-0.5" style={{ color: "#5c6b62" }}>Usa as credenciais que criaste.</p>
      </div>

      <form onSubmit={submeter} className="flex-1 px-5 pt-6 pb-10 flex flex-col gap-4">
        <Campo
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="exemplo@email.com"
        />
        <Campo
          label="Password"
          type={showPass ? "text" : "password"}
          value={pass}
          onChange={setPass}
          placeholder="A tua password"
          action={{
            onClick: () => setShowPass(s => !s),
            icon: showPass ? <EyeOff size={16} /> : <Eye size={16} />,
          }}
        />

        {erro && (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(207,90,60,0.08)", border: "1px solid rgba(207,90,60,0.25)" }}>
            <AlertCircle size={14} className="flex-shrink-0" style={{ color: "#cf5a3c" }} />
            <p className="text-[12px] font-semibold" style={{ color: "#cf5a3c" }}>{erro}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="press pj-tap w-full py-4 rounded-2xl text-white font-semibold text-[15px] flex items-center justify-center gap-2 mt-2"
          style={{ background: "#0b6b4f", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "A entrar..." : <>Entrar <ArrowRight size={17} /></>}
        </button>

        <button
          type="button"
          onClick={onEsqueceu}
          className="press pj-tap text-center text-sm font-semibold mt-1 py-1"
          style={{ color: "#0b6b4f" }}
        >
          Esqueceu a palavra-passe?
        </button>
      </form>
    </div>
  );
}

/* ── Export principal ── */
export default function EcraAuth({ onAuth }) {
  const [convidadoLoading, setConvidadoLoading] = useState(false);
  const [convidadoErro, setConvidadoErro] = useState("");

  /* Modo convidado: conta anónima Supabase — o user_id fica desde já e
     mantém-se quando a pessoa se registar (updateUser), sem migrar dados. */
  async function entrarConvidado() {
    setConvidadoErro("");
    setConvidadoLoading(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously({
        options: { data: { nome: "Convidado" } },
      });
      if (error) throw error;
      evento("login", { method: "convidado" });
      const u = data.user;
      onAuth({ id: u.id, nome: "Convidado", email: null, criado: u.created_at, convidado: true });
    } catch (_) {
      // Fallback: convidado LOCAL (sem Supabase). Os dados vivem no
      // localStorage e sobem para a conta quando a pessoa se registar —
      // o pull() do lib/sync.js envia as chaves locais para contas novas.
      try { localStorage.setItem("poupeja_convidado_local", "1"); } catch {}
      evento("login", { method: "convidado_local" });
      onAuth({ id: null, nome: "Convidado", email: null, criado: new Date().toISOString(), convidado: true, local: true });
    } finally {
      setConvidadoLoading(false);
    }
  }

  // Onboarding só na 1ª visita (EcraAuth renderiza apenas no cliente)
  const [ecra, setEcra] = useState(() => {
    try {
      if (typeof window !== "undefined" && !localStorage.getItem("poupeja_onboarding_v1")) return "onboarding";
    } catch {}
    return "landing";
  });

  function concluirOnboarding() {
    try { localStorage.setItem("poupeja_onboarding_v1", "1"); } catch {}
    setEcra("landing");
  }

  if (ecra === "onboarding") return <Onboarding onConcluido={concluirOnboarding} />;
  if (ecra === "registo")   return <Registo      onVoltar={() => setEcra("landing")} />;
  if (ecra === "login")     return <Login        onVoltar={() => setEcra("landing")} onAuth={onAuth} onEsqueceu={() => setEcra("recuperar")} />;
  if (ecra === "recuperar") return <RecuperarPass onVoltar={() => setEcra("login")} />;
  return (
    <Landing
      onRegister={() => setEcra("registo")}
      onLogin={() => setEcra("login")}
      onConvidado={entrarConvidado}
      convidadoLoading={convidadoLoading}
      convidadoErro={convidadoErro}
    />
  );
}

/* ── Helpers de sessão Supabase ── */
export function sessionParaUser(session) {
  if (!session?.user) return null;
  const u = session.user;
  return {
    id: u.id,
    nome: u.is_anonymous ? "Convidado" : (u.user_metadata?.nome || (u.email ? u.email.split("@")[0] : "Utilizador")),
    email: u.email,
    criado: u.created_at,
    convidado: !!u.is_anonymous,
  };
}
