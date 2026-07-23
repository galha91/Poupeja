import { useState } from "react";
import { LOGO } from "./lib/seo-slugs";

/*
 * Logótipo oficial de um supermercado — fonte única partilhada pelo ecrã
 * Início ("Folhetos a acabar") e pelo separador Mercado, para que nunca
 * divirjam.
 *
 * Ordem das fontes (a primeira que carregar ganha):
 *   1. Clearbit — logótipo real da empresa (colorido, boa qualidade)
 *   2. Favicon oficial do site via Google — quase sempre devolve algo
 *   3. Desenho local em /public/logos — rede de segurança offline
 *   4. Inicial da loja — último recurso
 *
 * As duas primeiras são externas: falham aqui no sandbox (rede restrita),
 * mas carregam sem problema no dispositivo de quem usa a app.
 */
const DOMINIO = {
  "Continente":      "continente.pt",
  "Pingo Doce":      "pingodoce.pt",
  "Lidl":            "lidl.pt",
  "Aldi":            "aldi.pt",
  "Intermarché":     "intermarche.pt",
  "Auchan":          "auchan.pt",
  "E.Leclerc":       "e-leclerc.pt",
  "El Corte Inglés": "elcorteingles.pt",
  "Froiz":           "froiz.pt",
};

export default function LogoLoja({ loja, size = 44, radius = 12, bg = "#eeece4" }) {
  const dominio = DOMINIO[loja];
  const chave = LOGO[loja];
  const [nivel, setNivel] = useState(0);

  const fontes = [
    ...(dominio ? [
      `https://logo.clearbit.com/${dominio}`,
      `https://www.google.com/s2/favicons?domain=${dominio}&sz=128`,
    ] : []),
    ...(chave ? [`/logos/${chave}.svg`] : []),
  ];
  const inicial = (loja || "?")[0].toUpperCase();

  return (
    <div
      className="flex items-center justify-center flex-none overflow-hidden"
      style={{ width: size, height: size, borderRadius: radius, background: bg }}
    >
      {nivel < fontes.length ? (
        <img
          src={fontes[nivel]}
          alt={loja}
          onError={() => setNivel(n => n + 1)}
          style={{ width: "100%", height: "100%", objectFit: "contain", padding: Math.round(size * 0.16) }}
        />
      ) : (
        <span style={{ fontSize: Math.round(size * 0.34), fontWeight: 700, color: "#2c3b33" }}>{inicial}</span>
      )}
    </div>
  );
}
