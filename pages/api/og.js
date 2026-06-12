import { ImageResponse } from "next/og";

export const config = { runtime: "edge" };

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)",
          fontFamily: "'Inter', system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background geometric shapes */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
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
        <div
          style={{
            position: "absolute",
            top: 200,
            left: -60,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.025)",
            display: "flex",
          }}
        />

        {/* Coin scatter — decorative */}
        {[
          { top: 60, right: 340, size: 48, opacity: 0.12 },
          { top: 110, right: 180, size: 32, opacity: 0.09 },
          { top: 420, right: 90, size: 40, opacity: 0.1 },
          { top: 300, left: 900, size: 36, opacity: 0.09 },
        ].map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: c.top,
              right: c.right,
              left: c.left,
              width: c.size,
              height: c.size,
              borderRadius: "50%",
              border: `3px solid rgba(251,191,36,${c.opacity * 2})`,
              background: `rgba(251,191,36,${c.opacity})`,
              display: "flex",
            }}
          />
        ))}

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "64px 80px",
            height: "100%",
            justifyContent: "space-between",
          }}
        >
          {/* Top: Logo + tagline pill */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.15)",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                }}
              >
                🐷
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: 36,
                    fontWeight: 900,
                    color: "#ffffff",
                    letterSpacing: "-1px",
                    lineHeight: 1,
                  }}
                >
                  PoupeJá
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "rgba(167,243,208,0.9)",
                    letterSpacing: "0.5px",
                    marginTop: 2,
                  }}
                >
                  poupejá.com
                </span>
              </div>
            </div>

            {/* "Grátis" pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(251,191,36,0.18)",
                border: "1.5px solid rgba(251,191,36,0.4)",
                borderRadius: 40,
                padding: "10px 22px",
              }}
            >
              <span style={{ fontSize: 16, color: "#fbbf24" }}>✦</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#fcd34d", letterSpacing: "0.3px" }}>
                100% Grátis
              </span>
            </div>
          </div>

          {/* Center: Main headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                display: "flex",
                background: "rgba(16,185,129,0.2)",
                border: "1px solid rgba(110,231,183,0.3)",
                borderRadius: 8,
                padding: "8px 16px",
                width: "fit-content",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#6ee7b7", letterSpacing: "2px", textTransform: "uppercase" }}>
                🇵🇹 A App de Poupança Portuguesa
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span
                style={{
                  fontSize: 68,
                  fontWeight: 900,
                  color: "#ffffff",
                  letterSpacing: "-2.5px",
                  lineHeight: 1.05,
                }}
              >
                Poupa nas compras
              </span>
              <span
                style={{
                  fontSize: 68,
                  fontWeight: 900,
                  color: "#6ee7b7",
                  letterSpacing: "-2.5px",
                  lineHeight: 1.05,
                }}
              >
                do dia a dia 💸
              </span>
            </div>

            <span
              style={{
                fontSize: 22,
                fontWeight: 400,
                color: "rgba(167,243,208,0.85)",
                lineHeight: 1.5,
                maxWidth: 620,
              }}
            >
              Guarda talões, descobre promoções e desafia-te a poupar mais este mês.
            </span>
          </div>

          {/* Bottom: Social proof stats */}
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { emoji: "🏪", value: "50+", label: "Lojas & Folhetos" },
              { emoji: "🎯", value: "Desafio", label: "Mensal com prémios" },
              { emoji: "🔥", value: "52", label: "Semanas de poupança" },
              { emoji: "⚡", value: "Grátis", label: "Sem publicidade" },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14,
                  padding: "14px 22px",
                  flex: 1,
                }}
              >
                <span style={{ fontSize: 22 }}>{stat.emoji}</span>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", lineHeight: 1 }}>
                    {stat.value}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(167,243,208,0.75)", marginTop: 2 }}>
                    {stat.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
