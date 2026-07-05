import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useIdioma } from "../i18n.jsx";
import { CartaoPersonagem, Carregando } from "../componentes.jsx";

export default function Inicio() {
  const { t } = useIdioma();
  const [personagens, setPersonagens] = useState(null);

  useEffect(() => {
    api("/catalogo").then((r) => setPersonagens(r.personagens)).catch(() => setPersonagens([]));
  }, []);

  const emLeilao = (personagens || []).filter((p) => p.leilao?.estado === "ATIVO").slice(0, 8);

  return (
    <div className="max-w-6xl mx-auto px-4">
      <section className="py-16 text-center">
        <h1 className="font-display font-extrabold text-4xl sm:text-6xl leading-tight">
          🍌⚽ FrutaBol
        </h1>
        <p className="mt-4 text-lg opacity-75 max-w-xl mx-auto">{t("slogan")}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/catalogo" className="botao-primario">{t("verTudo")}</Link>
          <Link to="/entrar" className="botao-fantasma">{t("registar")}</Link>
        </div>
      </section>

      <section>
        <h2 className="font-display font-bold text-2xl mb-4">{t("destaque")}</h2>
        {!personagens ? (
          <Carregando />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(emLeilao.length ? emLeilao : personagens.slice(0, 8)).map((p) => (
              <CartaoPersonagem key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      <section className="py-16">
        <h2 className="font-display font-bold text-2xl mb-6">{t("comoFunciona")}</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            ["🪙", t("passo1"), t("passo1txt")],
            ["🔨", t("passo2"), t("passo2txt")],
            ["📜", t("passo3"), t("passo3txt")],
          ].map(([emoji, titulo, texto]) => (
            <div key={titulo} className="carta p-5">
              <div className="text-3xl mb-2">{emoji}</div>
              <h3 className="font-bold mb-1">{titulo}</h3>
              <p className="text-sm opacity-70">{texto}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
