import { useState, useEffect } from "react";
import {
  User, Fuel, MapPin, Store, Bell, ShieldCheck, Info,
  ChevronRight, Check, ArrowLeft, Heart, FileText, Mail,
  PiggyBank, LogOut, BellRing, BellOff,
} from "lucide-react";
import { supabase } from "./lib/supabase";

const SUPERMERCADOS = ["Continente","Pingo Doce","Lidl","Aldi","Intermarché","Auchan","Minipreço"];
const COMBUSTIVEIS  = ["Gasolina 95","Gasóleo","GPL"];

function lerPrefs() {
  try {
    const raw = localStorage.getItem("poupeja_prefs");
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return {
    nome: "", email: "", combustivel: "Gasolina 95",
    distancia: 10, favoritos: ["Continente","Pingo Doce"],
    avisoGarantias: true, avisoPrecos: true, diasGarantia: 60,
    emailSemanal: true,
  };
}

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`w-12 h-7 rounded-full relative transition-colors ${on ? "bg-emerald-500" : "bg-slate-200"}`}
    >
      <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}

function Section({ label, children }) {
  return (
    <div className="mx-4 mb-4">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{label}</p>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function Row({ border = true, children }) {
  return (
    <div className={`p-4 ${border ? "border-b border-slate-50" : ""}`}>
      {children}
    </div>
  );
}

export default function SecaoDefinicoes({ user, onLogout, onVoltar }) {
  const [prefs, setPrefs]   = useState(lerPrefs);
  const [saved, setSaved]   = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado]   = useState(false);
  const [modalTermos, setModalTermos] = useState(false);
  const [modalSobre, setModalSobre]   = useState(false);

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
        setPushEstado(sub ? "ativo" : "inativo");
      })
    ).catch(() => setPushEstado("inativo"));
  }, [VAPID_PUBLIC]);

  async function ativarPush() {
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
    favoritos: p.favoritos.includes(s)
      ? p.favoritos.filter(x => x !== s)
      : [...p.favoritos, s],
  }));

  return (
    <div className="pb-28 pt-4">

      <button onClick={onVoltar} className="press mx-4 mb-4 flex items-center gap-1.5 text-sm font-bold text-slate-400">
        <ArrowLeft size={15} /> Voltar
      </button>

      {/* Hero */}
      <div
        className="mx-4 mb-5 rounded-3xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#064e3b,#059669)", boxShadow: "0 16px 40px -12px rgba(5,150,105,0.4)" }}
      >
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <User size={26} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Conta</p>
            <p className="text-lg font-black text-white leading-tight">{user?.nome || "O teu perfil"}</p>
            <p className="text-[11px] text-white/60">{user?.email || ""}</p>
          </div>
        </div>
      </div>

      {/* Guardado */}
      {saved && (
        <div className="mx-4 mb-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 flex items-center gap-2 anim-up">
          <Check size={13} className="text-emerald-600" />
          <span className="text-xs font-bold text-emerald-700">Guardado automaticamente</span>
        </div>
      )}

      {/* Perfil */}
      <Section label="Perfil">
        <Row>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-800 truncate">{user?.nome || "—"}</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{user?.email || "—"}</p>
            </div>
          </div>
        </Row>
        <Row border={false}>
          <button
            onClick={onLogout}
            className="press w-full flex items-center justify-between text-red-500"
          >
            <div className="flex items-center gap-2.5">
              <LogOut size={17} className="text-red-400" />
              <p className="text-sm font-bold">Sair da conta</p>
            </div>
            <ChevronRight size={15} className="text-red-300" />
          </button>
        </Row>
      </Section>

      {/* Preferências */}
      <Section label="Preferências">
        <Row>
          <div className="flex items-center gap-2 mb-3">
            <Fuel size={15} className="text-orange-500" />
            <p className="text-sm font-black text-slate-800">Combustível habitual</p>
          </div>
          <div className="flex gap-2">
            {COMBUSTIVEIS.map(c => (
              <button
                key={c}
                onClick={() => set("combustivel", c)}
                className={`press flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  prefs.combustivel === c ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </Row>

        <Row>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-emerald-600" />
              <p className="text-sm font-black text-slate-800">Distância máxima</p>
            </div>
            <span className="text-sm font-black text-emerald-600">{prefs.distancia} km</span>
          </div>
          <input
            type="range" min="1" max="50" value={prefs.distancia}
            onChange={e => set("distancia", parseInt(e.target.value))}
            className="w-full"
          />
        </Row>

        <Row border={false}>
          <div className="flex items-center gap-2 mb-3">
            <Heart size={15} className="text-emerald-600" />
            <p className="text-sm font-black text-slate-800">Supermercados favoritos</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUPERMERCADOS.map(s => {
              const ativo = prefs.favoritos.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleFav(s)}
                  className={`press px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                    ativo ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
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
              <ShieldCheck size={17} className="text-amber-500" />
              <p className="text-sm font-bold text-slate-800">Avisos de garantias</p>
            </div>
            <Toggle on={prefs.avisoGarantias} onChange={v => set("avisoGarantias", v)} />
          </div>
        </Row>
        <Row>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell size={17} className="text-blue-500" />
              <p className="text-sm font-bold text-slate-800">Avisos de preços</p>
            </div>
            <Toggle on={prefs.avisoPrecos} onChange={v => set("avisoPrecos", v)} />
          </div>
        </Row>
        <Row border={false}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-slate-800">Avisar com antecedência</p>
            <span className="text-sm font-black text-amber-500">{prefs.diasGarantia} dias</span>
          </div>
          <input
            type="range" min="15" max="120" step="15" value={prefs.diasGarantia}
            onChange={e => set("diasGarantia", parseInt(e.target.value))}
            className="w-full"
            style={{ accentColor: "#f59e0b" }}
          />
        </Row>
      </Section>

      {/* Notificações Push */}
      <Section label="Notificações push">
        <Row border={false}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${pushEstado === "ativo" ? "bg-emerald-50" : "bg-slate-100"}`}>
              {pushEstado === "ativo"
                ? <BellRing size={18} className="text-emerald-600" />
                : <BellOff size={18} className="text-slate-400" />
              }
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-slate-800">Folhetos no ecrã bloqueado</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
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
                  className={`press mt-3 w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    pushEstado === "ativo"
                      ? "bg-slate-100 text-slate-600"
                      : "text-white bg-emerald-500"
                  }`}
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

      {/* Email */}
      <Section label="Email semanal">
        <Row>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Mail size={17} className="text-violet-600" />
              <div>
                <p className="text-sm font-bold text-slate-800">Resumo automático semanal</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Todas as quintas, com os folhetos da semana.</p>
              </div>
            </div>
            <Toggle on={prefs.emailSemanal !== false} onChange={v => set("emailSemanal", v)} />
          </div>
        </Row>
        <Row border={false}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
              <Mail size={18} className="text-violet-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-slate-800">Enviar agora</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Recebe já um resumo com todos os folhetos ativos.</p>
              <button
                onClick={enviarEmailSemanal}
                disabled={enviando || enviado}
                className={`press mt-3 w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  enviado ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "text-white"
                }`}
                style={!enviado ? { background: "linear-gradient(135deg,#7c3aed,#a855f7)" } : {}}
              >
                {enviando ? "A enviar…" : enviado ? <><Check size={13} /> Enviado!</> : <><Mail size={13} /> Enviar para {user?.email}</>}
              </button>
            </div>
          </div>
        </Row>
      </Section>

      {/* Sobre */}
      <Section label="Sobre">
        <Row>
          <button onClick={() => setModalSobre(true)} className="press w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Heart size={17} className="text-slate-400" />
              <p className="text-sm font-bold text-slate-800">Sobre nós</p>
            </div>
            <ChevronRight size={15} className="text-slate-300" />
          </button>
        </Row>
        <Row>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Info size={17} className="text-slate-400" />
              <p className="text-sm font-bold text-slate-800">Versão</p>
            </div>
            <span className="text-xs font-bold text-slate-400">2.0.2</span>
          </div>
        </Row>
        <Row>
          <button onClick={() => setModalTermos(true)} className="press w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText size={17} className="text-slate-400" />
              <p className="text-sm font-bold text-slate-800">Termos e privacidade</p>
            </div>
            <ChevronRight size={15} className="text-slate-300" />
          </button>
        </Row>
        <Row border={false}>
          <button onClick={() => window.location.href = "mailto:contacto@poupeja.com"} className="press w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Mail size={17} className="text-slate-400" />
              <p className="text-sm font-bold text-slate-800">Contacto e ajuda</p>
            </div>
            <ChevronRight size={15} className="text-slate-300" />
          </button>
        </Row>
      </Section>

      <p className="text-[10px] text-slate-300 text-center mt-2 pb-4">PoupeJá · feito com orgulho em Portugal 🇵🇹</p>

      {/* Modal Sobre nós */}
      {modalSobre && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setModalSobre(false)}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            {/* Hero */}
            <div className="relative p-6 pb-5" style={{ background: "linear-gradient(135deg,#064e3b,#059669,#34d399)" }}>
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
              <button onClick={() => setModalSobre(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-sm">✕</span>
              </button>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
                <PiggyBank size={24} className="text-white" />
              </div>
              <p className="text-2xl font-black text-white leading-tight">PoupeJá</p>
              <p className="text-sm text-white/70 mt-1">Feito com orgulho em Portugal 🇵🇹</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Missão */}
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">A nossa missão</p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  A PoupeJá nasceu com um objetivo simples: ajudar as famílias portuguesas a gastar menos nas compras do dia a dia. Num país onde o custo de vida continua a subir, acreditamos que informação clara e acessível faz toda a diferença.
                </p>
              </div>

              {/* O que oferecemos */}
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">O que oferecemos</p>
                <div className="space-y-2.5">
                  {[
                    { emoji: "⛽", titulo: "Combustíveis em tempo real", desc: "Preços atualizados da DGEG, ordenados pelo mais barato perto de ti" },
                    { emoji: "⚡", titulo: "Postos de carregamento EV", desc: "Localização e disponibilidade em tempo real dos postos elétricos" },
                    { emoji: "🛒", titulo: "Folhetos de supermercados", desc: "Continente, Pingo Doce, Lidl, Aldi e Intermarché num só sítio" },
                    { emoji: "📋", titulo: "Lista de compras", desc: "Organiza o que precisas antes de sair de casa" },
                    { emoji: "🧾", titulo: "Talões e garantias digitais", desc: "Guarda os teus recibos e nunca mais percas uma garantia" },
                  ].map(f => (
                    <div key={f.titulo} className="flex gap-3 items-start bg-slate-50 rounded-2xl p-3">
                      <span className="text-xl flex-shrink-0">{f.emoji}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{f.titulo}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contacto */}
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest mb-2">Fala connosco</p>
                <p className="text-sm text-slate-600 mb-3">Tens uma sugestão, encontraste um erro ou queres saber mais? Adoramos receber feedback.</p>
                <button
                  onClick={() => window.location.href = "mailto:contacto@poupeja.com"}
                  className="press w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center justify-center gap-2"
                >
                  <Mail size={13} /> contacto@poupeja.com
                </button>
              </div>

              <p className="text-[10px] text-slate-300 text-center pb-2">PoupeJá v2.0.2 · © 2026 · Todos os direitos reservados</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Termos */}
      {modalTermos && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setModalTermos(false)}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-lg font-black text-slate-800">Termos e Privacidade</p>
              <button onClick={() => setModalTermos(false)} className="press w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                <span className="text-slate-500 text-lg font-bold">✕</span>
              </button>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed space-y-4">
              <p><strong className="text-slate-800">Última atualização:</strong> junho 2026</p>
              <p><strong className="text-slate-800">O que guardamos</strong><br/>Os dados da tua conta (nome e e-mail) são guardados em segurança na Supabase. As tuas listas de compras, talões e preferências são guardados localmente no teu dispositivo.</p>
              <p><strong className="text-slate-800">Para que usamos os dados</strong><br/>Apenas para te mostrar os teus próprios dados dentro da app. Não partilhamos dados com terceiros nem usamos publicidade.</p>
              <p><strong className="text-slate-800">Cookies</strong><br/>Usamos apenas cookies essenciais para o funcionamento da app (sessão de autenticação).</p>
              <p><strong className="text-slate-800">Os teus direitos</strong><br/>Podes apagar a tua conta a qualquer momento em Definições → Conta. Para questões de privacidade, contacta-nos em contacto@poupeja.com</p>
              <p><strong className="text-slate-800">Dados de terceiros</strong><br/>Os preços de combustíveis são fornecidos pela DGEG. Os postos EV e combustíveis usam a API TomTom. Os folhetos são links para os sites oficiais dos supermercados.</p>
            </div>
            <button onClick={() => setModalTermos(false)} className="press w-full mt-6 py-3 rounded-2xl bg-slate-800 text-white font-black text-sm">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
