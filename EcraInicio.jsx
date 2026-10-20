import { useState, useEffect } from "react";
import { CartaoEmentasInicio } from "./DestaqueEmentas";
import dynamic from "next/dynamic";
import {
  Store, Fuel, Bell, UserPlus, ChefHat, Receipt, ChevronRight,
  Flame, ListChecks, Landmark, Calculator, Search, Gift, Mail, User,
} from "lucide-react";
import LogoLoja from "./LogoLoja";
import FonteOficial from "./FonteOficial";
import { embutivel } from "./lib/folhetos-embed";
import Divisoria from "./Divisoria";
import { calcularEstado } from "./lib/desafios";
import { N_COMPARADAS } from "./lib/cobertura";
import { lerResumo } from "./lib/resumoLista";
import { eur } from "./lib/formato";
import { mostrarIRS } from "./lib/atalhos";
import { descreverFrescura } from "./lib/frescura";
import { evento } from "./lib/analytics";
import { slugify } from "./lib/slug";
import { lerDescontos, aplicarDescontos } from "./lib/descontosCombustivel";
import SubscreverCombustivel from "./SubscreverCombustivel";

// O leitor de folhetos só faz falta ao abrir um: descarrega-se nessa altura.
const FolhetoViewer = dynamic(() => import("./FolhetoViewer"), { ssr: false });

