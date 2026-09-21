import { useState, useEffect } from "react";
import {
  Store, Fuel, Bell, UserPlus, ChefHat, Receipt, ChevronRight,
  Flame, ShieldCheck, ListChecks, Landmark, Calculator,
} from "lucide-react";
import LogoLoja from "./LogoLoja";
import { Preco } from "./Preco";
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
          {/*
            Antes dizia só "Gasóleo mais barato" nos dois casos. Sem
            localização, este preço é o mínimo em TODO o país — pode ser
            uma estação a 300 km. Dizer "perto de ti" ao lado de um preço
            assim (mesmo como convite para clicar) lia-se como se o
            preço já fosse local, e não é: é por isso que parecia
            "errado" ao comparar com o ecrã da Mobilidade, que mostra
            mesmo a estação e a distância reais.
          */}
          {dados?.perto ? "Gasóleo mais barato perto de ti" : "Gasóleo mais barato no país"}
        </div>
        <div className="truncate" style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)", marginTop: 3 }}>
          {dados ? (dados.marca || "—") : "Ver postos e preços"}
          {dados?.perto && dados.distancia ? <span style={{ color: "var(--pj-text-faint)", fontWeight: 500 }}> · {dados.distancia} km</span> : null}
          {dados && !dados.perto ? <span onClick={pedirLocalizacao} style={{ color: "var(--pj-brand-ink)", fontWeight: 600 }}> · {aLocalizar ? "a localizar…" : "ver perto de ti"}</span> : null}
        </div>
      </div>
      {/*
        Escrevia 1,49€ — duas casas, € no fim — enquanto a Mobilidade e as
        páginas de concelho escrevem €1,494. O mesmo litro com dois
        números diferentes era o que fazia a Início parecer "errada" ao
        lado do ecrã de detalhe. Passa pelo mesmo componente que os outros.
      */}
      {dados
        ? <span className="flex-none"><Preco valor={dados.preco} casas={3} tamanho={22} /></span>
        : <ChevronRight size={20} className="flex-none" style={{ color: "var(--pj-text-faint)" }} />}
    </button>
  );
}


function LogoFolheto({ loja }) {
  // 44 era para uma linha de nome + uma de subtítulo. O subtítulo era a
  // mesma frase repetida nas 9 lojas e saiu — o logótipo acompanha.
  return <LogoLoja loja={loja} size={36} radius={10} bg="#eeece4" />;
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
function HeroPoupanca({ mesNome, totalMes, totalSempre, animMes, decMes, streak, resumo, onGuardarTalao }) {
  const nuncaGuardou = totalSempre <= 0;
  const semEsteMes   = totalMes <= 0;

  const Rotulo = ({ children }) => (
    <div style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
      {children}
    </div>
  );

  // Número grande, no traço da casa — partilhado pelos estados 2 e 3.
  // pj-num (algarismos tabulares) não é só alinhamento: sem ele a contagem
  // crescente faz o número mudar de largura a cada frame e o € dança.
  const Numero = ({ inteiro, decimais }) => (
    <div className="font-display pj-num flex items-baseline" style={{ fontWeight: 500, fontSize: 78, lineHeight: 1, letterSpacing: "-0.035em", color: "var(--pj-text)", marginTop: 16 }}>
      <span style={{ fontSize: 38, color: "var(--pj-text-faint)", marginRight: 5, fontWeight: 400 }}>€</span>
      {inteiro}
      <span style={{ fontSize: 38, color: "var(--pj-text-faint)", fontWeight: 400 }}>,{decimais}</span>
    </div>
  );

  /*
   * O número maior da app estava órfão: €22,60 não dizia de onde vinha
   * nem se era bom. Um produto de poupança caro faz sentir que cada
   * número foi medido — esta linha é a origem (quantos talões) e a
   * comparação (face ao mês anterior), ambas calculadas dos talões
   * reais. Nada aqui é estimado: se não houver mês anterior com
   * talões, a comparação não aparece.
   */
  const Evidencia = ({ nTaloes, delta, nomeMesAnterior }) => {
    const partes = [];
    if (nTaloes > 0) partes.push(`de ${nTaloes} ${nTaloes === 1 ? "talão" : "talões"}`);
    const subiu = delta != null && delta > 0;
    return (
      <div className="pj-num" style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 12, fontWeight: 500 }}>
        {partes.join(" · ")}
        {delta != null && Math.abs(delta) >= 0.01 && (
          <>
            {partes.length > 0 && " · "}
            <span style={{ color: subiu ? "var(--pj-brand-ink)" : "var(--pj-text-muted)", fontWeight: 600 }}>
              {subiu ? "+" : "−"}€{Math.abs(delta).toFixed(2).replace(".", ",")}
            </span>
            {" "}face a {nomeMesAnterior}
          </>
        )}
      </div>
    );
  };

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
            De {resumo.nTaloesTotal} {resumo.nTaloesTotal === 1 ? "talão" : "talões"}. Ainda sem talões em {mesNome}.
          </p>
          <BotaoTalao>Guardar talão</BotaoTalao>
        </>
      ) : (
        /* 3. Há poupança este mês — o número manda, e diz de onde vem. */
        <>
          <Numero inteiro={Math.floor(animMes)} decimais={decMes} />
          <Evidencia
            nTaloes={resumo.nTaloesMes}
            delta={resumo.houveMesAnterior ? totalMes - resumo.totalMesAnterior : null}
            nomeMesAnterior={resumo.nomeMesAnterior}
          />
        </>
      )}
    </div>
  );
}

