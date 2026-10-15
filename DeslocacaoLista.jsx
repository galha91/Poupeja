import { useState, useEffect } from "react";
import { Car, Check, Loader2, SlidersHorizontal } from "lucide-react";
import { eur } from "./lib/formato";
import { evento } from "./lib/analytics";
import { maisPertoPorCadeia, avaliarDeslocacao, lojasComDeslocacao, CONSUMO_PADRAO } from "./lib/rota";

/*
 * "Contar o combustível" no resultado da lista. Ligado, cada supermercado
 * passa a mostrar o total com a ida e volta de carro (a loja mais barata
 * pode ficar longe) e a divisão por 2 lojas diz se compensa.
 *
 * useDeslocacao guarda o estado; o ResultadoLista desenha os números nas
 * próprias linhas das lojas, sem um bloco de texto à parte. Só pede a
 * localização quando se liga. O carro fica guardado neste aparelho.
 */

const LS_CARRO = "poupeja_carro";
const TIPOS = ["Gasóleo", "Gasolina 95"];

function lerCarro() {
  try {
    const c = JSON.parse(localStorage.getItem(LS_CARRO) || "{}");
    return { consumo: c.consumo > 0 ? c.consumo : CONSUMO_PADRAO, tipo: TIPOS.includes(c.tipo) ? c.tipo : "Gasóleo", auto: !!c.auto };
  } catch { return { consumo: CONSUMO_PADRAO, tipo: "Gasóleo", auto: false }; }
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

export function useDeslocacao({ unica, divisao, porLoja }) {
  const [estado, setEstado] = useState("desligado"); // desligado | a-ver | ligado | erro
  const [erro, setErro] = useState("");
  const [dados, setDados] = useState(null); // { pos, perto, combustivel }
  const [carro, setCarro] = useState(lerCarro);

  async function ligar(tipo = carro.tipo) {
    setEstado("a-ver");
    setErro("");
    try {
      const pos = dados?.pos || await posicao();
      const r = await fetch(`/api/lojas-perto?lat=${pos.lat.toFixed(2)}&lon=${pos.lon.toFixed(2)}&tipo=${encodeURIComponent(tipo)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.erro || "falhou");
      if (!(j.combustivel?.preco > 0)) throw new Error("Sem o preço do combustível de hoje. Tenta mais logo.");
      setDados({ pos, perto: maisPertoPorCadeia(j.lojas, pos), combustivel: j.combustivel });
      setEstado("ligado");
      evento("lista_deslocacao", { lojas: porLoja.length, divisao: !!divisao });
    } catch (e) {
      setErro(e.message === "recusado" || e.message === "sem-gps"
        ? "Precisamos da localização para saber a que distância ficam as lojas."
        : e.message === "falhou" ? "Não foi possível calcular agora." : e.message);
      setEstado("erro");
    }
  }

  // Quem ligou da última vez encontra-o já ligado — mas só se a
  // localização já estiver autorizada: nunca se pede sem um toque.
  useEffect(() => {
    if (!carro.auto || !navigator.permissions?.query) return;
    navigator.permissions.query({ name: "geolocation" })
      .then((p) => { if (p.state === "granted") ligar(); })
      .catch(() => {});
  }, []);

  function alternar() {
    if (estado === "ligado") { setEstado("desligado"); mudarCarro({ auto: false }); }
    else if (estado !== "a-ver") { ligar(); mudarCarro({ auto: true }); }
  }

  function mudarCarro(novo) {
    const c = { ...carro, ...novo };
    setCarro(c);
    guardarCarro(c);
    if (novo.tipo && novo.tipo !== carro.tipo && dados) ligar(novo.tipo);
  }

  const ligado = estado === "ligado" && dados;
  const precoLitro = dados?.combustivel?.preco;
  const lojas = ligado ? lojasComDeslocacao({ pos: dados.pos, perto: dados.perto, porLoja, consumo: carro.consumo, precoLitro }) : null;
  const divisaoCarro = ligado && divisao ? avaliarDeslocacao({ pos: dados.pos, perto: dados.perto, unica, divisao, consumo: carro.consumo, precoLitro }) : null;
  // loja → { km, combustivel, total } para desenhar nas linhas.
  const porCadeia = lojas ? Object.fromEntries(lojas.lojas.map((l) => [l.loja, l])) : {};

  return { estado, erro, ligado, alternar, carro, mudarCarro, precoLitro, lojas, porCadeia, divisaoCarro };
}

/* O interruptor "Contar o combustível" e, ligado, o carro (editável). */
export function BotaoCombustivel({ d }) {
  const [editar, setEditar] = useState(false);
  const ativo = d.estado === "ligado";
  return (
    <div style={{ padding: "4px 16px 10px" }}>
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={d.alternar} aria-pressed={ativo} className="pj-tap press flex items-center gap-1.5"
          style={{ padding: "7px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
            border: ativo ? "1px solid var(--pj-brand)" : "1px solid var(--pj-border)",
            background: ativo ? "var(--pj-brand-wash)" : "var(--pj-card)", color: ativo ? "var(--pj-brand-ink)" : "var(--pj-text)" }}>
          {d.estado === "a-ver" ? <Loader2 size={14} className="animate-spin" aria-hidden /> : ativo ? <Check size={14} aria-hidden /> : <Car size={14} aria-hidden />}
          Contar o combustível
        </button>
        {ativo && (
          <button onClick={() => setEditar((e) => !e)} aria-expanded={editar} className="pj-tap flex items-center gap-1"
            style={{ padding: "7px 4px", border: 0, background: "transparent", fontSize: 12, color: "var(--pj-text-muted)" }}>
            <SlidersHorizontal size={13} aria-hidden /> {String(d.carro.consumo).replace(".", ",")} L/100 · {d.carro.tipo}
          </button>
        )}
      </div>
      {d.estado === "erro" && <p style={{ fontSize: 12, color: "var(--pj-text-muted)", marginTop: 6 }}>{d.erro}</p>}
      {ativo && editar && (
        <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 8 }}>
          <label className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--pj-text-muted)" }}>
            <input type="number" inputMode="decimal" min="2" max="20" step="0.1" value={d.carro.consumo} aria-label="Consumo em litros aos 100 km"
              onChange={(e) => { const v = parseFloat(e.target.value); if (v > 0 && v <= 30) d.mudarCarro({ consumo: v }); }}
              className="pj-num" style={{ width: 58, padding: "5px 6px", borderRadius: 8, border: "1px solid var(--pj-border)", background: "var(--pj-card)", color: "var(--pj-text)", fontSize: 13 }} />
            L/100 km
          </label>
          {["Gasóleo", "Gasolina 95"].map((t) => (
            <button key={t} onClick={() => d.mudarCarro({ tipo: t })} aria-pressed={d.carro.tipo === t} className="pj-tap"
              style={{ padding: "5px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, border: 0,
                background: d.carro.tipo === t ? "var(--pj-text)" : "var(--pj-subtle)", color: d.carro.tipo === t ? "var(--pj-card)" : "var(--pj-text)" }}>
              {t}
            </button>
          ))}
        </div>
      )}
      {ativo && (
        <p style={{ fontSize: 11, color: "var(--pj-text-faint)", marginTop: 6 }}>
          Ida e volta à loja mais perto · {d.carro.tipo} a {eur(d.precoLitro, 3)} €/L · estimativa
        </p>
      )}
    </div>
  );
}
