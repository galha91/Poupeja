import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { supabase } from "./lib/supabase";
import { evento } from "./lib/analytics";
import { IconGoogle } from "./EcraAuth";

/* ─── Converter convidado em conta — updateUser mantém o user_id, zero migração ─── */
export default function ModalCriarConta({ local = false, onFechar, onConvertido }) {
  const [nome, setNome]       = useState("");
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [erro, setErro]       = useState("");
  const [loading, setLoading] = useState(false);
  const [feito, setFeito]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function continuarComGoogle() {
    setErro("");
    setGoogleLoading(true);
    evento("sign_up", { method: "convidado_upgrade_google" });
    const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
    try {
      if (local) {
        // Convidado local (sem sessão Supabase): entra/regista com Google normalmente.
        const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
        if (error) throw error;
      } else {
        // Convidado com sessão anónima: liga a identidade Google à MESMA conta
        // (mesmo user_id) — zero migração, tal como o upgrade por email.
        const { error } = await supabase.auth.linkIdentity({ provider: "google", options: { redirectTo } });
        if (error) throw error;
      }
      // A navegação para o Google acontece aqui; ao voltar, a sessão já vem trocada.
    } catch (err) {
      setErro("Não foi possível continuar com o Google agora. Tenta por email.");
      setGoogleLoading(false);
    }
  }

  async function submeter(e) {
    e.preventDefault();
    if (!email.includes("@")) return setErro("Escreve um email válido.");
    if (pass.length < 6)      return setErro("A password precisa de pelo menos 6 caracteres.");
    setErro("");
    setLoading(true);
    try {
      const dadosMeta = { nome: nome.trim() || "Utilizador", ref: (() => { try { return localStorage.getItem("poupeja_ref") || undefined; } catch { return undefined; } })() };
      if (local) {
        // Convidado local (sem sessão Supabase): conta nova por signUp.
        // Os dados locais sobem sozinhos no primeiro login (pull do lib/sync).
        const { data, error } = await supabase.auth.signUp({
          email: email.toLowerCase().trim(),
          password: pass,
          options: { data: dadosMeta, emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
        });
        if (error) throw error;
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          throw new Error("already registered");
        }
      } else {
        const { error } = await supabase.auth.updateUser(
          { email: email.toLowerCase().trim(), password: pass, data: dadosMeta },
          { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined }
        );
        if (error) throw error;
      }
      try { localStorage.setItem("poupeja_conversao_pendente", "1"); } catch {}
      evento("sign_up", { method: "convidado_upgrade" });
      setFeito(true);
      onConvertido?.(nome.trim() || "Utilizador", email.toLowerCase().trim());
    } catch (err) {
      const m = String(err?.message || "").toLowerCase();
      setErro(m.includes("already") || m.includes("registered")
        ? "Já existe uma conta com este email. Sai do modo convidado e entra com ela."
        : "Não foi possível criar a conta agora. Tenta novamente daqui a pouco.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(20,35,28,0.55)" }} onClick={onFechar}>
      <div className="w-full rounded-t-3xl overflow-hidden" style={{ maxHeight: "92vh", overflowY: "auto", background: "var(--pj-card)" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--pj-border)" }} />
        </div>

        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--pj-subtle)" }}>
            <UserPlus size={20} style={{ color: "var(--pj-brand-ink)" }} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.09em]" style={{ color: "var(--pj-text-faint)" }}>Modo convidado</p>
            <p className="font-display text-[17px] font-semibold leading-tight" style={{ color: "var(--pj-text)" }}>Cria a tua conta grátis</p>
          </div>
          <button onClick={onFechar} className="pj-tap ml-auto w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--pj-subtle)" }} aria-label="Fechar">
            <X size={16} style={{ color: "var(--pj-text-muted)" }} />
          </button>
        </div>

        <div className="mx-5" style={{ height: 1, background: "var(--pj-border)" }} />

        {feito ? (
          <div className="px-5 pt-5 pb-9 text-center">
            <p className="font-display text-[17px] font-semibold" style={{ color: "var(--pj-text)" }}>Só falta confirmares o email</p>
            <p className="text-[13px] leading-relaxed mt-2" style={{ color: "var(--pj-text-muted)" }}>
              Enviámos-te um link para <strong style={{ color: "var(--pj-text)" }}>{email}</strong>. Tudo o que fizeste
              como convidado fica guardado nesta conta — não perdes nada.
            </p>
            <button onClick={onFechar} className="pj-tap w-full py-3.5 mt-5 rounded-2xl text-white font-semibold" style={{ background: "var(--pj-brand)" }}>
              Continuar a usar a app
            </button>
          </div>
        ) : (
          <form onSubmit={submeter} className="px-5 pt-4 pb-9 flex flex-col gap-3">
            <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--pj-text-muted)" }}>
              O teu progresso de convidado <strong style={{ color: "var(--pj-text)" }}>passa todo</strong> para a conta.
              E desbloqueias o que é só para membros:
            </p>
            <div className="rounded-2xl px-4 py-3 flex flex-col gap-1.5" style={{ background: "var(--pj-subtle)" }}>
              {["Avisos no telemóvel: gasóleo barato, garantias, contas a vencer", "Dados seguros e sincronizados em todos os dispositivos", "Folhetos da semana no teu email"].map((b, i) => (
                <p key={i} className="text-[12px] font-semibold flex items-start gap-1.5" style={{ color: "var(--pj-text)" }}>
                  <span style={{ color: "var(--pj-brand-ink)" }}>✓</span> {b}
                </p>
              ))}
            </div>
            <button type="button" onClick={continuarComGoogle} disabled={googleLoading}
              className="pj-tap w-full py-3.5 rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2.5"
              /* Fundo branco fixo (marca Google) → tinta e borda fixas também. */
              style={{ background: "#fff", color: "#14231c", border: "1.5px solid #dadce0", opacity: googleLoading ? 0.7 : 1 }}>
              <IconGoogle size={17} /> {googleLoading ? "A abrir o Google…" : "Continuar com Google"}
            </button>
            <div className="flex items-center gap-3 -my-0.5">
              <div style={{ flex: 1, height: 1, background: "var(--pj-border)" }} />
              <span className="text-[11px] font-semibold" style={{ color: "var(--pj-text-faint)" }}>ou por email</span>
              <div style={{ flex: 1, height: 1, background: "var(--pj-border)" }} />
            </div>
            <input type="text" placeholder="O teu nome" value={nome} onChange={e => setNome(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-[14px] focus:outline-none"
              style={{ background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" }} />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl text-[14px] focus:outline-none"
              style={{ background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" }} />
            <input type="password" placeholder="Password (mín. 6 caracteres)" value={pass} onChange={e => setPass(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl text-[14px] focus:outline-none"
              style={{ background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" }} />
            {erro && <p className="text-[12px] font-semibold" style={{ color: "var(--pj-danger)" }}>{erro}</p>}
            <button type="submit" disabled={loading}
              className="pj-tap w-full py-4 rounded-2xl text-white font-semibold text-[15px]"
              style={{ background: "var(--pj-brand)", opacity: loading ? 0.7 : 1 }}>
              {loading ? "A criar a conta…" : "Criar conta e guardar o meu progresso"}
            </button>
            <button type="button" onClick={onFechar} className="pj-tap w-full py-2 font-semibold text-[13px]" style={{ color: "var(--pj-text-faint)" }}>
              Agora não
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

