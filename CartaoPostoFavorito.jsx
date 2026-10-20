import { useState, useEffect } from "react";
import { Star, ChevronRight, Navigation } from "lucide-react";
import { eur } from "./lib/formato";
import { evento } from "./lib/analytics";
import { lerDescontos, aplicarDescontos } from "./lib/descontosCombustivel";
import { lerFavoritos, favoritosComFicha, precosDoPosto, escolherDestaque, agruparPedidos, distanciaKm, LS_FAV_VISTO } from "./lib/postosFavoritos";

/*
 * "O teu posto" no Início: o preço de hoje nos postos marcados com a
 * estrela na Mobilidade, sem ter de abrir a lista. Até 3 postos; os que
 * ficam perto uns dos outros partilham um pedido (agruparPedidos).
 */

const MAX = 3;
const LS_PREFS = "poupeja_prefs";

// O mesmo valor por omissão das Definições (PREFS_OMISSAO).
function combustivelHabitual() {
  try { return JSON.parse(localStorage.getItem(LS_PREFS) || "{}").combustivel || "Gasolina 95"; } catch { return "Gasolina 95"; }
}
function jaTentou() {
  try { return !!JSON.parse(localStorage.getItem(LS_FAV_VISTO) || "false"); } catch { return false; }
}
/* Comparar com "o mais barato perto de ti" só faz sentido com o posto perto. */
const PERTO_KM = 15;

