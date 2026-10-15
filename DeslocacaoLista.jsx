import { useState } from "react";
import { MapPin, Car } from "lucide-react";
import { eur } from "./lib/formato";
import { evento } from "./lib/analytics";
import { nomeCadeia, juntarNomes } from "./lib/cobertura";
import { maisPertoPorCadeia, avaliarDeslocacao, lojasComDeslocacao, CONSUMO_PADRAO } from "./lib/rota";

/*
 * "Compensa a deslocação?" — o total de cada supermercado já com a ida e
 * volta de carro (a loja mais barata pode ficar longe) e, quando a app
 * sugere dividir a lista, se a segunda loja compensa. Só pede a
 * localização quando se toca no botão. O carro (consumo e combustível)
 * fica guardado neste aparelho.
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

export default function DeslocacaoLista({ unica, divisao, porLoja = [] }) {
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
      evento("lista_deslocacao", { lojas: porLoja.length, divisao: !!divisao });
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
  const r = dados && divisao && avaliarDeslocacao({ pos: dados.pos, perto: dados.perto, unica, divisao, consumo: carro.consumo, precoLitro });
  const cl = dados && lojasComDeslocacao({ pos: dados.pos, perto: dados.perto, porLoja, consumo: carro.consumo, precoLitro });
  const melhor = cl?.lojas[0];

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
      ) : (
        <>
          {melhor && (
            <p style={{ fontSize: 13.5, color: "var(--pj-text)", lineHeight: 1.5 }}>
              {melhor.loja === unica.loja
                ? <>Contando o combustível, o <strong>{nomeCadeia(melhor.loja)}</strong> continua a compensar.</>
                : <>Contando o combustível, compensa mais o <strong>{nomeCadeia(melhor.loja)}</strong>: fica mais perto e sai <strong className="pj-num" style={{ color: "var(--pj-brand-ink)" }}>{eur(cl.lojas.find((l) => l.loja === unica.loja)?.total - melhor.total, 2)} €</strong> mais barato.</>}
            </p>
          )}
          {cl?.lojas.map((l) => (
            <p key={l.loja} className="flex justify-between gap-2" style={{ ...pequeno, marginTop: 4 }}>
              <span>{nomeCadeia(l.loja)} · {eur(l.km, 1)} km ida e volta</span>
              <span className="pj-num">{eur(l.compras, 2)} + {eur(l.combustivel, 2)} = <strong style={{ color: "var(--pj-text)" }}>{eur(l.total, 2)} €</strong></span>
            </p>
          ))}
          {cl?.faltam.length > 0 && (
            <p style={{ ...pequeno, marginTop: 4 }}>
              <MapPin size={13} aria-hidden style={{ display: "inline", verticalAlign: "-2px" }} /> Sem {juntarNomes(cl.faltam)} a menos de 15 km.
            </p>
          )}
          {r && !r.faltam && (
            <p style={{ fontSize: 13, color: "var(--pj-text)", lineHeight: 1.5, marginTop: 8 }}>
              Dividir por {juntarNomes(divisao.lojas)}:{" "}
              {r.compensa
                ? <>compensa, ficas com <strong className="pj-num" style={{ color: "var(--pj-brand-ink)" }}>{eur(r.saldo, 2)} €</strong> a mais (poupas {eur(r.poupancaCompras, 2)} €, gastas {eur(r.combustivelExtra, 2)} € em combustível{r.minutosExtra > 0 ? ` e cerca de ${r.minutosExtra} min` : ""}).</>
                : <>não compensa, o combustível a mais come a poupança (perdes <strong className="pj-num">{eur(-r.saldo, 2)} €</strong>).</>}
            </p>
          )}
        </>
      )}

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
