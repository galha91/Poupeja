import { useState } from "react";

const LOJA_CONFIG = {
  "Continente": { cor: "#e63329", dominio: "continente.pt" },
  "Pingo Doce": { cor: "#009a3e", dominio: "pingodoce.pt" },
  "Lidl": { cor: "#0050aa", dominio: "lidl.pt" },
  "Aldi": { cor: "#1a3b6f", dominio: "aldi.pt" },
  "Intermarché": { cor: "#e2001a", dominio: "intermarche.pt" },
  "Fnac": { cor: "#f7a600", dominio: "fnac.pt" },
  "Worten": { cor: "#e30613", dominio: "worten.pt" },
  "MediaMarkt": { cor: "#cc0000", dominio: "mediamarkt.pt" },
  "PC Diga": { cor: "#0066cc", dominio: "pcdiga.com" },
  "El Corte Inglés": { cor: "#006633", dominio: "elcorteingles.pt" },
  "Zara": { cor: "#1a1a1a", dominio: "zara.com" },
  "H&M": { cor: "#e50010", dominio: "hm.com" },
  "Mango": { cor: "#b8934a", dominio: "mango.com" },
  "Pull&Bear": { cor: "#333333", dominio: "pullandbear.com" },
  "Stradivarius": { cor: "#8b6914", dominio: "stradivarius.com" },
  "Bershka": { cor: "#ff6b35", dominio: "bershka.com" },
};

export function LogoLoja({ loja, size = 32, rounded = "rounded-xl", showName = false }) {
  const config = LOJA_CONFIG[loja];
  const cor = config?.cor || "#888888";
  const dominio = config?.dominio;
  const [erro, setErro] = useState(false);

  const iniciais = loja.split(/[\s&]+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const logoUrl = dominio ? `https://logo.clearbit.com/${dominio}` : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div
        className={rounded}
        style={{
          width: size, height: size, flexShrink: 0,
          backgroundColor: cor + "18", border: `1.5px solid ${cor}33`,
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
        }}
      >
        {!erro && logoUrl ? (
          <img
            src={logoUrl}
            alt={loja}
            onError={() => setErro(true)}
            style={{ width: size * 0.75, height: size * 0.75, objectFit: "contain" }}
          />
        ) : (
          <span style={{ fontSize: size * 0.32, fontWeight: 900, color: cor, letterSpacing: "-0.5px" }}>
            {iniciais}
          </span>
        )}
      </div>
      {showName && (
        <span style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textAlign: "center" }}>
          {loja.split(" ")[0]}
        </span>
      )}
    </div>
  );
}

export { LOJA_CONFIG };
export default LogoLoja;
