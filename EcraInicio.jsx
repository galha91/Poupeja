import { useState, useEffect } from "react";
import {
  Store, Fuel, Bell, UserPlus, ChefHat, Receipt, Tag, ChevronRight,
  Flame, ShieldCheck, ListChecks, Landmark, CalendarClock, Calculator,
} from "lucide-react";
import LogoLoja from "./LogoLoja";
import Divisoria from "./Divisoria";
import { calcularEstado } from "./lib/desafios";

function calcStreak() {
  try {
    const raw = JSON.parse(localStorage.getItem("poupeja_visita_diaria") || "null");
    const hoje = new Date().toISOString().slice(0, 10);
    if (!raw) {
      localStorage.setItem("poupeja_visita_diaria", JSON.stringify({ data: hoje, streak: 1 }));
      return 1;
    }
    if (raw.data === hoje) return raw.streak;
    const ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
    const streak = raw.data === ontem.toISOString().slice(0, 10) ? raw.streak + 1 : 1;
    localStorage.setItem("poupeja_visita_diaria", JSON.stringify({ data: hoje, streak }));
    return streak;
  } catch { return 1; }
}

/* ─── Home redesign: helpers ─── */
function saudacaoHora() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 20 ? "Boa tarde" : "Boa noite";
}

// Contagem crescente do valor poupado (respeita prefers-reduced-motion)
function useCountUp(target, ms = 1100) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") { setVal(target); return; }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) { setVal(target); return; }
    let raf, start;
    const step = (t) => {
      if (start === undefined) start = t;
      const p = Math.min((t - start) / ms, 1);
      setVal(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return val;
}


/* ─── Card de combustível na Home (dados reais DGEG) ─── */
function CardCombustivelHome({ setTab }) {
  const [dados, setDados] = useState(null);      // { preco, marca, nome?, distancia?, perto }
  const [aLocalizar, setALocalizar] = useState(false);

  function escolherGasoleo(lista, campoTipo) {
    if (!lista?.length) return null;
    const g = lista.filter(x => (x[campoTipo] || "").toLowerCase() === "gasóleo");
    return (g.length ? g : lista).slice().sort((a, b) => a.preco - b.preco)[0] || null;
  }

  function buscarPerto(lat, lon) {
    setALocalizar(true);
    fetch(`/api/combustiveis?lat=${lat}&lon=${lon}&raio=15`)
      .then(r => r.json())
      .then(j => {
        setALocalizar(false);
        if (!j.success) return;
        const best = escolherGasoleo(j.estacoes, "tipoLabel");
        if (best) setDados({ preco: best.preco, marca: best.marca || best.nome, nome: best.nome, distancia: best.distancia, perto: true });
      })
      .catch(() => setALocalizar(false));
  }

  useEffect(() => {
    let vivo = true;
    // Preço nacional mais barato — imediato, sem pedir localização
    fetch("/api/combustiveis")
      .then(r => r.json())
      .then(j => {
        if (!vivo || !j.success) return;
        const best = escolherGasoleo(j.dados, "tipo");
        if (best) setDados(prev => prev?.perto ? prev : { preco: best.preco, marca: best.posto, perto: false });
      })
      .catch(() => {});
    // Se a localização já foi autorizada antes, mostra logo o mais barato perto
    navigator.permissions?.query?.({ name: "geolocation" })
      .then(p => { if (vivo && p.state === "granted" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => vivo && buscarPerto(pos.coords.latitude, pos.coords.longitude), () => {});
      }}).catch(() => {});
    return () => { vivo = false; };
  }, []);

  function pedirLocalizacao(e) {
    e.stopPropagation();
    if (!navigator.geolocation) return;
    setALocalizar(true);
    navigator.geolocation.getCurrentPosition(
      pos => buscarPerto(pos.coords.latitude, pos.coords.longitude),
      () => setALocalizar(false)
    );
  }

  return (
    <button onClick={() => setTab("mobilidade")} className="pj-tap flex items-center w-full text-left" style={{ gap: 14 }}>
      <div className="flex items-center justify-center flex-none" style={{ width: 40, height: 40, borderRadius: 12, background: "var(--pj-subtle)", color: "var(--pj-text-strong)" }}>
        <Fuel size={19} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, color: "var(--pj-text-muted)", fontWeight: 500 }}>
          {dados?.perto ? "Gasóleo mais barato perto de ti" : "Gasóleo mais barato"}
        </div>
        <div className="truncate" style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)", marginTop: 3 }}>
          {dados ? (dados.marca || "—") : "Ver postos e preços"}
          {dados?.perto && dados.distancia ? <span style={{ color: "var(--pj-text-faint)", fontWeight: 500 }}> · {dados.distancia} km</span> : null}
          {dados && !dados.perto ? <span onClick={pedirLocalizacao} style={{ color: "var(--pj-brand-ink)", fontWeight: 600 }}> · {aLocalizar ? "a localizar…" : "perto de ti"}</span> : null}
        </div>
      </div>
      {dados
        ? <div className="font-display flex-none" style={{ fontSize: 24, fontWeight: 500, color: "var(--pj-brand-ink)" }}>{dados.preco.toFixed(2).replace(".", ",")}<span style={{ fontSize: 15 }}>€</span></div>
        : <ChevronRight size={20} className="flex-none" style={{ color: "var(--pj-text-faint)" }} />}
    </button>
  );
}