/* ─── Ecrã Início ─── */
export default function EcraInicio({ user, setTab, goGarantias, abrirEmentas, onAbrirAvisos, onAbrirDefinicoes, onCriarConta, retratoDisponivel = null, onAbrirRetrato, avisosCount = 0 }) {
  const [convPendente] = useState(() => {
    try { return !!localStorage.getItem("poupeja_conversao_pendente"); } catch { return false; }
  });
  const primeiroNome = user?.nome?.split(" ")[0] || "aí";

  const [totalMes, setTotalMes]       = useState(0);
  const [totalSempre, setTotalSempre] = useState(0);
  const [estadoDesafio, setEstadoDesafio] = useState(null);
  const [folhetos, setFolhetos]   = useState([]);
  const [streak, setStreak]       = useState(0);
  const [resumo, setResumo]       = useState({ nTaloesMes: 0, nTaloesTotal: 0, totalMesAnterior: 0, houveMesAnterior: false, nomeMesAnterior: "" });
  useEffect(() => {
    try {
      const taloes = JSON.parse(localStorage.getItem("poupeja_taloes") || "[]");
      // As datas dos talões são locais ("2026-09-30"). Comparar com
      // toISOString() — que é UTC — punha um talão de 1 de outubro à
      // meia-noite e meia (hora de verão) a contar para setembro.
      const agora = new Date();
      const chave = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const mesAtual = chave(agora);
      const anterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
      const mesAnterior = chave(anterior);

      const compras = taloes.filter(t => t.tipo === "compra" && t.valorPoupado > 0);
      const mesDe = t => (t.dataCompra || t.criadoEm || "").slice(0, 7);
      const doMes = compras.filter(t => mesDe(t) === mesAtual);
      const doMesAnterior = compras.filter(t => mesDe(t) === mesAnterior);
      const soma = lista => lista.reduce((s, t) => s + (t.valorPoupado || 0), 0);

      setTotalMes(soma(doMes));
      setTotalSempre(soma(compras));
      setResumo({
        nTaloesMes: doMes.length,
        nTaloesTotal: compras.length,
        totalMesAnterior: soma(doMesAnterior),
        // Sem talões no mês anterior não há comparação possível — mostrar
        // "+€22,60 face a agosto" quando agosto está vazio é inventar uma
        // melhoria que só existe porque não havia dados.
        houveMesAnterior: doMesAnterior.length > 0,
        nomeMesAnterior: anterior.toLocaleDateString("pt-PT", { month: "long" }),
      });
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

  /*
   * O que NÃO está na barra de baixo.
   *
   * Havia aqui três blocos de navegação empilhados — quatro atalhos
   * redondos, nove fichas em "Explorar tudo" e a barra inferior — 13
   * destinos para 10 sítios. Folhetos, Combustíveis e Contas repetiam
   * separadores que já estão permanentemente na barra de baixo (e, nos
   * dois primeiros casos, também a secção que está logo acima nesta
   * página). Os atalhos repetiam mais três.
   *
   * Fica uma lista só, com o que não tem casa fixa. E as descrições —
   * que já existiam no código e nunca chegavam ao ecrã — passam a
   * aparecer: o rótulo diz o nome, a descrição diz para que serve.
   */
  const MAIS = [
    { icon: Receipt,       label: "Os meus talões",     desc: "Compras guardadas, produto a produto", ir: () => setTab("taloes") },
    { icon: ShieldCheck,   label: "Garantias",          desc: "O que ainda está dentro do prazo",     ir: goGarantias },
    { icon: ListChecks,    label: "Lista de compras",   desc: "Organiza antes de ir às compras",      ir: () => setTab("lista") },
    // Ia para "mercados" e abria em Folhetos — o rótulo prometia receitas
    // e entregava o folheto do Aldi. Agora abre mesmo no separador certo.
    { icon: ChefHat,       label: "Ementas económicas", desc: "Receitas baratas, com lista num toque", ir: () => (abrirEmentas ? abrirEmentas() : setTab("mercados")) },
    { icon: Store,         label: "Lojas",              desc: "Moda, eletrónica e desporto",          ir: () => setTab("lojas") },
    { icon: Landmark,      label: "Apoios do Estado",   desc: "Benefícios a que podes ter direito",   ir: () => setTab("apoios") },
    { icon: Calculator,    label: "Simulador de IRS",   desc: "Estima o teu IRS antes da hora",       ir: () => setTab("irs") },
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
              {avisosCount > 0 && <span className="absolute rounded-full" style={{ top: -1, right: -1, width: 7, height: 7, background: "var(--pj-danger)", border: "1.5px solid #f6f5f0" }} />}
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
          resumo={resumo}
          onGuardarTalao={() => setTab("taloes")}
        />

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
              {/*
                Chamava-se "Folhetos a acabar" — e não havia lógica de fim
                nenhuma: é um slice(0,5) por ordem do ficheiro, que calha ser
                alfabética. Nada aqui sabe que folheto está a acabar, porque
                não temos as datas reais de nenhum deles.
              */}
              <span className="font-display" style={{ fontSize: 19, fontWeight: 600, color: "var(--pj-text)", letterSpacing: "-0.01em" }}>Folhetos desta semana</span>
              <button onClick={() => setTab("mercados")} className="pj-tap" style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-brand-ink)" }}>Ver todos</button>
            </div>
            <div className="flex flex-col">
              {folhetos.slice(0, 5).map((f, i) => (
                <div key={f.id || i}>
                  {i > 0 && <div style={{ height: 1, background: "var(--pj-subtle)" }} />}
                  <button onClick={() => f.url ? window.open(f.url, "_blank", "noopener") : setTab("mercados")} className="pj-tap flex items-center w-full text-left" style={{ gap: 12, padding: "9px 0" }}>
                    <LogoFolheto loja={f.loja} />
                    {/*
                      Eram três colunas e duas não diziam nada: o `titulo` é a
                      string "Folheto desta semana" gravada igual nas 9 lojas,
                      e a `validade` era a semana civil, também igual em todas
                      e inventada. Cinco linhas a repetir o mesmo texto duas
                      vezes. Fica o que distingue mesmo cada linha: a loja.
                    */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{f.loja}</div>
                    </div>
                    <ChevronRight size={18} style={{ color: "var(--pj-text-faint)", flex: "none" }} />
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

        {/* O resto — mesma gramática de linha dos folhetos, acima */}
        <div>
          <div className="font-display" style={{ fontSize: 19, fontWeight: 600, color: "var(--pj-text)", letterSpacing: "-0.01em", marginBottom: 6 }}>Mais no PoupeJá</div>
          <div className="flex flex-col">
            {MAIS.map((f, i) => (
              <div key={f.label}>
                {i > 0 && <div style={{ height: 1, background: "var(--pj-subtle)" }} />}
                <button onClick={f.ir} className="pj-tap flex items-center w-full text-left" style={{ gap: 12, padding: "11px 0" }}>
                  <span className="flex items-center justify-center flex-none" style={{ width: 36, height: 36, borderRadius: 10, background: "var(--pj-subtle)", color: "var(--pj-text-strong)" }}>
                    <f.icon size={17} strokeWidth={1.8} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{f.label}</span>
                    <span style={{ display: "block", fontSize: 12, color: "var(--pj-text-faint)", marginTop: 1 }}>{f.desc}</span>
                  </span>
                  <ChevronRight size={18} style={{ color: "var(--pj-text-faint)", flex: "none" }} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─── Ecrã Poupança ─── */
