import { ImageResponse } from "next/og";

export const config = { runtime: "edge" };

export default function handler(req) {
  let variante = "default", valorRaw = null, mesRaw = "", taloesRaw = null, streakRaw = null;
  let nomeRaw = "", tempoRaw = 0, custoRaw = 1;
  try {
    const sp = new URL(req.url).searchParams;
    variante = sp.get("v") || "default";
    valorRaw = sp.get("valor") || sp.get("total");
    mesRaw = (sp.get("mes") || "").slice(0, 12).replace(/[^a-zçã]/gi, "");
    taloesRaw = parseInt(sp.get("taloes")) || 0;
    streakRaw = parseInt(sp.get("streak")) || 0;
    nomeRaw = (sp.get("nome") || "").slice(0, 60);
    tempoRaw = Math.min(parseInt(sp.get("tempo")) || 0, 999);
    custoRaw = Math.min(Math.max(parseInt(sp.get("custo")) || 1, 1), 3);
  } catch {}
  const lista = variante === "lista";
  const retrato = variante === "retrato";
  const receita = variante === "receita";
  const poupanca = variante === "poupanca" || retrato;
  const valorNum = poupanca ? Math.min(Math.max(parseFloat(valorRaw) || 0, 0), 99999) : 0;
  const valorFmt = valorNum.toFixed(2).replace(".", ",");

  const statsRetrato = [taloesRaw > 0 ? `${taloesRaw} tal${taloesRaw !== 1 ? "ões" : "ão"}` : null, streakRaw >= 2 ? `${streakRaw} semanas seguidas` : null].filter(Boolean).join(" · ");
  const eyebrow = lista ? "Lista de compras partilhada"
    : receita ? "Receita económica · 4 pessoas"
    : retrato ? `O meu retrato de ${mesRaw || "mês"}`
    : poupanca ? "Poupança real, medida talão a talão"
    : "A app de poupança portuguesa";
  const titulo1 = lista ? "A nossa lista"
    : receita ? (nomeRaw || "Receita barata")
    : poupanca ? `${retrato ? "Poupei" : "Já poupei"} €${valorFmt}`
    : "Poupa nas compras";
  const titulo2 = lista ? "de compras"
    : receita ? `${tempoRaw ? `${tempoRaw} min · ` : ""}${"€".repeat(custoRaw)} 🍲`
    : retrato ? "num só mês 🐷"
    : poupanca ? "nas compras 🐷"
    : "do dia a dia";
  const subtitulo = lista
    ? "Abre o link e edita a lista comigo — em tempo real, grátis."
    : receita
    ? "Ingredientes direto para a lista de compras — grátis, em poupejá.com"
    : retrato
    ? `${statsRetrato ? statsRetrato + " — " : ""}vê o teu retrato em poupejá.com`
    : poupanca
    ? "Folhetos, talões e combustíveis — experimenta grátis, sem registo."
    : "Folhetos, combustíveis e 50 lojas. Grátis.";

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
              fontSize: receita ? 54 : 70,
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
            { valor: "50",     label: "Lojas" },
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
