import { useState, useEffect } from "react";
import { Car, Loader2, SlidersHorizontal } from "lucide-react";
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
        ? "Autoriza a localização para sabermos a que distância ficam as lojas."
        : e.message.startsWith("Sem o preço") ? e.message
        : "Não conseguimos encontrar as lojas perto de ti agora. Tenta outra vez.");
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

/*
 * Desligado: um cartão que se vê ("Vais de carro?") com um botão claro.
 * Ligado: uma linha compacta com o carro (editável) e "Desligar".
 */
export function BotaoCombustivel({ d }) {
  const [editar, setEditar] = useState(false);
  const ativo = d.estado === "ligado";
  const aVer = d.estado === "a-ver";

  if (!ativo) {
    return (
      <div style={{ margin: "8px 16px 4px", padding: "12px 12px 12px 14px", borderRadius: 14, background: "var(--pj-accent-wash, var(--pj-warn-wash))", border: "1px solid var(--pj-warn-border, var(--pj-border))" }}>
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center flex-none" style={{ width: 38, height: 38, borderRadius: 12, background: "var(--pj-card)", color: "var(--pj-text)" }}>
            <Car size={20} aria-hidden />
          </span>
          <span className="flex-1 min-w-0">
            <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "var(--pj-text)" }}>Vais de carro?</span>
            <span style={{ display: "block", fontSize: 12, color: "var(--pj-text-muted)", lineHeight: 1.35, marginTop: 1 }}>
              {d.estado === "erro" ? d.erro : "Somamos o combustível até cada loja e mostramos onde compensa mesmo."}
            </span>
          </span>
          <button onClick={d.alternar} disabled={aVer} className="pj-tap press flex items-center gap-1.5 flex-none"
            style={{ padding: "9px 14px", borderRadius: 999, border: 0, fontSize: 13, fontWeight: 700, background: "var(--pj-brand)", color: "#fff", opacity: aVer ? 0.8 : 1 }}>
            {aVer ? <><Loader2 size={14} className="animate-spin" aria-hidden /> A ver</> : d.estado === "erro" ? "Tentar" : "Calcular"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "6px 16px 4px" }}>
      <div className="flex items-center gap-2 flex-wrap" style={{ padding: "8px 10px", borderRadius: 12, background: "var(--pj-brand-wash)" }}>
        <Car size={16} aria-hidden style={{ color: "var(--pj-brand-ink)" }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--pj-brand-ink)" }}>Já com o combustível</span>
        <button onClick={() => setEditar((e) => !e)} aria-expanded={editar} className="pj-tap flex items-center gap-1"
          style={{ padding: "2px 4px", border: 0, background: "transparent", fontSize: 12, color: "var(--pj-text-muted)" }}>
          <SlidersHorizontal size={13} aria-hidden /> {String(d.carro.consumo).replace(".", ",")} L/100 · {d.carro.tipo}
        </button>
        <button onClick={d.alternar} className="pj-tap" style={{ marginLeft: "auto", padding: "2px 4px", border: 0, background: "transparent", fontSize: 12, fontWeight: 600, color: "var(--pj-text-muted)" }}>
          Desligar
        </button>
      </div>
      {editar && (
        <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 8 }}>
          <label className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--pj-text-muted)" }}>
            <input type="number" inputMode="decimal" min="2" max="20" step="0.1" value={d.carro.consumo} aria-label="Consumo em litros aos 100 km"
              onChange={(e) => { const v = parseFloat(e.target.value); if (v > 0 && v <= 30) d.mudarCarro({ consumo: v }); }}
              className="pj-num" style={{ width: 58, padding: "5px 6px", borderRadius: 8, border: "1px solid var(--pj-border)", background: "var(--pj-card)", color: "var(--pj-text)", fontSize: 13 }} />
            L/100 km
          </label>
          {TIPOS.map((t) => (
            <button key={t} onClick={() => d.mudarCarro({ tipo: t })} aria-pressed={d.carro.tipo === t} className="pj-tap"
              style={{ padding: "5px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, border: 0,
                background: d.carro.tipo === t ? "var(--pj-text)" : "var(--pj-subtle)", color: d.carro.tipo === t ? "var(--pj-card)" : "var(--pj-text)" }}>
              {t}
            </button>
          ))}
        </div>
      )}
      <p style={{ fontSize: 11, color: "var(--pj-text-faint)", marginTop: 5 }}>
        Ida e volta à loja mais perto de ti · {d.carro.tipo} a {eur(d.precoLitro, 3)} €/L · estimativa
      </p>
    </div>
  );
}
