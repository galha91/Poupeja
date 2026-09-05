import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/*
 * Mapa interativo de postos (combustível) usando Leaflet + OpenStreetMap.
 * 100% gratuito, sem chave de API. Carregar SEMPRE via next/dynamic com
 * ssr:false (a Leaflet precisa do objeto `window`).
 *
 * props:
 *   postos    — combustível: [{ lat, lon, preco, nome|posto, municipio, distancia }]
 *               ev:          [{ lat, lon, estado, nome, operador, potencia/potenciaNum, distancia }]
 *   variante  — "combustivel" (defeito) | "ev"
 *   userLoc   — { lat, lon } | null
 *   min       — preço mais baixo (só combustível; destaca o mais barato)
 *   onNavegar — (lat, lon) => void  (abre direções)
 */
function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// Devolve a configuração visual de cada pino conforme o tipo
function configPino(p, variante, min) {
  if (variante === "ev") {
    const est = p.estado;
    const cor = est === "ocupado" ? "#ba4a4a" : est === "manutenção" ? "#a6763f" : "#2e7a63";
    const kw = p.potenciaNum || parseInt(p.potencia) || 0;
    const estLabel = est === "ocupado" ? "Ocupado" : est === "manutenção" ? "Manutenção" : "Disponível";
    return {
      cor,
      label: kw ? `${kw}kW` : "EV",
      titulo: p.nome || "Posto EV",
      sub: `${esc(p.operador || "")}${p.distancia != null ? ` · ${p.distancia} km` : ""}`,
      destaque: `${kw ? `${kw} kW · ` : ""}${estLabel}`,
    };
  }
  const barato = min && Math.abs(p.preco - min) < 0.001;
  return {
    cor: barato ? "#f97316" : "#1e293b",
    label: `${p.preco.toFixed(3)}€`,
    titulo: p.nome || p.posto || "",
    sub: `${esc(p.municipio || "")}${p.distancia != null ? ` · ${p.distancia} km` : ""}`,
    destaque: `${p.preco.toFixed(3)} €/litro`,
  };
}

export default function MapaPostos({ postos = [], variante = "combustivel", userLoc, min, onNavegar }) {
  const elRef  = useRef(null);
  const mapRef = useRef(null);
  const navRef = useRef(onNavegar);
  navRef.current = onNavegar;

  // Cria o mapa uma vez
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, { zoomControl: true, scrollWheelZoom: false });
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    map.setView([39.5, -8], 6); // Portugal por defeito

    // Botão "Navegar" dentro dos popups
    map.on("popupopen", (e) => {
      const btn = e.popup.getElement()?.querySelector(".pj-nav");
      if (btn) btn.onclick = () => {
        const lat = btn.getAttribute("data-lat");
        const lon = btn.getAttribute("data-lon");
        if (navRef.current) navRef.current(lat, lon);
        else window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, "_blank", "noopener");
      };
    });

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Atualiza os marcadores quando os postos mudam
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.eachLayer(l => { if (l instanceof L.Marker || l instanceof L.CircleMarker) map.removeLayer(l); });

    const pts = postos.filter(p => p.lat && p.lon);
    const bounds = [];

    pts.forEach(p => {
      const cfg = configPino(p, variante, min);
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${cfg.cor};color:#fff;font-weight:900;font-size:11px;line-height:1;padding:4px 6px;border-radius:8px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.35);border:1.5px solid #fff;">${esc(cfg.label)}</div>`,
        iconSize: [50, 22],
        iconAnchor: [25, 24],
        popupAnchor: [0, -22],
      });
      const m = L.marker([p.lat, p.lon], { icon }).addTo(map);
      m.bindPopup(
        `<div style="font-family:system-ui;min-width:150px">
           <div style="font-weight:900;color:var(--pj-text);font-size:13px">${esc(cfg.titulo)}</div>
           <div style="font-size:11px;color:#5f718c">${cfg.sub}</div>
           <div style="font-weight:900;color:${cfg.cor};margin-top:4px;font-size:14px">${esc(cfg.destaque)}</div>
           <button class="pj-nav" data-lat="${p.lat}" data-lon="${p.lon}" style="margin-top:8px;width:100%;background:${cfg.cor};color:#fff;border:none;font-weight:800;padding:7px;border-radius:8px;font-size:12px;cursor:pointer">Navegar →</button>
         </div>`
      );
      bounds.push([p.lat, p.lon]);
    });

    if (userLoc?.lat && userLoc?.lon) {
      L.circleMarker([userLoc.lat, userLoc.lon], {
        radius: 7, color: "#fff", weight: 2, fillColor: "#456fb5", fillOpacity: 1,
      }).addTo(map).bindPopup("A tua localização");
      bounds.push([userLoc.lat, userLoc.lon]);
    }

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
    // Garante que o mapa se redesenha quando passa a estar visível
    setTimeout(() => map.invalidateSize(), 60);
  }, [postos, userLoc, min]);

  return <div ref={elRef} style={{ width: "100%", height: 380 }} className="rounded-2xl overflow-hidden border border-slate-200 z-0" />;
}
