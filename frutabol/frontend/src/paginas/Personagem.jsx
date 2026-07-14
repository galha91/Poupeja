// Página de personagem com leilão AO VIVO: junta-se à sala socket.io do
// leilão e recebe cada licitação em tempo real.
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { io } from "socket.io-client";
import { api, urlImagem } from "../api.js";
import { useIdioma } from "../i18n.jsx";
import { useSessao } from "../sessao.jsx";
import { BadgeRaridade, Contador, Moedas, Carregando, Erro } from "../componentes.jsx";

export default function Personagem() {
  const { id } = useParams();
  const { t } = useIdioma();
  const { user, atualizar } = useSessao();
  const [dados, setDados] = useState(null);
  const [leilao, setLeilao] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState("");
  const [aEnviar, setAEnviar] = useState(false);

  useEffect(() => {
    api(`/catalogo/${id}`).then((r) => {
      setDados(r);
      const ativo = r.leiloes.find((l) => l.estado === "ATIVO") || r.leiloes.find((l) => l.estado === "AGENDADO") || r.leiloes[0] || null;
      setLeilao(ativo);
      if (ativo) api(`/leiloes/${ativo.id}`).then((d) => setHistorico(d.historico)).catch(() => {});
    }).catch((e) => setErro(e.message));
  }, [id]);

  // tempo real: sala do leilão
  useEffect(() => {
    if (!leilao?.id) return;
    const socket = io(import.meta.env.VITE_API_URL || "/", { withCredentials: true });
    socket.emit("entrar", leilao.id);
    const aoAtualizar = (novo) => {
      setLeilao(novo);
      api(`/leiloes/${novo.id}`).then((d) => setHistorico(d.historico)).catch(() => {});
      atualizar(); // o saldo pode ter mudado (devolução de moedas cativas)
    };
    socket.on("licitacao", aoAtualizar);
    socket.on("estado", aoAtualizar);
    return () => socket.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leilao?.id]);

  const minimo = useMemo(() => {
    if (!leilao) return 0;
    return leilao.licitacaoAtual ? leilao.licitacaoAtual + leilao.incrementoMinimo : leilao.precoInicial;
  }, [leilao]);

  async function licitar(v) {
    setErro("");
    setAEnviar(true);
    try {
      const r = await api(`/leiloes/${leilao.id}/licitar`, { method: "POST", body: { valor: v } });
      setLeilao(r.leilao);
      setValor("");
      await atualizar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setAEnviar(false);
    }
  }

  async function comprarJa() {
    setErro("");
    setAEnviar(true);
    try {
      const r = await api(`/leiloes/${leilao.id}/comprar`, { method: "POST" });
      setLeilao(r.leilao);
      await atualizar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setAEnviar(false);
    }
  }

  async function alternarFavorito() {
    if (!user) return;
    const r = await api(`/catalogo/${id}/favorito`, { method: "POST", body: {} });
    setDados((d) => ({ ...d, personagem: { ...d.personagem, favorito: r.favorito } }));
  }

  if (!dados) return <Carregando />;
  const p = dados.personagem;
  const souTopo = leilao?.licitante && user && leilao.licitante === user.nome;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8 animate-aparecer">
      <div className="carta overflow-hidden">
        <img src={urlImagem(p.imagem)} alt={p.nome} className="w-full object-cover" />
      </div>

      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <BadgeRaridade raridade={p.raridade} />
          <span className="text-xs opacity-60">{p.vendidas}/{p.tiragem} {t("edicao").toLowerCase()}s</span>
          <button onClick={alternarFavorito} className="text-xl" title="Favorito">
            {p.favorito ? "❤️" : "🤍"}
          </button>
        </div>
        <h1 className="font-display font-extrabold text-4xl mt-2">{p.nome}</h1>
        <p className="opacity-70 font-semibold">{p.clube}</p>
        <p className="mt-4 opacity-80">{p.descricao}</p>
        <p className="mt-2 text-sm opacity-60">✨ {p.estilo}</p>

        {leilao ? (
          <div className="carta !shadow-none mt-6 p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="text-xs uppercase tracking-wider opacity-60">
                  {leilao.estado === "ATIVO" ? t("licitacaoAtual") : leilao.estado === "AGENDADO" ? t("leilaoAgendado") : t(leilao.estado.toLowerCase())}
                </div>
                <div className="text-3xl font-display font-extrabold">
                  <Moedas n={leilao.licitacaoAtual ?? leilao.precoInicial} />
                </div>
                {leilao.licitante && (
                  <div className={`text-xs mt-1 ${souTopo ? "text-emerald-400 font-bold" : "opacity-60"}`}>
                    👤 {leilao.licitante}{souTopo ? " (és tu! 🙌)" : ""} · {leilao.nLicitacoes}x
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider opacity-60">
                  {leilao.estado === "AGENDADO" ? t("comeca") : t("termina")}
                </div>
                <div className="text-xl">
                  {leilao.estado === "ATIVO" ? <Contador ate={leilao.fim} />
                    : leilao.estado === "AGENDADO" ? <Contador ate={leilao.inicio} />
                    : <span className="opacity-60">{t(leilao.estado === "TERMINADO" ? "terminado" : "cancelado")}</span>}
                </div>
                <div className="text-xs opacity-50 mt-1">{t("edicao")} {leilao.editionNumero}/{leilao.tiragem}</div>
              </div>
            </div>

            {leilao.estado === "ATIVO" && (
              user ? (
                <>
                  <div className="flex gap-2">
                    <input type="number" min={minimo} value={valor} onChange={(e) => setValor(e.target.value)}
                      placeholder={`${t("minimo")}: ${minimo}`} className="campo flex-1" />
                    <button disabled={aEnviar} onClick={() => licitar(Math.max(minimo, parseInt(valor || 0, 10) || minimo))}
                      className="botao-primario">
                      🔨 {t("licitar")} {(!valor || parseInt(valor, 10) < minimo) ? minimo : ""}
                    </button>
                  </div>
                  {leilao.compraImediata && (
                    <button disabled={aEnviar} onClick={comprarJa} className="botao-fantasma w-full">
                      ⚡ {t("compraImediata")}: <Moedas n={leilao.compraImediata} />
                    </button>
                  )}
                  <p className="text-xs opacity-50">{t("cativas")}</p>
                </>
              ) : (
                <Link to="/entrar" className="botao-primario w-full">{t("entrar")}</Link>
              )
            )}
            <Erro mensagem={erro} />

            <div>
              <h3 className="text-sm font-bold opacity-70 mb-2">{t("historico")}</h3>
              {historico.length === 0 ? (
                <p className="text-sm opacity-50">{t("semLicitacoes")}</p>
              ) : (
                <ul className="space-y-1 max-h-48 overflow-y-auto text-sm">
                  {historico.map((h, i) => (
                    <li key={i} className="flex justify-between border-b border-stone-200 dark:border-white/5 py-1">
                      <span className="opacity-70">👤 {h.nome}</span>
                      <Moedas n={h.valor} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-6 opacity-60">{t("semLeilao")}</p>
        )}
      </div>
    </div>
  );
}
