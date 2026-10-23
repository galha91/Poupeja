// Componentes partilhados: navegação, rodapé, raridade, contador, cartão.
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useSessao } from "./sessao.jsx";
import { useIdioma } from "./i18n.jsx";
import { urlImagem } from "./api.js";

export const COR_RARIDADE = {
  COMUM: "text-stone-500 border-stone-400/40 bg-stone-400/10",
  RARO: "text-sky-400 border-sky-400/40 bg-sky-400/10",
  EPICO: "text-fuchsia-400 border-fuchsia-400/40 bg-fuchsia-400/10",
  LENDARIO: "text-amber-400 border-amber-400/40 bg-amber-400/10",
};

export function BadgeRaridade({ raridade }) {
  const { t } = useIdioma();
  const rotulo = { COMUM: t("comum"), RARO: t("raro"), EPICO: t("epico"), LENDARIO: t("lendario") }[raridade];
  return (
    <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${COR_RARIDADE[raridade]}`}>
      {rotulo}
    </span>
  );
}

// Contador regressivo animado (visual — o fim real é decidido no servidor)
export function Contador({ ate, aoTerminar }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  const ms = new Date(ate).getTime() - Date.now();
  useEffect(() => {
    if (ms <= 0 && aoTerminar) aoTerminar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms <= 0]);
  if (ms <= 0) return <span>0s</span>;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  const urgente = ms < 90_000;
  return (
    <span className={`tabular-nums font-bold ${urgente ? "text-red-400 animate-pulsar" : ""}`}>
      {d > 0 && `${d}d `}{(d > 0 || h > 0) && `${h}h `}{m}m {s % 60}s
    </span>
  );
}

export function Moedas({ n }) {
  return <span className="tabular-nums font-bold">{Number(n).toLocaleString("pt-PT")} 🪙</span>;
}

export function Nav() {
  const { user, sair } = useSessao();
  const { t, idioma, mudar } = useIdioma();
  const [escuro, setEscuro] = useState(() => localStorage.getItem("frutabol_tema") !== "claro");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", escuro);
    localStorage.setItem("frutabol_tema", escuro ? "escuro" : "claro");
  }, [escuro]);

  const ligacao = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm font-semibold ${isActive ? "bg-amber-400/15 text-amber-500 dark:text-amber-300" : "opacity-75 hover:opacity-100"}`;

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-stone-100/80 dark:bg-[#0b0b14]/80 border-b border-stone-200 dark:border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-2">
        <Link to="/" className="font-display font-extrabold text-xl mr-2 whitespace-nowrap">
          🍌 FrutaBol
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          <NavLink to="/catalogo" className={ligacao}>{t("catalogo")}</NavLink>
          {user && <NavLink to="/colecao" className={ligacao}>{t("colecao")}</NavLink>}
          {user && <NavLink to="/moedas" className={ligacao}>{t("moedas")}</NavLink>}
          {user?.papel === "ADMIN" && <NavLink to="/admin" className={ligacao}>{t("admin")}</NavLink>}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => mudar(idioma === "pt" ? "en" : "pt")} title="Idioma / Language"
            className="text-xs font-bold px-2 py-1 rounded-lg border border-stone-300 dark:border-white/15">
            {idioma.toUpperCase()}
          </button>
          <button onClick={() => setEscuro((e) => !e)} title="Tema"
            className="text-sm px-2 py-1 rounded-lg border border-stone-300 dark:border-white/15">
            {escuro ? "🌙" : "☀️"}
          </button>
          {user ? (
            <>
              <Link to="/moedas" className="text-sm font-bold px-3 py-1.5 rounded-lg bg-amber-400/15 text-amber-500 dark:text-amber-300 whitespace-nowrap">
                <Moedas n={user.saldo} />
              </Link>
              <span className="hidden sm:block text-sm opacity-70">{user.nome}</span>
              <button onClick={sair} className="text-sm opacity-70 hover:opacity-100">{t("sair")}</button>
            </>
          ) : (
            <Link to="/entrar" className="botao-primario !py-1.5">{t("entrar")}</Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function Rodape() {
  const { t } = useIdioma();
  return (
    <footer className="mt-16 border-t border-stone-200 dark:border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-8 text-sm opacity-70 space-y-3">
        <p>{t("avisoLegal")}</p>
        <p className="flex gap-4 flex-wrap">
          <Link to="/termos" className="underline">{t("termos")}</Link>
          <Link to="/privacidade" className="underline">{t("privacidade")}</Link>
          <Link to="/conteudos" className="underline">{t("conteudos")}</Link>
          <span>© {new Date().getFullYear()} FrutaBol</span>
        </p>
      </div>
    </footer>
  );
}

export function CartaoPersonagem({ p }) {
  const { t } = useIdioma();
  const leilao = p.leilao;
  return (
    <Link to={`/personagem/${p.id}`} className="carta overflow-hidden block animate-aparecer">
      <div className="aspect-[4/5] bg-stone-200 dark:bg-black/30 relative">
        <img src={urlImagem(p.imagem)} alt={p.nome} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute top-2 left-2"><BadgeRaridade raridade={p.raridade} /></div>
        {p.favorito && <div className="absolute top-2 right-2 text-lg">❤️</div>}
      </div>
      <div className="p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display font-bold truncate">{p.nome}</h3>
          <span className="text-xs opacity-60 whitespace-nowrap">{p.vendidas}/{p.tiragem}</span>
        </div>
        <p className="text-xs opacity-60 truncate">{p.clube}</p>
        <div className="mt-2 text-sm">
          {leilao?.estado === "ATIVO" ? (
            <div className="flex items-center justify-between">
              <Moedas n={leilao.licitacaoAtual ?? leilao.precoInicial} />
              <span className="text-xs opacity-70"><Contador ate={leilao.fim} /></span>
            </div>
          ) : leilao?.estado === "AGENDADO" ? (
            <span className="text-xs opacity-70">{t("leilaoAgendado")} · <Contador ate={leilao.inicio} /></span>
          ) : (
            <span className="text-xs opacity-50">{t("semLeilao")}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function Carregando() {
  return <div className="py-24 text-center text-4xl animate-pulsar">🍌</div>;
}

export function Erro({ mensagem }) {
  if (!mensagem) return null;
  return (
    <div className="rounded-xl border border-red-400/40 bg-red-400/10 text-red-500 dark:text-red-300 text-sm px-3 py-2 animate-aparecer">
      {mensagem}
    </div>
  );
}
