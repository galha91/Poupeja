// Loja de moedas — FASE 2. Com PAYMENTS_ENABLED=false mostra apenas as
// formas gratuitas de ganhar moedas; com true, lista os packs e abre o
// checkout do Lemon Squeezy.
import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useIdioma } from "../i18n.jsx";
import { useSessao } from "../sessao.jsx";
import { Erro } from "../componentes.jsx";

export default function Moedas() {
  const { t } = useIdioma();
  const { user } = useSessao();
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api("/moedas/packs").then(setDados).catch(() => setDados({ pagamentosAtivos: false, packs: [] }));
  }, []);

  async function comprar(packId) {
    setErro("");
    try {
      const r = await api("/moedas/checkout", { method: "POST", body: { packId } });
      window.open(r.url, "_blank");
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-aparecer">
      <h1 className="font-display font-bold text-3xl mb-6">🪙 {t("packs")}</h1>
      <Erro mensagem={erro} />

      {dados && !dados.pagamentosAtivos && (
        <div className="carta p-6 text-center">
          <div className="text-4xl mb-3">🌱</div>
          <p className="opacity-80">{t("brevemente")}</p>
          <div className="grid sm:grid-cols-3 gap-3 mt-6 text-sm">
            <div className="carta !shadow-none p-3">🎁 +500 · {t("registar")}</div>
            <div className="carta !shadow-none p-3">📅 +50 · {t("bonusDiario")}</div>
            <div className="carta !shadow-none p-3">🤝 +200 · {t("convida")}</div>
          </div>
        </div>
      )}

      {dados?.pagamentosAtivos && (
        <div className="grid sm:grid-cols-3 gap-4">
          {dados.packs.map((p) => (
            <div key={p.id} className="carta p-5 text-center">
              <div className="text-3xl mb-2">🧺</div>
              <h3 className="font-bold">{p.nome}</h3>
              <div className="text-2xl font-display font-extrabold my-2">{p.moedas} 🪙</div>
              <div className="opacity-70 mb-4">{(p.precoCents / 100).toFixed(2)} €</div>
              <button onClick={() => comprar(p.id)} disabled={!user} className="botao-primario w-full">
                {t("comprar")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
