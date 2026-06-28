import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/*
 * Mapa interativo de postos (combustível) usando Leaflet + OpenStreetMap.
 * 100% gratuito, sem chave de API. Carregar SEMPRE via next/dynamic com
 * ssr:false (a Leaflet precisa do objeto `window`).
 *
 * props:
 *   postos    — [{ lat, lon, preco, nome|posto, marca, municipio, distancia }]
 *   userLoc   — { lat, lon } | null
 *   min       — preço mais baixo (para destacar o mais barato)
 *   onNavegar — (lat, lon) => void  (abre direções)
 */
function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

export default function MapaPostos({ postos = [], userLoc, min, onNavegar }) {
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
      const barato = min && Math.abs(p.preco - min) < 0.001;
      const cor = barato ? "#f97316" : "#1e293b";
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${cor};color:#fff;font-weight:900;font-size:11px;line-height:1;padding:4px 6px;border-radius:8px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.35);border:1.5px solid #fff;">${p.preco.toFixed(3)}€</div>`,
        iconSize: [50, 22],
        iconAnchor: [25, 24],
        popupAnchor: [0, -22],
      });
      const m = L.marker([p.lat, p.lon], { icon }).addTo(map);
      const dist = p.distancia != null ? ` · ${p.distancia} km` : "";
      m.bindPopup(
        `<div style="font-family:system-ui;min-width:150px">
           <div style="font-weight:900;color:#0f172a;font-size:13px">${esc(p.nome || p.posto)}</div>
           <div style="font-size:11px;color:#64748b">${esc(p.municipio)}${dist}</div>
           <div style="font-weight:900;color:#f97316;margin-top:4px;font-size:14px">${p.preco.toFixed(3)} €/litro</div>
           <button class="pj-nav" data-lat="${p.lat}" data-lon="${p.lon}" style="margin-top:8px;width:100%;background:#f97316;color:#fff;border:none;font-weight:800;padding:7px;border-radius:8px;font-size:12px;cursor:pointer">Navegar →</button>
         </div>`
      );
      bounds.push([p.lat, p.lon]);
    });

    if (userLoc?.lat && userLoc?.lon) {
      L.circleMarker([userLoc.lat, userLoc.lon], {
        radius: 7, color: "#fff", weight: 2, fillColor: "#3b82f6", fillOpacity: 1,
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
