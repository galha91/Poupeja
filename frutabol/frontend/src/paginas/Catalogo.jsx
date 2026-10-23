import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useIdioma } from "../i18n.jsx";
import { CartaoPersonagem, Carregando } from "../componentes.jsx";

export default function Catalogo() {
  const { t } = useIdioma();
  const [personagens, setPersonagens] = useState(null);
  const [q, setQ] = useState("");
  const [raridade, setRaridade] = useState("");
  const [soFavoritos, setSoFavoritos] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (raridade) p.set("raridade", raridade);
    const timer = setTimeout(() => {
      api(`/catalogo?${p}`).then((r) => setPersonagens(r.personagens)).catch(() => setPersonagens([]));
    }, 250); // debounce da pesquisa
    return () => clearTimeout(timer);
  }, [q, raridade]);

  const visiveis = (personagens || []).filter((p) => !soFavoritos || p.favorito);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-display font-bold text-3xl mb-6">{t("catalogo")}</h1>
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("pesquisar")} className="campo flex-1" />
        <select value={raridade} onChange={(e) => setRaridade(e.target.value)} className="campo sm:w-44">
          <option value="">{t("raridade")}: {t("todas")}</option>
          <option value="COMUM">{t("comum")}</option>
          <option value="RARO">{t("raro")}</option>
          <option value="EPICO">{t("epico")}</option>
          <option value="LENDARIO">{t("lendario")}</option>
        </select>
        <button onClick={() => setSoFavoritos((f) => !f)}
          className={`botao-fantasma ${soFavoritos ? "!border-amber-400 text-amber-400" : ""}`}>
          ❤️
        </button>
      </div>
      {!personagens ? (
        <Carregando />
      ) : visiveis.length === 0 ? (
        <p className="opacity-60 py-12 text-center">{t("vazio")}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visiveis.map((p) => <CartaoPersonagem key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
