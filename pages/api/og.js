import { ImageResponse } from "next/og";

export const config = { runtime: "edge" };

export default function handler(req) {
  let variante = "default", valorRaw = null;
  try {
    const sp = new URL(req.url).searchParams;
    variante = sp.get("v") || "default";
    valorRaw = sp.get("valor");
  } catch {}
  const lista = variante === "lista";
  const poupanca = variante === "poupanca";
  const valorNum = poupanca ? Math.min(Math.max(parseFloat(valorRaw) || 0, 0), 99999) : 0;
  const valorFmt = valorNum.toFixed(2).replace(".", ",");

  const eyebrow = lista ? "Lista de compras partilhada"
    : poupanca ? "Poupança real, medida talão a talão"
    : "A app de poupança portuguesa";
  const titulo1 = lista ? "A nossa lista"
    : poupanca ? `Já poupei €${valorFmt}`
    : "Poupa nas compras";
  const titulo2 = lista ? "de compras"
    : poupanca ? "nas compras 🐷"
    : "do dia a dia";
  const subtitulo = lista
    ? "Abre o link e edita a lista comigo — em tempo real, grátis."
    : poupanca
    ? "Folhetos, talões e combustíveis — experimenta grátis, sem registo."
    : "Folhetos, combustíveis e mais de 50 lojas. Grátis.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #084c39 0%, #0b6b4f 100%)",
          padding: "60px 80px",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
          fontFamily: "system-ui",
        }}
      >
        {/* Círculos decorativos */}
        <div
          style={{
            position: "absolute",
            top: -150,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            display: "flex",
          }}
        />

        {/* Cabeçalho */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: 18,
                background: "rgba(255,255,255,0.15)",
                border: "2px solid rgba(255,255,255,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: "900",
                color: "#ffffff",
              }}
            >
              PJ
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: "900",
                  lineHeight: "1",
                  marginBottom: 4,
                  display: "flex",
                }}
              >
                PoupeJá
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "rgba(167,243,208,0.9)",
                  display: "flex",
                }}
              >
                poupejá.com
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: "800",
              background: "rgba(251,191,36,0.2)",
              border: "1.5px solid rgba(251,191,36,0.5)",
              borderRadius: 40,
              padding: "10px 22px",
              color: "#fcd34d",
              display: "flex",
            }}
          >
            100% Grátis
          </div>
        </div>

        {/* Conteúdo principal */}
        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: "#6ee7b7",
              letterSpacing: "2px",
              marginBottom: 24,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              fontSize: 70,
              fontWeight: "900",
              lineHeight: "1.05",
              marginBottom: 12,
              display: "flex",
            }}
          >
            {titulo1}
          </div>
          <div
            style={{
              fontSize: 70,
              fontWeight: "900",
              lineHeight: "1.05",
              color: "#6ee7b7",
              marginBottom: 20,
              display: "flex",
            }}
          >
            {titulo2}
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: "400",
              color: "rgba(167,243,208,0.85)",
              lineHeight: "1.6",
              maxWidth: 600,
              display: "flex",
            }}
          >
            {subtitulo}
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div
          style={{
            display: "flex",
            gap: 16,
            position: "relative",
            zIndex: 10,
          }}
        >
          {[
            { valor: "50+",    label: "Lojas" },
            { valor: "9",      label: "Supermercados" },
            { valor: "52",     label: "Semanas poupança" },
            { valor: "0 ads",  label: "Sem publicidade" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    fontWeight: "800",
                    fontSize: 18,
                    display: "flex",
                    color: "#ffffff",
                  }}
                >
                  {item.valor}
                </div>
                <div
                  style={{
                    color: "rgba(167,243,208,0.75)",
                    fontSize: 11,
                    marginTop: 2,
                    display: "flex",
                  }}
                >
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