/** "hoje", "ontem", "a 17 out." — o dia em que o posto comunicou o preço. */
function diaDoPreco(iso) {
  if (!iso) return null;
  const d = new Date(iso), hoje = new Date();
  if (Number.isNaN(d.getTime())) return null;
  const dias = Math.round((new Date(hoje.toDateString()) - new Date(d.toDateString())) / 86400000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  return `a ${d.toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}`;
}

const precoTxt = v => `${eur(v, 3)} €`;
/** 0,07 → "7"; 0,035 → "3,5" */
const centimos = d => { const c = Math.round(d * 1000) / 10; return eur(c, Number.isInteger(c) ? 0 : 1); };

/** `perto`: o gasóleo mais barato perto da pessoa — { preco, lat, lon } — ou null. */
export default function CartaoPostoFavorito({ perto, onAbrir }) {
  const [postos, setPostos] = useState(null);   // [{ ficha, precos, estado }]
  const [semFicha, setSemFicha] = useState(false);
  const [habitual, setHabitual] = useState("Gasolina 95");

  useEffect(() => {
    setHabitual(combustivelHabitual());
    const fichas = favoritosComFicha().slice(0, MAX);
    if (!fichas.length) { setSemFicha(lerFavoritos().length > 0 && !jaTentou()); setPostos([]); return; }
    setPostos(fichas.map(ficha => ({ ficha, precos: [], estado: "a carregar" })));
    let vivo = true;
    const descontos = lerDescontos();
    for (const g of agruparPedidos(fichas)) {
      fetch(`/api/combustiveis?lat=${g.lat.toFixed(5)}&lon=${g.lon.toFixed(5)}&raio=${g.raio}`)
        .then(r => r.json())
        .then(j => (j.success ? { ok: true, estacoes: aplicarDescontos(j.estacoes, descontos) } : { ok: false }))
        .catch(() => ({ ok: false }))
        .then(res => vivo && setPostos(prev => prev && prev.map(p => {
          if (!g.fichas.includes(p.ficha)) return p;
          const precos = res.ok ? precosDoPosto(res.estacoes, p.ficha) : [];
          return { ...p, precos, estado: !res.ok ? "erro" : precos.length ? "ok" : "sem precos" };
        })));
    }
    return () => { vivo = false; };
  }, []);

  function abrir(acao) {
    evento("inicio_posto_favorito", { acao });
    onAbrir();
  }

  // Marcou a estrela antes de haver fichas: a Mobilidade preenche-as.
  if (semFicha) {
    return (
      <button onClick={() => abrir("completar")} className="pj-tap w-full text-left flex items-center anim-up anim-up-1"
        style={{ gap: 12, marginTop: 18, padding: "13px 14px", borderRadius: 14, background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
        <Star size={18} aria-hidden="true" style={{ color: "var(--pj-brand-ink)", flexShrink: 0 }} />
        <span className="flex-1 min-w-0">
          <span className="block" style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>Os teus postos favoritos</span>
          <span className="block" style={{ fontSize: 12, color: "var(--pj-text-muted)", marginTop: 1 }}>Abre a Mobilidade uma vez para veres aqui os preços deles</span>
        </span>
        <ChevronRight size={16} aria-hidden="true" style={{ color: "var(--pj-text-faint)", flexShrink: 0 }} />
      </button>
    );
  }
  if (!postos?.length) return null;

  return (
    <div className="anim-up anim-up-1" style={{ marginTop: 18 }}>
      <div style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
        {postos.length === 1 ? "O teu posto" : "Os teus postos"}
      </div>
      <div className="flex flex-col" style={{ gap: 8, marginTop: 10 }}>
        {postos.map(({ ficha, precos, estado }) => {
          const destaque = escolherDestaque(precos, habitual);
          const outros = precos.filter(p => p !== destaque).slice(0, 2);
          const dia = diaDoPreco(destaque?.dataPreco);
          // Diferença para o mais barato perto de ti — só gasóleo com gasóleo.
          const dif = destaque?.tipo === "Gasóleo" && perto && distanciaKm(perto, ficha) <= PERTO_KM
            ? Math.round((destaque.preco - perto.preco) * 1000) / 1000 : null;
          const destino = `${ficha.lat},${ficha.lon}`;
          return (
            <div key={ficha.chave} style={{ borderRadius: 16, background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
              <button onClick={() => abrir("ver")} className="pj-tap press w-full text-left flex items-center"
                style={{ gap: 12, padding: "12px 14px", background: "none", border: 0, minHeight: 64 }}>
                <span className="flex-1 min-w-0">
                  <span className="block truncate" style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>{ficha.nome}</span>
                  <span className="block truncate" style={{ fontSize: 12, color: "var(--pj-text-muted)", marginTop: 1 }}>
                    {ficha.municipio}{dia ? ` · preço de ${dia}` : ""}{destaque?.desconto ? " · com o teu desconto" : ""}
                  </span>
                </span>
                <span className="text-right flex-shrink-0">
                  {estado === "a carregar" ? (
                    <span className="block rounded animate-pulse" style={{ width: 72, height: 22, background: "var(--pj-subtle)" }} />
                  ) : destaque ? (
                    <>
                      <span className="block pj-num" style={{ fontSize: 17, fontWeight: 700, color: "var(--pj-text)" }}>{precoTxt(destaque.preco)}</span>
                      <span className="block" style={{ fontSize: 11, color: "var(--pj-text-faint)" }}>{destaque.tipo}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--pj-text-faint)" }}>{estado === "erro" ? "Sem ligação à DGEG" : "Sem preço hoje"}</span>
                  )}
                </span>
              </button>
              {destaque && (
                <div className="flex items-center justify-between flex-wrap"
                  style={{ gap: 8, padding: "8px 14px 10px", borderTop: "1px solid var(--pj-subtle)", fontSize: 12, color: "var(--pj-text-muted)" }}>
                  <span className="pj-num">
                    {dif != null && (dif <= 0.0005
                      ? <strong style={{ color: "var(--pj-brand-ink)" }}>O mais barato perto de ti</strong>
                      : <>{centimos(dif)} cênt./l acima do mais barato perto de ti</>)}
                    {dif == null && outros.map(o => `${o.tipo} ${precoTxt(o.preco)}`).join(" · ")}
                  </span>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${destino}`} target="_blank" rel="noopener noreferrer"
                    onClick={() => evento("inicio_posto_favorito", { acao: "navegar" })}
                    className="pj-tap inline-flex items-center no-underline"
                    style={{ gap: 4, minHeight: 32, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
                    <Navigation size={13} aria-hidden="true" /> Ir
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
