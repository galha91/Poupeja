import { ImageResponse } from "next/og";

export const config = { runtime: "edge" };

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%)",
          position: "relative",
          overflow: "hidden",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "480px", height: "480px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: "-60px", left: "-60px", width: "340px", height: "340px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", display: "flex" }} />
        <div style={{ position: "absolute", top: "180px", right: "80px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", display: "flex" }} />

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "52px 72px 0 72px" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "20px", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: "38px", display: "flex" }}>🐷</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "40px", fontWeight: "900", color: "#ffffff", letterSpacing: "-1.5px", lineHeight: "1", display: "flex" }}>PoupeJá</div>
              <div style={{ fontSize: "15px", fontWeight: "600", color: "rgba(167,243,208,0.9)", marginTop: "3px", display: "flex" }}>poupejá.com</div>
            </div>
          </div>

          {/* Free badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(251,191,36,0.15)", border: "1.5px solid rgba(251,191,36,0.45)", borderRadius: "40px", padding: "12px 26px" }}>
            <div style={{ fontSize: "18px", color: "#fbbf24", display: "flex" }}>★</div>
            <div style={{ fontSize: "17px", fontWeight: "800", color: "#fcd34d", display: "flex" }}>100% Grátis</div>
          </div>
        </div>

        {/* Main headline */}
        <div style={{ display: "flex", flexDirection: "column", padding: "42px 72px 0 72px", gap: "16px" }}>
          {/* Badge */}
          <div style={{ display: "flex", background: "rgba(16,185,129,0.2)", border: "1px solid rgba(110,231,183,0.35)", borderRadius: "8px", padding: "8px 18px", width: "fit-content" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#6ee7b7", letterSpacing: "2px", display: "flex" }}>
              A APP DE POUPANÇA PORTUGUESA
            </div>
          </div>

          {/* Headline */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "72px", fontWeight: "900", color: "#ffffff", letterSpacing: "-3px", lineHeight: "1.05", display: "flex" }}>
              Poupa nas compras
            </div>
            <div style={{ fontSize: "72px", fontWeight: "900", color: "#6ee7b7", letterSpacing: "-3px", lineHeight: "1.05", display: "flex" }}>
              do dia a dia
            </div>
          </div>

          {/* Subtitle */}
          <div style={{ fontSize: "22px", fontWeight: "400", color: "rgba(167,243,208,0.85)", lineHeight: "1.5", maxWidth: "640px", display: "flex" }}>
            Guarda talões, folhetos e desafia-te a poupar mais este mês.
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "flex", gap: "14px", padding: "36px 72px 0 72px" }}>
          <div style={{ display: "flex", flex: "1", alignItems: "center", gap: "14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", padding: "16px 22px" }}>
            <div style={{ fontSize: "24px", display: "flex" }}>🏪</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff", lineHeight: "1", display: "flex" }}>50+</div>
              <div style={{ fontSize: "12px", color: "rgba(167,243,208,0.75)", marginTop: "3px", display: "flex" }}>Lojas & Folhetos</div>
            </div>
          </div>
          <div style={{ display: "flex", flex: "1", alignItems: "center", gap: "14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", padding: "16px 22px" }}>
            <div style={{ fontSize: "24px", display: "flex" }}>🎯</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff", lineHeight: "1", display: "flex" }}>Desafio</div>
              <div style={{ fontSize: "12px", color: "rgba(167,243,208,0.75)", marginTop: "3px", display: "flex" }}>Mensal com prémios</div>
            </div>
          </div>
          <div style={{ display: "flex", flex: "1", alignItems: "center", gap: "14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", padding: "16px 22px" }}>
            <div style={{ fontSize: "24px", display: "flex" }}>52</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff", lineHeight: "1", display: "flex" }}>Semanas</div>
              <div style={{ fontSize: "12px", color: "rgba(167,243,208,0.75)", marginTop: "3px", display: "flex" }}>Desafio anual de poupança</div>
            </div>
          </div>
          <div style={{ display: "flex", flex: "1", alignItems: "center", gap: "14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", padding: "16px 22px" }}>
            <div style={{ fontSize: "24px", display: "flex" }}>⚡</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff", lineHeight: "1", display: "flex" }}>Grátis</div>
              <div style={{ fontSize: "12px", color: "rgba(167,243,208,0.75)", marginTop: "3px", display: "flex" }}>Sem publicidade</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