/* ─── Lista de compras: o estado real, no topo do Início ─── */
function CartaoLista({ lista, onAbrir }) {
  const { n, resumo } = lista;
  const artigos = `${n} ${n === 1 ? "artigo" : "artigos"}`;
  const titulo = !n ? "Lista de compras" : resumo ? `Mais barata no ${resumo.nome}` : `${artigos} na lista`;
  const sub = !n ? "Começa a tua lista e vê onde fica mais barata"
    : resumo ? (resumo.poupanca >= 0.01 ? `${artigos} · poupas ${eur(resumo.poupanca, 2)} €` : artigos)
    : n >= 2 ? `Vê onde fica mais barata em ${N_COMPARADAS} supermercados` : "Junta mais artigos para comparar";
  return (
    <button onClick={onAbrir} className="pj-tap w-full text-left flex items-center anim-up anim-up-2"
      style={{ gap: 12, marginTop: 24, padding: "14px 14px", borderRadius: 14, background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
      <ListChecks size={18} style={{ color: "var(--pj-brand-ink)", flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="truncate" style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{titulo}</span>
        <span style={{ display: "block", fontSize: 12, color: "var(--pj-text-muted)", marginTop: 1 }}>{sub}</span>
      </span>
      {resumo
        ? <span className="pj-num flex-none" style={{ fontSize: 15, fontWeight: 700, color: "var(--pj-text)" }}>{eur(resumo.total, 2)} €</span>
        : <ChevronRight size={16} style={{ color: "var(--pj-text-faint)", flexShrink: 0 }} />}
    </button>
  );
}

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


/* ─── Gasóleo mais barato (dados reais DGEG) ─── */
function escolherGasoleo(lista, campoTipo) {
  if (!lista?.length) return null;
  const g = lista.filter(x => (x[campoTipo] || "").toLowerCase() === "gasóleo");
  return (g.length ? g : lista).slice().sort((a, b) => a.preco - b.preco)[0] || null;
}

// A rota chama-lhe atualizadoEm; lib/frescura chama-lhe obtidoEm. É a
// mesma coisa: quando fomos buscar os preços à DGEG.
function frescuraDe(j) {
  return { obtidoEm: j.atualizadoEm, dataPreco: j.dataPreco, stale: j.stale };
}

/*
 * Três níveis de "perto", do melhor para o pior. Um resultado só
 * substitui outro se for melhor — os pedidos correm em paralelo e o
 * nacional (que chega primeiro) não pode tapar o local.
 *
 *   exata      — GPS, com autorização dada (agora ou antes)
 *   aproximada — a cidade do IP (/api/onde-estou), sem pedir nada
 *   pais       — o mínimo nacional, para quem nem isso tem
 */
const NIVEL = { pais: 0, aproximada: 1, exata: 2 };

function useGasoleoHoje() {
  const [dados, setDados] = useState(null);      // { preco, marca, distancia?, nivel, cidade?, frescura }
  const [aLocalizar, setALocalizar] = useState(false);
  const [falhou, setFalhou] = useState(false);   // sem preço nacional: quem depende disto mostra outra coisa

  const melhor = (novo) => setDados(prev => (prev && NIVEL[prev.nivel] > NIVEL[novo.nivel]) ? prev : novo);

  function buscarPerto(lat, lon, nivel, cidade = null) {
    if (nivel === "exata") setALocalizar(true);
    return fetch(`/api/combustiveis?lat=${lat}&lon=${lon}&raio=15`)
      .then(r => r.json())
      .then(j => {
        if (!j.success) return;
        // O mesmo "o meu desconto" da Mobilidade: o herói mostra o que a pessoa paga.
        const best = escolherGasoleo(aplicarDescontos(j.estacoes, lerDescontos()), "tipoLabel");
        // O concelho do posto mais PERTO (não o do mais barato, que pode ser
        // o concelho vizinho): é o do email semanal que se oferece.
        const maisPerto = (j.estacoes || []).filter(e => e.municipio && e.distancia != null)
          .sort((a, b) => a.distancia - b.distancia)[0];
        const concelho = maisPerto ? { slug: slugify(maisPerto.municipio), nome: maisPerto.municipio } : null;
        if (best) melhor({ preco: best.preco, desconto: best.desconto, marca: best.marca || best.nome, distancia: best.distancia, nivel, cidade, concelho, frescura: frescuraDe(j) });
      })
      .catch(() => {})
      .finally(() => nivel === "exata" && setALocalizar(false));
  }

  useEffect(() => {
    let vivo = true;
    // Preço nacional mais barato — a rede de segurança, sem pedir nada
    fetch("/api/combustiveis")
      .then(r => r.json())
      .then(j => {
        if (!vivo) return;
        const best = j.success ? escolherGasoleo(aplicarDescontos(j.dados, lerDescontos(), "posto"), "tipo") : null;
        if (best) melhor({ preco: best.preco, desconto: best.desconto, marca: best.posto, nivel: "pais", frescura: frescuraDe(j) });
        else setFalhou(true);
      })
      .catch(() => vivo && setFalhou(true));
    // A cidade pelo IP — "perto de Braga" logo à entrada, sem janela de permissão
    fetch("/api/onde-estou")
      .then(r => r.json())
      .then(j => { if (vivo && j.ok) buscarPerto(j.lat, j.lon, "aproximada", j.cidade); })
      .catch(() => {});
    // Se a localização já foi autorizada antes, usa logo a exata
    navigator.permissions?.query?.({ name: "geolocation" })
      .then(p => { if (vivo && p.state === "granted" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => vivo && buscarPerto(pos.coords.latitude, pos.coords.longitude, "exata"), () => {});
      }}).catch(() => {});
    return () => { vivo = false; };
  }, []);

  function pedirLocalizacao() {
    if (!navigator.geolocation) return;
    setALocalizar(true);
    navigator.geolocation.getCurrentPosition(
      pos => buscarPerto(pos.coords.latitude, pos.coords.longitude, "exata"),
      () => setALocalizar(false)
    );
  }

  return { dados, aLocalizar, falhou, pedirLocalizacao };
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
const Rotulo = ({ children }) => (
  <div style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
    {children}
  </div>
);

// Número grande, no traço da casa — partilhado pelos dois heróis.
// pj-num (algarismos tabulares) não é só alinhamento: sem ele a contagem
// crescente faz o número mudar de largura a cada frame e o € dança.
// `tamanho` encolhe o número da poupança quando o gasóleo já está por
// cima: dois números de 78px seguidos competiam um com o outro.
const Numero = ({ inteiro, decimais, tamanho = 78 }) => (
  <div className="font-display pj-num flex items-baseline" style={{ fontWeight: 500, fontSize: tamanho, lineHeight: 1, letterSpacing: "-0.035em", color: "var(--pj-text)", marginTop: tamanho * 0.2 }}>
    <span style={{ fontSize: tamanho * 0.49, color: "var(--pj-text-faint)", marginRight: 5, fontWeight: 400 }}>€</span>
    {inteiro}
    {decimais != null && <span style={{ fontSize: tamanho * 0.49, color: "var(--pj-text-faint)", fontWeight: 400 }}>,{decimais}</span>}
  </div>
);

const Streak = ({ streak }) => streak >= 2 && (
  <div className="flex items-center" style={{ gap: 4, fontSize: 12, color: "var(--pj-brand-ink)", fontWeight: 600 }}>
    <Flame size={13} /> {streak} dias
  </div>
);

/* ─── Herói do Início: o gasóleo de hoje ────────────────────────
 * O primeiro número da app é o gasóleo: serve a qualquer pessoa, muda
 * todos os dias e não pede nada. Chega já "perto de" uma cidade (pelo
 * IP); quem quiser o posto exato toca no botão. A origem e a hora estão
 * sempre à vista, como em todo o lado.
 *
 * O rótulo diz sempre de onde vem o "perto": "perto de ti" só com GPS;
 * pelo IP diz o nome da cidade — se estiver errada (rede móvel cai
 * muitas vezes em Lisboa), a pessoa vê-o logo e corrige com um toque.
 *
 * Se a DGEG falhar, quem chama não mostra este herói: um número vazio
 * no sítio mais visível da app era pior do que nenhum.
 * ─────────────────────────────────────────────────────────────── */
const LS_EMAIL_COMB = "poupeja_email_combustivel"; // concelho já subscrito neste browser

function HeroCombustivel({ gasoleo, streak, onVerPostos, onGuardarTalao }) {
  const { dados, aLocalizar, pedirLocalizacao } = gasoleo;
  const [emailAberto, setEmailAberto] = useState(false);
  const [subscrito, setSubscrito] = useState(null);
  useEffect(() => { try { setSubscrito(localStorage.getItem(LS_EMAIL_COMB)); } catch {} }, []);
  const idade = dados ? descreverFrescura(dados.frescura) : null;
  const exata = dados?.nivel === "exata";

  const onde = !dados || dados.nivel === "pais" ? "no país"
    : exata ? "perto de ti"
    : dados.cidade ? `perto de ${dados.cidade}` : "perto de ti (aprox.)";

  function localizar() {
    evento("inicio_combustivel", { acao: "localizar", nivel: dados?.nivel || "nenhum" });
    pedirLocalizacao();
  }
  function verPostos() {
    evento("inicio_combustivel", { acao: "ver_postos", nivel: dados?.nivel || "nenhum" });
    onVerPostos();
  }
  function guardarTalao() {
    evento("inicio_combustivel", { acao: "guardar_talao" });
    onGuardarTalao();
  }

  return (
    <div style={{ marginTop: 44 }} className="anim-up anim-up-1">
      <div className="flex items-center justify-between" style={{ gap: 12 }}>
        {/* "Hoje" só se a consulta à DGEG for mesmo de hoje. */}
        <Rotulo>Gasóleo mais barato {onde}{idade?.deHoje ? " · hoje" : ""}</Rotulo>
        <Streak streak={streak} />
      </div>

      {dados ? (
        // Inteiro: no gasóleo é sempre "1" — o que distingue um preço do
        // outro são as milésimas, e essas não podem ficar a meia altura.
        <Numero inteiro={eur(dados.preco, 3)} />
      ) : (
        // A carregar: o mesmo corpo de letra, para a página não saltar.
        <div className="font-display" aria-hidden="true" style={{ fontSize: 78, lineHeight: 1, marginTop: 16, color: "var(--pj-border)" }}>€—</div>
      )}

      <p className="truncate" style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 12, fontWeight: 500 }}>
        {dados ? (dados.marca || "—") : "A ver os preços de hoje…"}
        {/* Distância só com GPS: a partir do centro de uma cidade adivinhada não quer dizer nada. */}
        {exata && dados.distancia ? ` · ${dados.distancia} km` : ""}
        {dados?.desconto ? " · com o teu desconto" : ""}
      </p>

      <button
        onClick={exata ? verPostos : localizar}
        disabled={aLocalizar}
        className="pj-tap press inline-flex items-center"
        style={{ gap: 7, marginTop: 18, padding: "10px 16px", borderRadius: 12, background: "var(--pj-brand)", color: "#fff", fontSize: 13.5, fontWeight: 600 }}
      >
        <Fuel size={15} strokeWidth={1.9} />
        {aLocalizar ? "A localizar…" : exata ? "Ver postos no mapa" : dados?.nivel === "aproximada" ? "Usar a minha localização exata" : "Ver o mais barato perto de mim"}
      </button>

      {/* Hora da consulta e link para a origem, na mesma linha discreta. */}
      {idade?.iso && (
        <div className="flex flex-wrap items-baseline" style={{ columnGap: 6, marginTop: 10, fontSize: 11, color: "var(--pj-text-faint)" }}>
          <span>{idade.rotulo.replace(/^Preços DGEG · c/, "C")} ·</span>
          <FonteOficial fontes="dgeg" />
        </div>
      )}

      {/*
        Voltar sem conta pelo email: o alerta de sexta (sobe na semana
        seguinte) e o email semanal do concelho que a pessoa está a ver, só
        depois de haver um "perto".
      */}
      {dados?.concelho && dados.nivel !== "pais" && subscrito !== dados.concelho.slug && (
        emailAberto ? (
          <SubscreverCombustivel
            concelho={dados.concelho.slug}
            nome={dados.concelho.nome}
            destaqueAlerta
            onFeito={() => { try { localStorage.setItem(LS_EMAIL_COMB, dados.concelho.slug); } catch {} }}
          />
        ) : (
          // Em destaque: hoje quase ninguém subscreve o email (o link discreto não se via).
          <button
            onClick={() => { evento("inicio_combustivel", { acao: "email_abrir", nivel: dados.nivel }); setEmailAberto(true); }}
            className="pj-tap press flex items-center w-full text-left"
            style={{ gap: 12, marginTop: 14, padding: "12px 14px", borderRadius: 14, background: "var(--pj-brand-wash)", border: "1px solid var(--pj-border)" }}
          >
            <Mail size={20} aria-hidden style={{ color: "var(--pj-brand-ink)", flex: "none" }} />
            <span className="flex-1 min-w-0">
              <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "var(--pj-text)" }}>Sabe antes de o combustível subir</span>
              <span style={{ display: "block", fontSize: 12.5, color: "var(--pj-text-muted)", lineHeight: 1.4, marginTop: 2 }}>
                Email à sexta quando sobe na semana seguinte e à segunda os postos mais baratos de {dados.concelho.nome}. Grátis, sem conta.
              </span>
            </span>
            <ChevronRight size={16} aria-hidden style={{ color: "var(--pj-brand-ink)", flex: "none" }} />
          </button>
        )
      )}

      {onGuardarTalao && (
        <button onClick={guardarTalao} className="pj-tap pj-alvo flex items-center" style={{ gap: 4, marginTop: 14, fontSize: 12.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
          Guarda um talão e vê quanto poupas <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

// `compacto`: por baixo do gasóleo — o número desce para 52px e a streak
// fica só no herói de cima.
function HeroPoupanca({ mesNome, totalMes, totalSempre, animMes, decMes, streak, resumo, onGuardarTalao, compacto = false }) {
  const tam = compacto ? 52 : 78;
  const nuncaGuardou = totalSempre <= 0;
  const semEsteMes   = totalMes <= 0;

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
    <div style={{ marginTop: compacto ? 36 : 44 }} className="anim-up anim-up-1">
      <div className="flex items-center justify-between">
        <Rotulo>{nuncaGuardou || !semEsteMes ? `Poupança de ${mesNome}` : "Poupança total"}</Rotulo>
        {/* A streak conta visitas, não poupança. Só a mostramos quando já
            quer dizer alguma coisa — ao 1.º dia era uma medalha sem feito. */}
        {!compacto && <Streak streak={streak} />}
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
          <Numero inteiro={Math.floor(totalSempre)} decimais={String(Math.round((totalSempre - Math.floor(totalSempre)) * 100)).padStart(2, "0")} tamanho={tam} />
          <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 10 }}>
            De {resumo.nTaloesTotal} {resumo.nTaloesTotal === 1 ? "talão" : "talões"}. Ainda sem talões em {mesNome}.
          </p>
          <BotaoTalao>Guardar talão</BotaoTalao>
        </>
      ) : (
        /* 3. Há poupança este mês — o número manda, e diz de onde vem. */
        <>
          <Numero inteiro={Math.floor(animMes)} decimais={decMes} tamanho={tam} />
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
export default function EcraInicio({ user, setTab, goGarantias, abrirEmentas, onAbrirAvisos, onAbrirDefinicoes, onCriarConta, onEntrar, retratoDisponivel = null, onAbrirRetrato, avisosCount = 0, garantiasCount = 0 }) {
  const [convPendente] = useState(() => {
    try { return !!localStorage.getItem("poupeja_conversao_pendente"); } catch { return false; }
  });
  // Sem conta, o nome é o "Convidado" técnico — não se trata ninguém assim.
  const primeiroNome = user?.convidado ? "" : (user?.nome?.split(" ")[0] || "");
  const [folhetoAberto, setFolhetoAberto] = useState(null); // folheto aberto dentro da app

  const [totalMes, setTotalMes]       = useState(0);
  const [totalSempre, setTotalSempre] = useState(0);
  const [estadoDesafio, setEstadoDesafio] = useState(null);
  const [folhetos, setFolhetos]   = useState([]);
  const [streak, setStreak]       = useState(0);
  const [lista, setLista]         = useState({ n: 0, resumo: null });
  const [irsUsado, setIrsUsado]   = useState(false);
  const [resumo, setResumo]       = useState({ nTaloesMes: 0, nTaloesTotal: 0, totalMesAnterior: 0, houveMesAnterior: false, nomeMesAnterior: "" });
  // Até ler o localStorage não se sabe quem é quem: escolher o herói antes
  // disso mostrava o de quem explora a toda a gente durante um instante.
  const [lido, setLido]           = useState(false);
  const gasoleo = useGasoleoHoje();
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
    try {
      const pendentes = JSON.parse(localStorage.getItem("poupeja_lista_compras") || "[]").filter(i => !i.feito);
      setLista({ n: pendentes.length, resumo: lerResumo(pendentes) });
      setIrsUsado(!!localStorage.getItem("poupeja_irs"));
    } catch {}
    setEstadoDesafio(calcularEstado());
    setStreak(calcStreak());
    setLido(true);
    fetch("/api/folhetos").then(r => r.json()).then(d => setFolhetos(d.folhetos || [])).catch(() => {});
  }, []);

  // Dados derivados para o novo ecrã
  const mesNome   = new Date().toLocaleDateString("pt-PT", { month: "long" });
  const inteiroMes = Math.floor(totalMes);
  const animMes   = useCountUp(inteiroMes, 1100);
  const decMes    = String(Math.round((totalMes - inteiroMes) * 100)).padStart(2, "0");

  // Quem ainda não fez nada (nem talão, nem lista) está a explorar: o
  // desafio do mês espera por uma primeira ação.
  const explorar = lido && totalSempre <= 0 && lista.n === 0 && !retratoDisponivel;

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
  /*
   * Revisto (lista otimizada): a Lista de compras saiu daqui para um
   * cartão próprio no topo; talões e garantias são o mesmo ecrã com
   * duas abas, e passam a uma linha; o IRS só aparece na época. Lojas e
   * Apoios ficam: no telemóvel não têm outra entrada (a barra lateral,
   * onde também estão, só existe no desktop — lá escondem-se daqui).
   */
  const MAIS = [
    { icon: Receipt,    label: "Talões e garantias", desc: garantiasCount > 0 ? `${garantiasCount} ${garantiasCount === 1 ? "garantia a acabar" : "garantias a acabar"}` : "Compras guardadas e prazos de garantia", ir: garantiasCount > 0 ? goGarantias : () => setTab("taloes") },
    { icon: Landmark,   label: "Apoios do Estado",   desc: "Benefícios e prazos (IRS, IMI, abono…)",   ir: () => setTab("apoios"), soMovel: true },
    { icon: Store,      label: "Lojas",              desc: "Moda, eletrónica e desporto",          ir: () => setTab("lojas"), soMovel: true },
    ...(mostrarIRS(new Date(), irsUsado) ? [{ icon: Calculator, label: "Simulador de IRS", desc: "Estima o teu IRS antes da hora", ir: () => setTab("irs") }] : []),
  ];


  return (
    <div className="pj-inicio pb-28" style={{ minHeight: "100vh", background: "var(--pj-surface)", color: "var(--pj-text)" }}>
      <div style={{ padding: "calc(env(safe-area-inset-top) + 18px) 24px 32px" }}>

        {/* Cabeçalho */}
        <div className="flex items-center justify-between anim-up">
          <div style={{ fontSize: 15, color: "var(--pj-text-muted)", fontWeight: 500 }}>
            {saudacaoHora()}{primeiroNome && <>, <span className="capitalize" style={{ color: "var(--pj-text)", fontWeight: 600 }}>{primeiroNome}</span></>}
          </div>
          <div className="flex items-center" style={{ gap: 16, color: "var(--pj-text)" }}>
            <button onClick={onAbrirAvisos} className="pj-tap relative flex" aria-label="Avisos">
              <Bell size={21} strokeWidth={1.7} />
              {avisosCount > 0 && <span className="absolute rounded-full" style={{ top: -1, right: -1, width: 7, height: 7, background: "var(--pj-danger)", border: "1.5px solid var(--pj-surface)" }} />}
            </button>
            <button onClick={onAbrirDefinicoes} className="pj-tap flex items-center justify-center" aria-label="Perfil"
              style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--pj-brand)", color: "#f6f5f0", fontSize: 14, fontWeight: 600 }}>
              {primeiroNome ? primeiroNome[0].toUpperCase() : <User size={17} strokeWidth={2} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Retrato do mês pronto */}
        {retratoDisponivel && (
          <button onClick={onAbrirRetrato} className="pj-tap w-full text-left flex items-center anim-up"
            style={{ gap: 12, marginTop: 18, padding: "13px 14px", borderRadius: 14, background: "var(--pj-brand)" }}>
            <Gift size={20} strokeWidth={1.8} style={{ color: "#fff", flexShrink: 0 }} />
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "#fff" }}>O teu retrato de {retratoDisponivel.mes.nome} está pronto</span>
              <span style={{ display: "block", fontSize: 12, color: "#a7cbbb", marginTop: 1 }}>€{retratoDisponivel.total.toFixed(2).replace(".", ",")} poupados — vê e partilha</span>
            </span>
            <ChevronRight size={16} style={{ color: "#a7cbbb", flexShrink: 0 }} />
          </button>
        )}

        {/* Convidado que já pediu a conta: o lembrete de confirmação fica
            no topo — já começou e falta-lhe um passo. O convite para criar
            conta vai para o fim da página, para quem o quiser. */}
        {user?.convidado && convPendente && (
          <div className="flex items-center anim-up" style={{ gap: 10, marginTop: 18, padding: "11px 14px", borderRadius: 14, background: "var(--pj-brand-wash)" }}>
            <Bell size={16} style={{ color: "var(--pj-brand-ink)", flexShrink: 0 }} />
            <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pj-text)" }}>
              Confirma o teu email para concluíres a conta — enviámos-te um link.
            </p>
          </div>
        )}

        {/* Herói: o gasóleo de hoje, sempre primeiro. A poupança vem logo
            a seguir, mais pequena, para quem já a tem. Se a DGEG falhar,
            fica só a poupança, como antes. Antes de ler o localStorage,
            só o espaço — sem saltos. */}
        {!lido ? (
          <div style={{ marginTop: 44, minHeight: 190 }} />
        ) : !gasoleo.falhou ? (
          <>
            <HeroCombustivel
              gasoleo={gasoleo}
              streak={streak}
              onVerPostos={() => setTab("mobilidade")}
              onGuardarTalao={totalSempre <= 0 ? () => setTab("taloes") : null}
            />
            {totalSempre > 0 && (
              <HeroPoupanca
                compacto
                mesNome={mesNome}
                totalMes={totalMes}
                totalSempre={totalSempre}
                animMes={animMes}
                decMes={decMes}
                streak={streak}
                resumo={resumo}
                onGuardarTalao={() => setTab("taloes")}
              />
            )}
          </>
        ) : (
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
        )}

        {/* Ementas: cartão grande, logo a seguir ao herói — o jantar de hoje
            ou o convite para planear a semana. */}
        <CartaoEmentasInicio onAbrir={() => (abrirEmentas ? abrirEmentas() : setTab("mercados", "ementas"))} />

        {/* Lista de compras — com o resultado da lista otimizada, quando há */}
        <CartaoLista lista={lista} onAbrir={() => setTab("lista")} />

        {/* Comparar preços — a pergunta que traz as pessoas de volta */}
        <button onClick={() => setTab("mercados", "comparar")} className="pj-tap w-full text-left flex items-center anim-up anim-up-2"
          style={{ gap: 12, marginTop: 10, padding: "13px 14px", borderRadius: 14, background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
          <Search size={18} style={{ color: "var(--pj-brand-ink)", flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>Onde está mais barato?</span>
            <span style={{ display: "block", fontSize: 12, color: "var(--pj-text-muted)", marginTop: 1 }}>Compara laranjas, leite, azeite… em {N_COMPARADAS} supermercados</span>
          </span>
          <ChevronRight size={16} style={{ color: "var(--pj-text-faint)", flexShrink: 0 }} />
        </button>

        <Divisoria />

        {/* Desafio do mês (anel) — dados reais do desafio de €. Quem
            explora ainda não guardou nada: um anel a 0% não lhe diz nada. */}
        {estadoDesafio && !explorar && (() => {
          const pct = Math.min(Math.round(estadoDesafio.progresso * 100), 100);
          const falta = Math.max(0, estadoDesafio.desafio.meta - estadoDesafio.totalMes);
          const completo = estadoDesafio.completo;
          const R = 19, C = 2 * Math.PI * R, frac = Math.min(estadoDesafio.progresso, 1);
          return (
            <button onClick={() => setTab("poupanca")} className="pj-tap flex items-center w-full text-left anim-up anim-up-3" style={{ gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div className="font-display" style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>{estadoDesafio.desafio.nome}</div>
                <div style={{ fontSize: 12.5, color: "var(--pj-text-muted)", fontWeight: 500, marginTop: 3 }}>
                  {completo ? "Desafio do mês completo" : `Faltam €${falta.toFixed(2).replace(".", ",")} para a meta de €${estadoDesafio.desafio.meta}`}
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

        {estadoDesafio && !explorar && <Divisoria />}

        {/* Folhetos a acabar */}
        {folhetos.length > 0 && (
          <div className="anim-up anim-up-4">
            <div className="flex items-baseline justify-between" style={{ marginBottom: 16 }}>
              {/*
                Chamava-se "Folhetos a acabar" — e não havia lógica de fim
                nenhuma: é a lista do ficheiro, por ordem alfabética. Nada
                aqui sabe que folheto está a acabar, porque não temos as datas
                reais de nenhum deles. Saem todas as lojas, sem "Ver todos".
              */}
              <span className="font-display" style={{ fontSize: 19, fontWeight: 600, color: "var(--pj-text)", letterSpacing: "-0.01em" }}>Folhetos desta semana</span>
            </div>
            <div className="flex flex-col">
              {folhetos.map((f, i) => (
                <div key={f.id || i}>
                  {i > 0 && <div style={{ height: 1, background: "var(--pj-subtle)" }} />}
                  <button onClick={() => embutivel(f.loja) ? setFolhetoAberto(f) : f.url ? window.open(f.url, "_blank", "noopener") : setTab("mercados", "folhetos")} className="pj-tap flex items-center w-full text-left" style={{ gap: 12, padding: "9px 0" }}>
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

        {/* O resto — mesma gramática de linha dos folhetos, acima */}
        <div>
          <div className="font-display" style={{ fontSize: 19, fontWeight: 600, color: "var(--pj-text)", letterSpacing: "-0.01em", marginBottom: 6 }}>Mais no PoupeJá</div>
          <div className="flex flex-col">
            {MAIS.map((f, i) => (
              <div key={f.label} className={f.soMovel ? "lg:hidden" : undefined}>
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

        {/* Conta: opcional, no fim. Quem chega a explorar não precisa
            dela para nada; quem quiser guardar na cloud encontra-a aqui. */}
        {user?.convidado && !convPendente && (
          <p style={{ marginTop: 28, fontSize: 12, color: "var(--pj-text-faint)", textAlign: "center" }}>
            Queres guardar os teus dados noutros dispositivos?{" "}
            <button onClick={onCriarConta} className="pj-tap" style={{ fontWeight: 600, color: "var(--pj-brand-ink)", textDecoration: "underline", textUnderlineOffset: 2 }}>Criar conta</button>
            {" · "}
            <button onClick={onEntrar} className="pj-tap" style={{ fontWeight: 600, color: "var(--pj-brand-ink)", textDecoration: "underline", textUnderlineOffset: 2 }}>Entrar</button>
          </p>
        )}

      </div>
      {folhetoAberto && <FolhetoViewer folheto={folhetoAberto} onFechar={() => setFolhetoAberto(null)} />}
    </div>
  );
}

/* ─── Ecrã Poupança ─── */
