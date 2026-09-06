import { useState, useEffect } from "react";
import {
  Fuel, MapPin, Bell, ShieldCheck, Info,
  ChevronRight, Check, ArrowLeft, Heart, FileText, Mail,
  PiggyBank, LogOut, BellRing, BellOff, Moon, Share2,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { partilharApp } from "./lib/partilhar";

const SUPERMERCADOS = ["Continente","Pingo Doce","Lidl","Aldi","Intermarché","Auchan","Minipreço"];
const COMBUSTIVEIS  = ["Gasolina 95","Gasóleo","GPL"];

const LABEL_STYLE = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color: "var(--pj-text-faint)",
};

const PREFS_OMISSAO = {
  nome: "", email: "", combustivel: "Gasolina 95",
  distancia: 10, favoritos: ["Continente","Pingo Doce"],
  avisoGarantias: true, avisoPrecos: true, diasGarantia: 60,
  emailSemanal: true,
};

/* As prefs guardadas são MISTURADAS com as de omissão, não usadas como
   estão. Sem isto, um objeto parcial parte o ecrã todo: quem cancela o
   email semanal sem nunca ter aberto as Definições fica com apenas
   { emailSemanal: false } gravado (ver pages/api/unsubscribe.js), o sync
   traz isso para o telemóvel, e depois prefs.favoritos.includes() rebenta. */
function lerPrefs() {
  try {
    const raw = localStorage.getItem("poupeja_prefs");
    if (raw) {
      const guardadas = JSON.parse(raw);
      if (guardadas && typeof guardadas === "object") {
        return { ...PREFS_OMISSAO, ...guardadas };
      }
    }
  } catch (_) {}
  return { ...PREFS_OMISSAO };
}

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="w-12 h-7 rounded-full relative transition-colors flex-shrink-0"
      style={{ background: on ? "var(--pj-brand)" : "var(--pj-border)" }}
    >
      <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}

function Section({ label, children }) {
  return (
    <div className="mb-9">
      <p className="px-5 mb-3" style={LABEL_STYLE}>{label}</p>
      <div
        className="mx-4"
        style={{ borderTop: "1px solid var(--pj-border)", borderBottom: "1px solid var(--pj-border)" }}
      >
        {children}
      </div>
    </div>
  );
}

function Row({ border = true, children }) {
  return (
    <div className="px-1 py-4" style={border ? { borderBottom: "1px solid var(--pj-subtle)" } : undefined}>
      {children}
    </div>
  );
}

function IconChip({ active = false, children }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: active ? "var(--pj-brand)" : "var(--pj-subtle)" }}
    >
      {children}
    </div>
  );
}

