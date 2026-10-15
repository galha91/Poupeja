import { useState } from "react";
import { MapPin, Car } from "lucide-react";
import { eur } from "./lib/formato";
import { evento } from "./lib/analytics";
import { nomeCadeia, juntarNomes } from "./lib/cobertura";
import { maisPertoPorCadeia, avaliarDeslocacao, CONSUMO_PADRAO } from "./lib/rota";

/*
 * "Compensa ir a mais um supermercado?" — dentro do bloco da divisão da
 * lista. Só pede a localização quando se toca no botão. O carro (consumo
 * e combustível) fica guardado neste aparelho.
 */

const LS_CARRO = "poupeja_carro";
const TIPOS = ["Gasóleo", "Gasolina 95"];

function lerCarro() {
  try {
    const c = JSON.parse(localStorage.getItem(LS_CARRO) || "{}");
    return { consumo: c.consumo > 0 ? c.consumo : CONSUMO_PADRAO, tipo: TIPOS.includes(c.tipo) ? c.tipo : "Gasóleo" };
  } catch { return { consumo: CONSUMO_PADRAO, tipo: "Gasóleo" }; }
}
function guardarCarro(c) {
  try { localStorage.setItem(LS_CARRO, JSON.stringify(c)); } catch {}
}

function posicao() {
  return new Promise((ok, falha) => {
    if (!navigator.geolocation) return falha(new Error("sem-gps"));
    navigator.geolocation.getCurrentPosition(
      (p) => ok({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => falha(new Error("recusado")),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  });
}

export default function DeslocacaoLista({ unica, divisao }) {
  const [estado, setEstado] = useState("inicio"); // inicio | a-ver | pronto | erro
  const [erro, setErro] = useState("");
  const [dados, setDados] = useState(null); // { pos, perto, combustivel }
  const [carro, setCarro] = useState(lerCarro);

  async function ver(tipo = carro.tipo) {
    setEstado("a-ver");
    setErro("");
    try {
      const pos = dados?.pos || await posicao();
      const r = await fetch(`/api/lojas-perto?lat=${pos.lat.toFixed(2)}&lon=${pos.lon.toFixed(2)}&tipo=${encodeURIComponent(tipo)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.erro || "falhou");
      setDados({ pos, perto: maisPertoPorCadeia(j.lojas, pos), combustivel: j.combustivel });
      setEstado("pronto");
      evento("lista_deslocacao", { lojas: divisao.lojas.join("+") });
    } catch (e) {
      setErro(e.message === "recusado" || e.message === "sem-gps"
        ? "Sem a localização não dá para saber a que distância ficam as lojas."
        : e.message === "falhou" ? "Não foi possível calcular agora. Tenta daqui a pouco." : e.message);
      setEstado("erro");
    }
  }

  function mudarCarro(novo) {
    const c = { ...carro, ...novo };
    setCarro(c);
    guardarCarro(c);
    if (novo.tipo && novo.tipo !== carro.tipo && dados) ver(novo.tipo);
  }

  const precoLitro = dados?.combustivel?.preco;
  const r = dados && avaliarDeslocacao({ pos: dados.pos, perto: dados.perto, unica, divisao, consumo: carro.consumo, precoLitro });

  const pequeno = { fontSize: 12, color: "var(--pj-text-muted)", lineHeight: 1.5 };

  if (estado === "inicio" || estado === "a-ver") {
    return (
      <button onClick={() => ver()} disabled={estado === "a-ver"} className="pj-tap flex items-center gap-1.5"
        style={{ background: "transparent", border: 0, padding: "8px 0 0", fontSize: 12.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
        <Car size={14} aria-hidden /> {estado === "a-ver" ? "A calcular…" : "Compensa a deslocação? Contar o combustível"}
      </button>
    );
  }

  if (estado === "erro") {
    return (
      <p style={{ ...pequeno, marginTop: 8 }}>
        {erro}{" "}
        <button onClick={() => ver()} className="pj-tap" style={{ background: "transparent", border: 0, padding: 0, fontWeight: 600, color: "var(--pj-brand-ink)" }}>Tentar de novo</button>
      </p>
    );
  }

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--pj-border)" }}>
      {!precoLitro ? (
        <p style={pequeno}>Sem o preço do combustível de hoje, não dá para fazer a conta. Tenta mais logo.</p>
      ) : r?.faltam ? (
        <p style={pequeno}>
          <MapPin size={13} aria-hidden style={{ display: "inline", verticalAlign: "-2px" }} /> Não encontrámos {juntarNomes(r.faltam)} a menos de 15 km.
        </p>
      ) : r ? (
        <>
          <p style={{ fontSize: 13.5, color: "var(--pj-text)", lineHeight: 1.5 }}>
            {r.compensa ? (
              <>Compensa: ficas com <strong className="pj-num" style={{ color: "var(--pj-brand-ink)" }}>{eur(r.saldo, 2)} €</strong> a mais, já descontado o combustível.</>
            ) : (
              <>Não compensa: o combustível a mais come a poupança e perdes <strong className="pj-num">{eur(-r.saldo, 2)} €</strong>. Compra tudo no {nomeCadeia(unica.loja)}.</>
            )}
          </p>
          <p style={{ ...pequeno, marginTop: 4 }}>
            Poupas <span className="pj-num">{eur(r.poupancaCompras, 2)} €</span> nas compras, gastas <span className="pj-num">{eur(r.combustivelExtra, 2)} €</span> em {carro.tipo.toLowerCase()} ({eur(r.kmExtra, 1)} km a mais)
            {r.minutosExtra > 0 ? ` e cerca de ${r.minutosExtra} min.` : "."}
          </p>
          <p style={{ ...pequeno, marginTop: 4 }}>
            Lojas mais perto: {[unica.loja, ...divisao.lojas].filter((c, i, a) => a.indexOf(c) === i)
              .map((c) => `${nomeCadeia(c)} a ${eur(dados.perto[c].km, 1)} km`).join(" · ")}.
          </p>
        </>
      ) : null}

      <div className="flex flex-wrap items-center gap-2" style={{ marginTop: 8 }}>
        <label style={{ ...pequeno, display: "flex", alignItems: "center", gap: 6 }}>
          Consumo
          <input type="number" inputMode="decimal" min="2" max="20" step="0.1" value={carro.consumo}
            onChange={(e) => { const v = parseFloat(e.target.value); if (v > 0 && v <= 30) mudarCarro({ consumo: v }); }}
            className="pj-num" style={{ width: 60, padding: "4px 6px", borderRadius: 8, border: "1px solid var(--pj-border)", background: "var(--pj-card)", color: "var(--pj-text)", fontSize: 13 }} />
          L/100 km
        </label>
        <select value={carro.tipo} onChange={(e) => mudarCarro({ tipo: e.target.value })} aria-label="Combustível"
          style={{ padding: "4px 6px", borderRadius: 8, border: "1px solid var(--pj-border)", background: "var(--pj-card)", color: "var(--pj-text)", fontSize: 13 }}>
          {TIPOS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <p style={{ fontSize: 11, color: "var(--pj-text-faint)", marginTop: 6, lineHeight: 1.5 }}>
        Estimativa: distância em linha reta + 30 % de estrada, a partir de onde estás.
        {precoLitro ? ` ${carro.tipo} a ${eur(precoLitro, 3)} €/L (média nacional DGEG).` : ""} Lojas do OpenStreetMap.
      </p>
    </div>
  );
}