function LogoFolheto({ loja }) {
  return <LogoLoja loja={loja} size={44} radius={12} bg="#eeece4" />;
}

/* ─── Herói do Início ───────────────────────────────────────────
 * A poupança é um indicador atrasado: só existe depois de haver um
 * talão guardado. Mostrar "€0,00" a 78px faz com que a coisa maior
 * da app seja um zero — logo para quem acabou de chegar.
 *
 * Por isso o herói tem três estados, sempre no mesmo sítio e com o
 * mesmo tratamento tipográfico (é um componente que evolui, não três
 * desenhos diferentes):
 *
 *   1. nunca guardou nada  → convite, sem número nenhum
 *   2. já guardou, mas não este mês → o total de sempre, que é real
 *   3. tem poupança este mês → o número do mês (como sempre foi)
 * ─────────────────────────────────────────────────────────────── */
function HeroPoupanca({ mesNome, totalMes, totalSempre, animMes, decMes, streak, onGuardarTalao }) {
  const nuncaGuardou = totalSempre <= 0;
  const semEsteMes   = totalMes <= 0;

  const Rotulo = ({ children }) => (
    <div style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
      {children}
    </div>
  );

  // Número grande, no traço da casa — partilhado pelos estados 2 e 3.
  const Numero = ({ inteiro, decimais }) => (
    <div className="font-display flex items-baseline" style={{ fontWeight: 500, fontSize: 78, lineHeight: 1, letterSpacing: "-0.035em", color: "var(--pj-text)", marginTop: 16 }}>
      <span style={{ fontSize: 38, color: "var(--pj-text-faint)", marginRight: 5, fontWeight: 400 }}>€</span>
      {inteiro}
      <span style={{ fontSize: 38, color: "var(--pj-text-faint)", fontWeight: 400 }}>,{decimais}</span>
    </div>
  );

  const BotaoTalao = ({ children }) => (
    <button
      onClick={onGuardarTalao}
      className="pj-tap press inline-flex items-center"
      style={{ gap: 7, marginTop: 18, padding: "10px 16px", borderRadius: 12, background: "var(--pj-brand)", color: "#fff", fontSize: 13.5, fontWeight: 600 }}
    >
      <Receipt size={15} strokeWidth={1.9} /> {children}
    </button>
  );

  return (
    <div style={{ marginTop: 44 }} className="anim-up anim-up-1">
      <div className="flex items-center justify-between">
        <Rotulo>{nuncaGuardou || !semEsteMes ? `Poupança de ${mesNome}` : "Poupança total"}</Rotulo>
        {/* A streak conta visitas, não poupança. Só a mostramos quando já
            quer dizer alguma coisa — ao 1.º dia era uma medalha sem feito. */}
        {streak >= 2 && (
          <div className="flex items-center" style={{ gap: 4, fontSize: 12, color: "var(--pj-brand-ink)", fontWeight: 600 }}>
            <Flame size={13} /> {streak} dias
          </div>
        )}
      </div>

      {nuncaGuardou ? (
        /* 1. Ainda não há nada para contar — o herói ensina o ciclo. */
        <>
          <p className="font-display" style={{ fontSize: 29, fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--pj-text)", marginTop: 14 }}>
            A tua poupança começa<br />no próximo talão.
          </p>
          <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.45 }}>
            Guarda o talão da compra e o PoupeJá faz as contas por ti.
          </p>
          <BotaoTalao>Guardar talão</BotaoTalao>
        </>
      ) : semEsteMes ? (
        /* 2. Já poupou antes — mostramos o que é real, não o zero do mês. */
        <>
          <Numero inteiro={Math.floor(totalSempre)} decimais={String(Math.round((totalSempre - Math.floor(totalSempre)) * 100)).padStart(2, "0")} />
          <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 10 }}>
            Ainda sem talões em {mesNome}.
          </p>
          <BotaoTalao>Guardar talão</BotaoTalao>
        </>
      ) : (
        /* 3. Há poupança este mês — o número manda, como sempre. */
        <Numero inteiro={Math.floor(animMes)} decimais={decMes} />
      )}
    </div>
  );
}

