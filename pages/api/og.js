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
          background: "linear-gradient(135deg, #064e3b 0%, #047857 100%)",
          justifyContent: "center",
          alignItems: "center",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: "80px", fontWeight: "bold", marginBottom: "20px" }}>
          PoupeJá
        </div>
        <div style={{ fontSize: "48px", marginBottom: "30px", textAlign: "center" }}>
          Poupa nas compras do dia a dia
        </div>
        <div style={{ fontSize: "24px", color: "#a3f3d0" }}>
          poupejá.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