export default function SecaoDefinicoes({ user, onLogout, onVoltar, onCriarConta }) {
  const [prefs, setPrefs]   = useState(lerPrefs);
  const [saved, setSaved]   = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado]   = useState(false);
  const [modalTermos, setModalTermos] = useState(false);
  const [modalSobre, setModalSobre]   = useState(false);
  const [feedbackConvite, setFeedbackConvite] = useState("");

  async function convidar() {
    const r = await partilharApp();
    if (!r) return; // cancelado ou sem suporte — não dizer nada
    setFeedbackConvite(r === "copiado" ? "Link copiado ✓" : "Obrigado! 💚");
    setTimeout(() => setFeedbackConvite(""), 2500);
  }

  // Push notifications
  const [pushEstado, setPushEstado] = useState("a-verificar"); // a-verificar | inativo | ativo | sem-suporte
  const [pushLoading, setPushLoading] = useState(false);

  const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID_PUBLIC) {
      setPushEstado("sem-suporte");
      return;
    }
    if (Notification.permission === "denied") { setPushEstado("bloqueado"); return; }
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => {
        if (sub) { setPushEstado("ativo"); return; }
        // Permissão já concedida mas sem subscrição — subscreve automaticamente
        // (nunca para convidados: abriria o modal de conta sem interação)
        if (Notification.permission === "granted" && !user?.convidado) {
          ativarPush();
        } else {
          setPushEstado("inativo");
        }
      })
    ).catch(() => setPushEstado("inativo"));
  }, [VAPID_PUBLIC]);

  async function ativarPush() {
    if (user?.convidado) { onCriarConta?.(); return; } // exclusivo de contas registadas
    if (!VAPID_PUBLIC) return;
    setPushLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setPushEstado("bloqueado"); setPushLoading(false); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetch("/api/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ subscription: sub }),
        });
      }
      setPushEstado("ativo");
    } catch (e) {
      console.error("Push subscribe error:", e);
    }
    setPushLoading(false);
  }

  async function desativarPush() {
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await fetch("/api/push-subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }
        await sub.unsubscribe();
      }
      setPushEstado("inativo");
    } catch (e) {
      console.error("Push unsubscribe error:", e);
    }
    setPushLoading(false);
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
  }

  async function enviarEmailSemanal() {
    if (!user?.email) return;
    setEnviando(true);
    try {
      await fetch("/api/email-semanal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, nome: user.nome }),
      });
      setEnviado(true);
      setTimeout(() => setEnviado(false), 4000);
    } catch {}
    setEnviando(false);
  }

  useEffect(() => {
    try { localStorage.setItem("poupeja_prefs", JSON.stringify(prefs)); } catch (_) {}
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 1500);
    return () => clearTimeout(t);
  }, [prefs]);

  const set = (k, v) => setPrefs(p => ({ ...p, [k]: v }));
  const toggleFav = s => setPrefs(p => ({
    ...p,
    favoritos: (p.favoritos || []).includes(s)
      ? (p.favoritos || []).filter(x => x !== s)
      : [...(p.favoritos || []), s],
  }));

  const inicial = (user?.nome || user?.email || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="pb-28 pt-4" style={{ background: "var(--pj-surface)", minHeight: "100vh" }}>

      <button
        onClick={onVoltar}
        className="press pj-tap mx-4 mb-6 flex items-center gap-1.5 text-sm font-semibold"
        style={{ color: "var(--pj-text-faint)" }}
      >
        <ArrowLeft size={15} /> Voltar
      </button>

      {/* Cabeçalho editorial do perfil */}
      <div className="mx-4 mb-8 flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--pj-brand)" }}
        >
          <span className="font-display text-2xl text-white leading-none">{inicial}</span>
        </div>
        <div className="min-w-0">
          <p style={LABEL_STYLE}>Conta</p>
          <p className="font-display text-2xl leading-tight truncate" style={{ color: "var(--pj-text)" }}>
            {user?.nome || "O teu perfil"}
          </p>
          <p className="text-sm mt-0.5 truncate" style={{ color: "var(--pj-text-muted)" }}>{user?.convidado ? "Modo convidado" : (user?.email || "")}</p>
        </div>
      </div>

      {/* Convidado → convite a criar conta */}
      {user?.convidado && (
        <button
          onClick={onCriarConta}
          className="pj-tap press mx-4 mb-8 w-[calc(100%-2rem)] text-left rounded-2xl px-4 py-3.5 flex items-center gap-3"
          style={{ background: "var(--pj-brand-wash)", border: "1.5px dashed var(--pj-brand-soft)" }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--pj-brand)" }}>
            <Heart size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold" style={{ color: "var(--pj-text)" }}>Cria a tua conta grátis</p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--pj-text-muted)" }}>Guarda o teu progresso e desbloqueia avisos, sincronização e email semanal</p>
          </div>
          <ChevronRight size={16} style={{ color: "var(--pj-brand-ink)" }} />
        </button>
      )}

      {/* Guardado */}
      {saved && (
        <div className="mx-4 mb-6 flex items-center gap-2 anim-up">
          <Check size={13} style={{ color: "var(--pj-brand-ink)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--pj-brand-ink)" }}>Guardado automaticamente</span>
        </div>
      )}

      {/* Conta */}
      <Section label="Conta">
        <Row border={false}>
          <button
            onClick={onLogout}
            className="press pj-tap w-full flex items-center justify-between"
            style={{ color: "#a2432a" }}
          >
            <div className="flex items-center gap-2.5">
              <LogOut size={17} />
              <p className="text-sm font-semibold">Sair da conta</p>
            </div>
            <ChevronRight size={15} style={{ color: "#c8b5ac" }} />
          </button>
        </Row>
      </Section>

      {/* Preferências */}
      <Section label="Preferências">
        <Row>
          <div className="flex items-center gap-2 mb-3">
            <Fuel size={15} style={{ color: "var(--pj-brand-ink)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--pj-text)" }}>Combustível habitual</p>
          </div>
          <div className="flex gap-2">
            {COMBUSTIVEIS.map(c => {
              const ativo = prefs.combustivel === c;
              return (
                <button
                  key={c}
                  onClick={() => set("combustivel", c)}
                  className="press pj-tap flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={ativo
                    ? { background: "var(--pj-brand)", color: "#fff" }
                    : { background: "var(--pj-subtle)", color: "var(--pj-text-muted)" }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Row>

        <Row>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin size={15} style={{ color: "var(--pj-brand-ink)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--pj-text)" }}>Distância máxima</p>
            </div>
            <span className="text-sm font-semibold" style={{ color: "var(--pj-brand-ink)" }}>{prefs.distancia} km</span>
          </div>
          <input
            type="range" min="1" max="50" value={prefs.distancia}
            onChange={e => set("distancia", parseInt(e.target.value))}
            className="w-full"
            style={{ accentColor: "#0b6b4f" }}
          />
        </Row>

        <Row border={false}>
          <div className="flex items-center gap-2 mb-3">
            <Heart size={15} style={{ color: "var(--pj-brand-ink)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--pj-text)" }}>Supermercados favoritos</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUPERMERCADOS.map(s => {
              const ativo = (prefs.favoritos || []).includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleFav(s)}
                  className="press pj-tap px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1"
                  style={ativo
                    ? { background: "var(--pj-brand)", color: "#fff" }
                    : { background: "var(--pj-subtle)", color: "var(--pj-text-muted)" }}
                >
                  {ativo && <Check size={10} />} {s}
                </button>
              );
            })}
          </div>
        </Row>
      </Section>

      {/* Avisos */}
      <Section label="Avisos e notificações">
        <Row>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={17} style={{ color: "var(--pj-text-muted)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--pj-text)" }}>Avisos de garantias</p>
            </div>
            <Toggle on={prefs.avisoGarantias} onChange={v => set("avisoGarantias", v)} />
          </div>
        </Row>
        <Row>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell size={17} style={{ color: "var(--pj-text-muted)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--pj-text)" }}>Avisos de preços</p>
            </div>
            <Toggle on={prefs.avisoPrecos} onChange={v => set("avisoPrecos", v)} />
          </div>
        </Row>
        <Row border={false}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold" style={{ color: "var(--pj-text)" }}>Avisar com antecedência</p>
            <span className="text-sm font-semibold" style={{ color: "var(--pj-brand-ink)" }}>{prefs.diasGarantia} dias</span>
          </div>
          <input
            type="range" min="15" max="120" step="15" value={prefs.diasGarantia}
            onChange={e => set("diasGarantia", parseInt(e.target.value))}
            className="w-full"
            style={{ accentColor: "#0b6b4f" }}
          />
        </Row>
      </Section>

      {/* Notificações Push */}
      <Section label="Notificações push">
        <Row border={false}>
          <div className="flex items-start gap-3">
            <IconChip active={pushEstado === "ativo"}>
              {pushEstado === "ativo"
                ? <BellRing size={18} className="text-white" />
                : <BellOff size={18} style={{ color: "var(--pj-text-faint)" }} />
              }
            </IconChip>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "var(--pj-text)" }}>Folhetos no ecrã bloqueado</p>
              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "var(--pj-text-faint)" }}>
                {pushEstado === "ativo"
                  ? "Notificações ativas. Avisamos quando saem folhetos novos."
                  : pushEstado === "bloqueado"
                  ? "Notificações bloqueadas no browser. Permite nas definições do browser."
                  : pushEstado === "sem-suporte"
                  ? "O teu browser não suporta notificações push. No iOS, instala o site no ecrã inicial."
                  : "Recebe uma notificação quando saem os folhetos da semana."
                }
              </p>
              {pushEstado !== "sem-suporte" && pushEstado !== "bloqueado" && (
                <button
                  onClick={pushEstado === "ativo" ? desativarPush : ativarPush}
                  disabled={pushLoading || pushEstado === "a-verificar"}
                  className="press pj-tap mt-3 w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  style={pushEstado === "ativo"
                    ? { background: "var(--pj-subtle)", color: "var(--pj-text-muted)" }
                    : { background: "var(--pj-brand)", color: "#fff" }}
                >
                  {pushLoading ? "A processar…"
                    : pushEstado === "ativo"
                    ? <><BellOff size={13} /> Desativar notificações</>
                    : <><BellRing size={13} /> Ativar notificações</>
                  }
                </button>
              )}
            </div>
          </div>
        </Row>
      </Section>

      {/* Aparência */}
      <Section label="Aparência">
        <Row border={false}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Moon size={17} style={{ color: "var(--pj-text-muted)" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--pj-text)" }}>Modo escuro</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--pj-text-faint)" }}>Mais confortável à noite e poupa bateria.</p>
              </div>
            </div>
            <Toggle
              on={prefs.temaEscuro === true}
              onChange={v => {
                set("temaEscuro", v);
                if (typeof document !== "undefined") document.documentElement.classList.toggle("dark", v);
              }}
            />
          </div>
        </Row>
      </Section>

      {/* Email */}
      <Section label="Email semanal">
        <Row>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Mail size={17} style={{ color: "var(--pj-text-muted)" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--pj-text)" }}>Resumo automático semanal</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--pj-text-faint)" }}>Todas as quintas, com os folhetos da semana.</p>
              </div>
            </div>
            <Toggle on={!user?.convidado && prefs.emailSemanal !== false} onChange={v => { if (user?.convidado) { onCriarConta?.(); return; } set("emailSemanal", v); }} />
          </div>
        </Row>
        <Row border={false}>
          <div className="flex items-start gap-3">
            <IconChip>
              <Mail size={18} style={{ color: "var(--pj-brand-ink)" }} />
            </IconChip>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "var(--pj-text)" }}>Enviar agora</p>
              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "var(--pj-text-faint)" }}>Recebe já um resumo com todos os folhetos ativos.</p>
              <button
                onClick={enviarEmailSemanal}
                disabled={enviando || enviado}
                className="press pj-tap mt-3 w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                style={enviado
                  ? { background: "var(--pj-subtle)", color: "var(--pj-brand-ink)" }
                  : { background: "var(--pj-brand)", color: "#fff" }}
              >
                {enviando ? "A enviar…" : enviado ? <><Check size={13} /> Enviado!</> : <><Mail size={13} /> Enviar para {user?.email}</>}
              </button>
            </div>
          </div>
        </Row>
      </Section>

      {/* Convidar — a única partilha que não está agarrada a um número */}
      <Section label="Espalhar a palavra">
        <Row border={false}>
          <button onClick={convidar} className="press pj-tap w-full flex items-center justify-between text-left">
            <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-3">
              <Share2 size={17} className="flex-shrink-0" style={{ color: "var(--pj-brand-ink)" }} />
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--pj-text)" }}>
                  {feedbackConvite || "Convidar amigos"}
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--pj-text-muted)" }}>
                  Manda o PoupeJá a quem também quer poupar
                </p>
              </div>
            </div>
            <ChevronRight size={15} className="flex-shrink-0" style={{ color: "#c9cec7" }} />
          </button>
        </Row>
      </Section>

      {/* Sobre */}
      <Section label="Sobre">
        <Row>
          <button onClick={() => setModalSobre(true)} className="press pj-tap w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Heart size={17} style={{ color: "var(--pj-text-faint)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--pj-text)" }}>Sobre nós</p>
            </div>
            <ChevronRight size={15} style={{ color: "#c9cec7" }} />
          </button>
        </Row>
        <Row>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Info size={17} style={{ color: "var(--pj-text-faint)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--pj-text)" }}>Versão</p>
            </div>
            <span className="text-xs font-semibold" style={{ color: "var(--pj-text-faint)" }}>2.0.2</span>
          </div>
        </Row>
        <Row>
          <button onClick={() => setModalTermos(true)} className="press pj-tap w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText size={17} style={{ color: "var(--pj-text-faint)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--pj-text)" }}>Termos e privacidade</p>
            </div>
            <ChevronRight size={15} style={{ color: "#c9cec7" }} />
          </button>
        </Row>
        <Row border={false}>
          <button onClick={() => window.location.href = "mailto:poupeja.portugal@gmail.com"} className="press pj-tap w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Mail size={17} style={{ color: "var(--pj-text-faint)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--pj-text)" }}>Contacto e ajuda</p>
            </div>
            <ChevronRight size={15} style={{ color: "#c9cec7" }} />
          </button>
        </Row>
      </Section>

      <p className="text-[10px] text-center mt-2 pb-4" style={{ color: "#b7bdb4" }}>PoupeJá · feito com orgulho em Portugal 🇵🇹</p>

      {/* Modal Sobre nós */}
      {modalSobre && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(20,35,28,0.45)" }} onClick={() => setModalSobre(false)}>
          <div className="w-full max-w-lg rounded-t-3xl overflow-hidden max-h-[90vh] overflow-y-auto" style={{ background: "var(--pj-surface)" }} onClick={e => e.stopPropagation()}>

            {/* Cabeçalho editorial */}
            <div className="relative p-6 pb-6" style={{ background: "var(--pj-card)", borderBottom: "1px solid var(--pj-border)" }}>
              <button onClick={() => setModalSobre(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--pj-subtle)" }}>
                <span className="font-semibold text-sm" style={{ color: "var(--pj-text-muted)" }}>✕</span>
              </button>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "var(--pj-brand)" }}>
                <PiggyBank size={24} className="text-white" />
              </div>
              <p className="font-display text-3xl leading-tight" style={{ color: "var(--pj-text)" }}>PoupeJá</p>
              <p className="text-sm mt-1" style={{ color: "var(--pj-text-muted)" }}>Feito com orgulho em Portugal 🇵🇹</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Missão */}
              <div>
                <p className="mb-2" style={LABEL_STYLE}>A nossa missão</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--pj-text-muted)" }}>
                  A PoupeJá nasceu com um objetivo simples: ajudar as famílias portuguesas a gastar menos nas compras do dia a dia. Num país onde o custo de vida continua a subir, acreditamos que informação clara e acessível faz toda a diferença.
                </p>
              </div>

              {/* O que oferecemos */}
              <div>
                <p className="mb-3" style={LABEL_STYLE}>O que oferecemos</p>
                <div className="space-y-2.5">
                  {[
                    { emoji: "⛽", titulo: "Combustíveis em tempo real", desc: "Preços atualizados da DGEG, ordenados pelo mais barato perto de ti" },
                    { emoji: "⚡", titulo: "Postos de carregamento EV", desc: "Localização e disponibilidade em tempo real dos postos elétricos" },
                    { emoji: "🛒", titulo: "Folhetos de supermercados", desc: "Continente, Pingo Doce, Lidl, Aldi e Intermarché num só sítio" },
                    { emoji: "📋", titulo: "Lista de compras", desc: "Organiza o que precisas antes de sair de casa" },
                    { emoji: "🧾", titulo: "Talões e garantias digitais", desc: "Guarda os teus recibos e nunca mais percas uma garantia" },
                  ].map(f => (
                    <div key={f.titulo} className="flex gap-3 items-start rounded-2xl p-3" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
                      <span className="text-xl flex-shrink-0">{f.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--pj-text)" }}>{f.titulo}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--pj-text-faint)" }}>{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contacto */}
              <div className="rounded-2xl p-4" style={{ background: "var(--pj-subtle)", border: "1px solid var(--pj-border)" }}>
                <p className="mb-2" style={{ ...LABEL_STYLE, color: "var(--pj-brand-ink)" }}>Fala connosco</p>
                <p className="text-sm mb-3" style={{ color: "var(--pj-text-muted)" }}>Tens uma sugestão, encontraste um erro ou queres saber mais? Adoramos receber feedback.</p>
                <button
                  onClick={() => window.location.href = "mailto:poupeja.portugal@gmail.com"}
                  className="press pj-tap w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                  style={{ background: "var(--pj-brand)", color: "#fff" }}
                >
                  <Mail size={13} /> poupeja.portugal@gmail.com
                </button>
              </div>

              <p className="text-[10px] text-center pb-2" style={{ color: "#b7bdb4" }}>PoupeJá v2.0.2 · © 2026 · Todos os direitos reservados</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Termos */}
      {modalTermos && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(20,35,28,0.45)" }} onClick={() => setModalTermos(false)}>
          <div className="w-full max-w-lg rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto" style={{ background: "var(--pj-surface)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <p className="font-display text-2xl" style={{ color: "var(--pj-text)" }}>Termos e Privacidade</p>
              <button onClick={() => setModalTermos(false)} className="press pj-tap w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--pj-subtle)" }}>
                <span className="text-lg font-semibold" style={{ color: "var(--pj-text-muted)" }}>✕</span>
              </button>
            </div>
            <div className="text-sm leading-relaxed space-y-4" style={{ color: "var(--pj-text-muted)" }}>
              <p><strong style={{ color: "var(--pj-text)" }}>Última atualização:</strong> junho 2026</p>
              <p><strong style={{ color: "var(--pj-text)" }}>O que guardamos</strong><br/>Os dados da tua conta (nome e e-mail) são guardados em segurança na Supabase. As tuas listas de compras, talões e preferências são guardados localmente no teu dispositivo.</p>
              <p><strong style={{ color: "var(--pj-text)" }}>Para que usamos os dados</strong><br/>Para te mostrar os teus próprios dados dentro da app. Não vendemos dados a ninguém e não te mostramos anúncios. Há dois serviços que recebem dados de navegação: o Google Analytics, para percebermos como a app é usada, e o Awin, que regista as compras feitas através dos links para lojas parceiras (é assim que o PoupeJá se paga).</p>
              <p><strong style={{ color: "var(--pj-text)" }}>Cookies</strong><br/>O cookie da sessão de autenticação é essencial. Além desse, o Google Analytics e o Awin gravam cookies próprios — de medição e de atribuição de compras. Podes bloqueá-los nas definições do teu browser sem perder nada da app.</p>
              <p><strong style={{ color: "var(--pj-text)" }}>Os teus direitos</strong><br/>Podes apagar a tua conta a qualquer momento em Definições → Conta. Para questões de privacidade, contacta-nos em poupeja.portugal@gmail.com</p>
              <p><strong style={{ color: "var(--pj-text)" }}>Dados de terceiros</strong><br/>Os preços de combustíveis são fornecidos pela DGEG. Os postos EV e combustíveis usam a API TomTom. Os folhetos são links para os sites oficiais dos supermercados.</p>
            </div>
            <button onClick={() => setModalTermos(false)} className="press pj-tap w-full mt-6 py-3 rounded-2xl font-semibold text-sm" style={{ background: "#14231c", color: "#fff" }}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