/* ─── Ecrã Início ─── */
export default function EcraInicio({ user, setTab, goGarantias, onAbrirAvisos, onAbrirDefinicoes, onCriarConta, retratoDisponivel = null, onAbrirRetrato, avisosCount = 0 }) {
  const [convPendente] = useState(() => {
    try { return !!localStorage.getItem("poupeja_conversao_pendente"); } catch { return false; }
  });
  const primeiroNome = user?.nome?.split(" ")[0] || "aí";

  const [totalMes, setTotalMes]       = useState(0);
  const [totalSempre, setTotalSempre] = useState(0);
  const [estadoDesafio, setEstadoDesafio] = useState(null);
  const [folhetos, setFolhetos]   = useState([]);
  const [streak, setStreak]       = useState(0);
  useEffect(() => {
    try {
      const taloes = JSON.parse(localStorage.getItem("poupeja_taloes") || "[]");
      const mesAtual = new Date().toISOString().slice(0, 7);
      const compras = taloes.filter(t => t.tipo === "compra" && t.valorPoupado > 0);
      const doMes = compras.filter(t => (t.dataCompra || t.criadoEm || "").slice(0, 7) === mesAtual);
      setTotalMes(doMes.reduce((s, t) => s + (t.valorPoupado || 0), 0));
      setTotalSempre(compras.reduce((s, t) => s + (t.valorPoupado || 0), 0));
    } catch {}
    setEstadoDesafio(calcularEstado());
    setStreak(calcStreak());
    fetch("/api/folhetos").then(r => r.json()).then(d => setFolhetos(d.folhetos || [])).catch(() => {});
  }, []);

  // Dados derivados para o novo ecrã
  const mesNome   = new Date().toLocaleDateString("pt-PT", { month: "long" });
  const inteiroMes = Math.floor(totalMes);
  const animMes   = useCountUp(inteiroMes, 1100);
  const decMes    = String(Math.round((totalMes - inteiroMes) * 100)).padStart(2, "0");

  const FEATURES = [
    // Ordenado por frequência de uso: semanal → mensal → ocasional → sazonal
    { icon: Tag,           label: "Folhetos",           desc: "Supermercados desta semana",            iconBg: "bg-emerald-50",  iconColor: "text-emerald-600", tab: "mercados" },
    { icon: ListChecks,    label: "Lista de compras",  desc: "Organiza antes de ir às compras",      iconBg: "bg-violet-50",   iconColor: "text-violet-600",  tab: "lista" },
    { icon: Fuel,          label: "Combustíveis",        desc: "Preços e postos perto de ti",          iconBg: "bg-orange-50",   iconColor: "text-orange-500",  tab: "mobilidade" },
    { icon: Receipt,       label: "Os meus talões",    desc: "Compras e garantias",                   iconBg: "bg-blue-50",     iconColor: "text-blue-600",    tab: "taloes" },
    { icon: CalendarClock, label: "Contas & Crédito",   desc: "Despesas fixas, crédito e renda",       iconBg: "bg-violet-50",   iconColor: "text-violet-600",  tab: "contas" },
    { icon: Store,         label: "Lojas",              desc: "Moda, eletrónica e desporto",           iconBg: "bg-slate-100",   iconColor: "text-slate-500",   tab: "lojas" },
    { icon: Landmark,      label: "Apoios do Estado",   desc: "Benefícios a que tens direito",         iconBg: "bg-blue-50",     iconColor: "text-blue-600",    tab: "apoios" },
    { icon: Calculator,    label: "Simulador de IRS",   desc: "Estima o teu reembolso",                iconBg: "bg-fuchsia-50",  iconColor: "text-fuchsia-600", tab: "irs" },
    { icon: ChefHat,       label: "Ementas económicas", desc: "Receitas baratas → lista num toque",    iconBg: "bg-emerald-50",  iconColor: "text-emerald-600", tab: "mercados" },
  ];


  return (
    <div className="pb-28" style={{ minHeight: "100vh", background: "var(--pj-surface)", color: "var(--pj-text)" }}>
      <div style={{ padding: "calc(env(safe-area-inset-top) + 18px) 24px 32px" }}>

        {/* Cabeçalho */}
        <div className="flex items-center justify-between anim-up">
          <div style={{ fontSize: 15, color: "var(--pj-text-muted)", fontWeight: 500 }}>
            {saudacaoHora()}, <span className="capitalize" style={{ color: "var(--pj-text)", fontWeight: 600 }}>{primeiroNome}</span>
          </div>
          <div className="flex items-center" style={{ gap: 16, color: "var(--pj-text)" }}>
            <button onClick={onAbrirAvisos} className="pj-tap relative flex" aria-label="Avisos">
              <Bell size={21} strokeWidth={1.7} />
              {avisosCount > 0 && <span className="absolute rounded-full" style={{ top: -1, right: -1, width: 7, height: 7, background: "#cf5a3c", border: "1.5px solid #f6f5f0" }} />}
            </button>
            <button onClick={onAbrirDefinicoes} className="pj-tap flex items-center justify-center" aria-label="Perfil"
              style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--pj-brand)", color: "#f6f5f0", fontSize: 14, fontWeight: 600 }}>
              {(primeiroNome[0] || "P").toUpperCase()}
            </button>
          </div>
        </div>

        {/* Retrato do mês pronto */}
        {retratoDisponivel && (
          <button onClick={onAbrirRetrato} className="pj-tap w-full text-left flex items-center anim-up"
            style={{ gap: 12, marginTop: 18, padding: "13px 14px", borderRadius: 14, background: "var(--pj-brand)" }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>🎁</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "#fff" }}>O teu retrato de {retratoDisponivel.mes.nome} está pronto</span>
              <span style={{ display: "block", fontSize: 12, color: "#a7cbbb", marginTop: 1 }}>€{retratoDisponivel.total.toFixed(2).replace(".", ",")} poupados — vê e partilha</span>
            </span>
            <ChevronRight size={16} style={{ color: "#a7cbbb", flexShrink: 0 }} />
          </button>
        )}

        {/* Convidado: convite a criar conta (ou lembrete de confirmação) */}
        {user?.convidado && (
          convPendente ? (
            <div className="flex items-center anim-up" style={{ gap: 10, marginTop: 18, padding: "11px 14px", borderRadius: 14, background: "var(--pj-brand-wash)" }}>
              <Bell size={16} style={{ color: "var(--pj-brand-ink)", flexShrink: 0 }} />
              <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pj-text)" }}>
                Confirma o teu email para concluíres a conta — enviámos-te um link.
              </p>
            </div>
          ) : (
            <button onClick={onCriarConta} className="pj-tap w-full text-left flex items-center anim-up"
              style={{ gap: 12, marginTop: 18, padding: "12px 14px", borderRadius: 14, background: "var(--pj-brand-wash)", border: "1.5px dashed var(--pj-brand-soft)" }}>
              <UserPlus size={18} style={{ color: "var(--pj-brand-ink)", flexShrink: 0 }} />
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--pj-text)" }}>A usar como convidado</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--pj-text-muted)", marginTop: 1 }}>Cria conta grátis para guardares o progresso e receberes avisos</span>
              </span>
              <ChevronRight size={16} style={{ color: "var(--pj-brand-ink)", flexShrink: 0 }} />
            </button>
          )
        )}

        {/* Poupança — o herói adapta-se ao que há para mostrar */}
        <HeroPoupanca
          mesNome={mesNome}
          totalMes={totalMes}
          totalSempre={totalSempre}
          animMes={animMes}
          decMes={decMes}
          streak={streak}
          onGuardarTalao={() => setTab("taloes")}
        />

        <Divisoria />

        {/* Ações rápidas */}
        <div className="grid grid-cols-4 anim-up anim-up-2" style={{ gap: 4 }}>
          {[
            { Icon: Receipt,     label: "Talões",      on: () => setTab("taloes") },
            { Icon: Fuel,        label: "Combustível", on: () => setTab("mobilidade") },
            { Icon: ShieldCheck, label: "Garantias",   on: goGarantias },
            { Icon: Landmark,    label: "Apoios",      on: () => setTab("apoios") },
          ].map((a, i) => (
            <button key={i} onClick={a.on} className="pj-tap flex flex-col items-center" style={{ gap: 10, padding: "8px 0" }}>
              <div className="flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: 16, background: "var(--pj-subtle)", color: "var(--pj-text-strong)" }}>
                <a.Icon size={23} strokeWidth={1.7} />
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 500, color: "var(--pj-text-muted)" }}>{a.label}</span>
            </button>
          ))}
        </div>

        <Divisoria />

        {/* Desafio do mês (anel) — dados reais do desafio de € */}
        {estadoDesafio && (() => {
          const pct = Math.min(Math.round(estadoDesafio.progresso * 100), 100);
          const falta = Math.max(0, estadoDesafio.desafio.meta - estadoDesafio.totalMes);
          const completo = estadoDesafio.completo;
          const R = 19, C = 2 * Math.PI * R, frac = Math.min(estadoDesafio.progresso, 1);
          return (
            <button onClick={() => setTab("poupanca")} className="pj-tap flex items-center w-full text-left anim-up anim-up-3" style={{ gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div className="font-display" style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>{estadoDesafio.desafio.nome}</div>
                <div style={{ fontSize: 12.5, color: "var(--pj-text-muted)", fontWeight: 500, marginTop: 3 }}>
                  {completo ? "Desafio do mês completo 🎉" : `Faltam €${falta.toFixed(2).replace(".", ",")} para a meta de €${estadoDesafio.desafio.meta}`}
                </div>
              </div>
              <div style={{ position: "relative", width: 44, height: 44, flex: "none" }}>
                <svg width="44" height="44" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r={R} fill="none" style={{ stroke: "var(--pj-border)" }} strokeWidth="3" />
                  <circle cx="22" cy="22" r={R} fill="none" style={{ stroke: "var(--pj-brand-ink)" }} strokeWidth="3" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 22 22)" />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "var(--pj-text)" }}>{pct}%</div>
              </div>
            </button>
          );
        })()}

        <Divisoria />

        {/* Folhetos a acabar */}
        {folhetos.length > 0 && (
          <div className="anim-up anim-up-4">
            <div className="flex items-baseline justify-between" style={{ marginBottom: 16 }}>
              <span className="font-display" style={{ fontSize: 19, fontWeight: 600, color: "var(--pj-text)", letterSpacing: "-0.01em" }}>Folhetos a acabar</span>
              <button onClick={() => setTab("mercados")} className="pj-tap" style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-brand-ink)" }}>Ver todos</button>
            </div>
            <div className="flex flex-col">
              {folhetos.slice(0, 5).map((f, i) => (
                <div key={f.id || i}>
                  {i > 0 && <div style={{ height: 1, background: "var(--pj-subtle)" }} />}
                  <button onClick={() => f.url ? window.open(f.url, "_blank", "noopener") : setTab("mercados")} className="pj-tap flex items-center w-full text-left" style={{ gap: 14, padding: "12px 0" }}>
                    <LogoFolheto loja={f.loja} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{f.loja}</div>
                      <div className="truncate" style={{ fontSize: 12.5, color: "var(--pj-text-muted)", fontWeight: 500, marginTop: 1 }}>{f.titulo || "Folheto desta semana"}</div>
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--pj-text-faint)", fontWeight: 500, flex: "none" }}>{f.validade || ""}</div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Divisoria />

        {/* Combustível */}
        <div className="anim-up anim-up-4">
          <CardCombustivelHome setTab={setTab} />
        </div>

        <Divisoria />

        {/* Explorar tudo */}
        <div>
          <div className="font-display" style={{ fontSize: 19, fontWeight: 600, color: "var(--pj-text)", letterSpacing: "-0.01em", marginBottom: 14 }}>Explorar tudo</div>
          <div className="grid grid-cols-2" style={{ gap: 10 }}>
            {FEATURES.map((f, i) => (
              <button key={i} onClick={() => f.tab && setTab(f.tab)} className="pj-tap flex items-center text-left" style={{ gap: 12, padding: "11px 12px", borderRadius: 14, background: "var(--pj-subtle)" }}>
                <f.icon size={17} style={{ color: "var(--pj-text-strong)" }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pj-text)" }}>{f.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─── Ecrã Poupança ─── */
