// A minha coleção: itens + certificados + downloads + saldo/bónus/referral.
import { useEffect, useState } from "react";
import { api, urlImagem } from "../api.js";
import { useIdioma } from "../i18n.jsx";
import { useSessao } from "../sessao.jsx";
import { BadgeRaridade, Moedas, Carregando, Erro } from "../componentes.jsx";

const ROTULO_MOVIMENTO = {
  BONUS_REGISTO: "🎁 Bónus de registo", BONUS_DIARIO: "📅 Bónus diário",
  BONUS_REFERRAL: "🤝 Bónus de convite", LICITACAO: "🔨 Licitação (cativa)",
  DEVOLUCAO: "↩️ Devolução", COMPRA_IMEDIATA: "⚡ Compra imediata",
  COMPRA_PACK: "🛒 Compra de moedas", AJUSTE_ADMIN: "🔧 Ajuste",
};

export default function Colecao() {
  const { t } = useIdioma();
  const { user, atualizar } = useSessao();
  const [itens, setItens] = useState(null);
  const [movimentos, setMovimentos] = useState([]);
  const [referral, setReferral] = useState(null);
  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    api("/colecao").then((r) => setItens(r.itens)).catch(() => setItens([]));
    api("/moedas/historico").then((r) => setMovimentos(r.movimentos)).catch(() => {});
    api("/moedas/referral").then(setReferral).catch(() => {});
  }, []);

  async function bonusDiario() {
    setErro(""); setAviso("");
    try {
      const r = await api("/moedas/bonus-diario", { method: "POST" });
      setAviso(`+${r.valor} 🪙!`);
      await atualizar();
      api("/moedas/historico").then((h) => setMovimentos(h.movimentos)).catch(() => {});
    } catch (e) {
      setErro(e.message);
    }
  }

  async function descarregar(editionId) {
    try {
      const r = await api(`/colecao/download/${editionId}`, { method: "POST" });
      window.open(r.url, "_blank");
    } catch (e) {
      setErro(e.message);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-aparecer">
      <h1 className="font-display font-bold text-3xl mb-6">{t("colecao")}</h1>

      {!user.emailVerificado && (
        <div className="carta p-4 mb-6 flex items-center justify-between gap-3 flex-wrap border-amber-400/50">
          <span className="text-sm">✉️ {t("verificaEmail")}</span>
          <button onClick={() => api("/auth/reenviar-verificacao", { method: "POST" }).then(() => setAviso("📨"))}
            className="botao-fantasma !py-1.5">{t("reenviar")}</button>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="carta p-4">
          <div className="text-xs uppercase opacity-60">{t("saldo")}</div>
          <div className="text-2xl font-display font-extrabold"><Moedas n={user.saldo} /></div>
        </div>
        <div className="carta p-4">
          <div className="text-xs uppercase opacity-60">{t("bonusDiario")}</div>
          <button onClick={bonusDiario} className="botao-primario mt-1 !py-1.5">🎁 {t("reclamar")}</button>
          {aviso && <span className="ml-2 text-emerald-400 font-bold">{aviso}</span>}
        </div>
        <div className="carta p-4">
          <div className="text-xs uppercase opacity-60">{t("codigoConvite")}</div>
          <div className="font-mono font-bold text-lg select-all">{referral?.codigo || user.codigoReferral}</div>
          {referral && <div className="text-xs opacity-60">{referral.convidados} {t("convidados")}</div>}
        </div>
      </div>
      <Erro mensagem={erro} />

      {!itens ? (
        <Carregando />
      ) : itens.length === 0 ? (
        <p className="opacity-60 py-8">{t("colecaoVazia")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {itens.map((item) => (
            <div key={item.editionId} className="carta overflow-hidden">
              <img src={urlImagem(item.personagem.imagem)} alt={item.personagem.nome} className="aspect-[4/5] w-full object-cover" />
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold">{item.personagem.nome}</h3>
                  <BadgeRaridade raridade={item.personagem.raridade} />
                </div>
                <p className="text-xs opacity-60">
                  {t("edicao")} {item.numero} {t("de")} {item.tiragem}
                  {item.compradoPor != null && <> · {t("compradoPor")} <Moedas n={item.compradoPor} /></>}
                </p>
                {item.certificadoId && <p className="text-xs font-mono opacity-50">{item.certificadoId}</p>}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => descarregar(item.editionId)} className="botao-primario flex-1 !py-1.5 text-xs">
                    ⬇️ {t("download")}
                  </button>
                  <a href={`${import.meta.env.VITE_API_URL || ""}/api/colecao/certificado/${item.editionId}`}
                    target="_blank" rel="noreferrer" className="botao-fantasma flex-1 !py-1.5 text-xs">
                    📜 {t("certificado")}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="font-display font-bold text-xl mb-3">{t("movimentos")}</h2>
      <div className="carta divide-y divide-stone-200 dark:divide-white/5">
        {movimentos.map((m) => (
          <div key={m.id} className="flex justify-between px-4 py-2 text-sm">
            <span className="opacity-75">{ROTULO_MOVIMENTO[m.tipo] || m.tipo}</span>
            <span className={`font-bold tabular-nums ${m.valor >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {m.valor >= 0 ? "+" : ""}{m.valor} 🪙
            </span>
          </div>
        ))}
        {movimentos.length === 0 && <p className="px-4 py-3 text-sm opacity-50">{t("vazio")}</p>}
      </div>
    </div>
  );
}
