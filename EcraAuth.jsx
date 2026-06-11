import { useState } from "react";
import Link from "next/link";
import {
  PiggyBank, Receipt, Tag, Fuel, BarChart2, ShieldCheck,
  ArrowRight, ArrowLeft, Eye, EyeOff, Check, AlertCircle, KeyRound,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import BannerInstalar from "./BannerInstalar";

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
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-100 bg-white text-slate-800 font-semibold text-sm placeholder:text-slate-300 focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.1)] transition-all"
        />
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400"
          >
            {action.icon}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Ecrã Landing ── */
function Landing({ onRegister, onLogin }) {
  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      {/* Hero verde */}
      <div
        className="flex flex-col items-center justify-center px-6 pt-12 pb-6 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg,#064e3b 0%,#059669 55%,#34d399 100%)" }}
      >
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -left-8 bottom-0 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />

        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 relative z-10"
          style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.3)" }}
        >
          <PiggyBank size={38} className="text-white" />
        </div>

        <h1 className="text-4xl font-black text-white text-center leading-tight relative z-10">
          Poupe<span className="text-emerald-200">Já</span>
        </h1>
        <p className="text-white/75 text-center mt-2 text-[15px] font-medium relative z-10">
          A tua carteira digital portuguesa
        </p>

        {/* Features */}
        <div className="mt-5 flex flex-col gap-2.5 w-full max-w-xs relative z-10">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <f.icon size={15} className="text-white" />
              </div>
              <p className="text-white/90 font-semibold text-[13px]">{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-4 px-6 pt-8 flex flex-col gap-3" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem) + 1rem)" }}>
        <p className="text-center text-slate-400 text-[11px] font-medium mb-1">
          Grátis · Sem cartão · Conta válida em qualquer dispositivo
        </p>
        <button
          onClick={onRegister}
          className="press w-full py-4 rounded-2xl text-white font-black text-[15px] flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#064e3b,#059669)", boxShadow: "0 10px 28px -8px rgba(5,150,105,0.5)" }}
        >
          Criar conta gratuita <ArrowRight size={18} />
        </button>
        <button
          onClick={onLogin}
          className="press w-full py-4 rounded-2xl font-black text-[13px] text-slate-600 bg-slate-100 border border-slate-200"
        >
          Já tenho conta — Entrar
        </button>

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
          data: { nome: nome.trim() },
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) throw new Error(traduzErro(error.message));
      // Quando o email já existe, o Supabase devolve user sem identities
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new Error("Já existe uma conta com este email. Entra em vez disso.");
      }
      setEmailEnviado(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#064e3b,#059669)" }}
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <button onClick={onVoltar} className="press flex items-center gap-1.5 text-white/70 text-sm font-bold mb-4">
          <ArrowLeft size={16} /> Voltar
        </button>
        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Nova conta</p>
        <h2 className="text-2xl font-black text-white mt-0.5">Cria a tua conta</h2>
        <p className="text-white/60 text-[12px] mt-0.5">Grátis, sem cartão, sem compromisso.</p>
      </div>

      {emailEnviado ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-2"
               style={{ background: "#f0fdf4", border: "2px solid #bbf7d0" }}>
            <ShieldCheck size={36} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Confirma o teu email</h2>
          <p className="text-[14px] text-slate-500 leading-relaxed">
            Enviámos um email para <strong className="text-slate-700">{email}</strong>.{" "}
            Clica no link para ativar a tua conta.
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3.5 w-full text-left">
            <p className="text-[12px] text-amber-700 leading-relaxed">
              Não vês o email? Verifica a pasta de spam ou lixo.
            </p>
          </div>
          <button type="button" onClick={onVoltar} className="text-sm text-slate-400 font-semibold mt-2">
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
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
            <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
            <p className="text-[12px] font-bold text-red-600">{erro}</p>
          </div>
        )}

        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex gap-2">
          <ShieldCheck size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-emerald-700 leading-relaxed">
            A tua conta fica guardada em segurança e funciona em qualquer dispositivo.
          </p>
        </div>

        {/* Checkbox privacidade */}
        <label className="flex items-start gap-3 cursor-pointer">
          <button
            type="button"
            onClick={() => setAceitou(a => !a)}
            className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
              aceitou ? "bg-emerald-500 border-emerald-500" : "border-slate-300 bg-white"
            }`}
          >
            {aceitou && <Check size={12} className="text-white" strokeWidth={3} />}
          </button>
          <p className="text-[12px] text-slate-500 leading-relaxed">
            Li e aceito a{" "}
            <Link href="/privacidade" target="_blank" className="text-emerald-600 font-bold underline underline-offset-2">
              Política de Privacidade
            </Link>
            .
          </p>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="press w-full py-4 rounded-2xl text-white font-black text-[15px] flex items-center justify-center gap-2 mt-2"
          style={{ background: "linear-gradient(135deg,#064e3b,#059669)", boxShadow: "0 8px 20px -8px rgba(5,150,105,0.45)", opacity: loading ? 0.7 : 1 }}
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div
        className="px-4 pt-12 pb-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb)" }}
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <button onClick={onVoltar} className="press flex items-center gap-1.5 text-white/70 text-sm font-bold mb-4">
          <ArrowLeft size={16} /> Voltar
        </button>
        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Recuperar acesso</p>
        <h2 className="text-2xl font-black text-white mt-0.5">Esqueceu a password?</h2>
        <p className="text-white/60 text-[12px] mt-0.5">
          Enviamos-te um link por email para definires uma nova.
        </p>
      </div>

      {enviado ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-2"
               style={{ background: "#f0fdf4", border: "2px solid #bbf7d0" }}>
            <ShieldCheck size={36} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Verifica o teu email</h2>
          <p className="text-[14px] text-slate-500 leading-relaxed">
            Se existir uma conta com <strong className="text-slate-700">{email}</strong>,{" "}
            vais receber um link para definir uma nova password.
          </p>
          <button type="button" onClick={onVoltar} className="text-sm text-slate-400 font-semibold mt-2">
            Voltar ao login
          </button>
        </div>
      ) : (
        <form onSubmit={submeter} className="flex-1 px-5 pt-6 pb-10 flex flex-col gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <KeyRound size={26} className="text-blue-500" />
          </div>

          <Campo
            label="Email da conta"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="exemplo@email.com"
          />

          {erro && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
              <p className="text-[12px] font-bold text-red-600">{erro}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="press w-full py-4 rounded-2xl text-white font-black text-[15px] flex items-center justify-center gap-2 mt-2"
            style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb)", boxShadow: "0 8px 20px -8px rgba(37,99,235,0.4)", opacity: loading ? 0.7 : 1 }}
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div
        className="px-4 pt-12 pb-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb)" }}
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Recuperar acesso</p>
        <h2 className="text-2xl font-black text-white mt-0.5">Define a nova password</h2>
        <p className="text-white/60 text-[12px] mt-0.5">Escolhe uma password segura para a tua conta.</p>
      </div>

      <form onSubmit={submeter} className="flex-1 px-5 pt-6 pb-10 flex flex-col gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <KeyRound size={26} className="text-blue-500" />
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
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
            <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
            <p className="text-[12px] font-bold text-red-600">{erro}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="press w-full py-4 rounded-2xl text-white font-black text-[15px] flex items-center justify-center gap-2 mt-2"
          style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb)", boxShadow: "0 8px 20px -8px rgba(37,99,235,0.4)", opacity: loading ? 0.7 : 1 }}
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div
        className="px-4 pt-12 pb-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb)" }}
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <button onClick={onVoltar} className="press flex items-center gap-1.5 text-white/70 text-sm font-bold mb-4">
          <ArrowLeft size={16} /> Voltar
        </button>
        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Bem-vindo de volta</p>
        <h2 className="text-2xl font-black text-white mt-0.5">Entrar na conta</h2>
        <p className="text-white/60 text-[12px] mt-0.5">Usa as credenciais que criaste.</p>
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
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
            <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
            <p className="text-[12px] font-bold text-red-600">{erro}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="press w-full py-4 rounded-2xl text-white font-black text-[15px] flex items-center justify-center gap-2 mt-2"
          style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb)", boxShadow: "0 8px 20px -8px rgba(37,99,235,0.4)", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "A entrar..." : <>Entrar <ArrowRight size={17} /></>}
        </button>

        <button
          type="button"
          onClick={onEsqueceu}
          className="press text-center text-sm text-blue-600 font-bold mt-1 py-1"
        >
          Esqueceu a palavra-passe?
        </button>
      </form>
    </div>
  );
}

/* ── Export principal ── */
export default function EcraAuth({ onAuth }) {
  const [ecra, setEcra] = useState("landing"); // "landing" | "registo" | "login" | "recuperar"

  if (ecra === "registo")   return <Registo      onVoltar={() => setEcra("landing")} />;
  if (ecra === "login")     return <Login        onVoltar={() => setEcra("landing")} onAuth={onAuth} onEsqueceu={() => setEcra("recuperar")} />;
  if (ecra === "recuperar") return <RecuperarPass onVoltar={() => setEcra("login")} />;
  return <Landing onRegister={() => setEcra("registo")} onLogin={() => setEcra("login")} />;
}

/* ── Helpers de sessão Supabase ── */
export function sessionParaUser(session) {
  if (!session?.user) return null;
  const u = session.user;
  return {
    nome: u.user_metadata?.nome || (u.email ? u.email.split("@")[0] : "Utilizador"),
    email: u.email,
    criado: u.created_at,
  };
}
