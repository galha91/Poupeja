import { useState } from "react";
import { X, Clock, ShoppingCart, Check, Sparkles, ChefHat, Leaf } from "lucide-react";
import { EMENTAS, sugestaoDaSemana, emojiIngrediente } from "./lib/ementas-data";
import { evento } from "./lib/analytics";

/*
 * Ementas económicas — receitas portuguesas baratas com ingredientes que
 * entram na Lista de Compras num toque. Custos em FAIXAS (€/€€), nunca
 * totais ao cêntimo: os preços variam por loja e época, e não inventamos.
 */

const LS_LISTA = "poupeja_lista_compras";

function adicionarIngredientesALista(ementa) {
  let lista = [];
  try { lista = JSON.parse(localStorage.getItem(LS_LISTA) || "[]"); } catch {}
  let novos = 0;
  for (const ing of ementa.ingredientes) {
    if (ing.despensa) continue;
    const rotulo = `${ing.nome} (${ing.qtd})`;
    const existe = lista.find(i => i.nome.toLowerCase() === rotulo.toLowerCase() && !i.feito);
    if (existe) {
      existe.qty = (existe.qty || 1) + 1;
    } else {
      lista.unshift({
        id: Date.now() + Math.random(),
        nome: rotulo,
        emoji: emojiIngrediente(ing.nome),
        categoria: "",
        qty: 1,
        feito: false,
      });
      novos++;
    }
  }
  try { localStorage.setItem(LS_LISTA, JSON.stringify(lista)); } catch {}
  return novos;
}

function BadgeCusto({ custo }) {
  return (
    <span className="font-semibold" style={{ fontSize: 12, color: "#0b6b4f" }}>
      {"€".repeat(custo)}<span style={{ color: "#cfccbf" }}>{"€".repeat(3 - custo)}</span>
    </span>
  );
}

function CartaoEmenta({ ementa, destaque = false, onAbrir }) {
  return (
    <button
      onClick={() => onAbrir(ementa)}
      className="pj-tap press w-full text-left rounded-2xl p-4 flex items-center gap-3.5"
      style={destaque
        ? { background: "#0b6b4f" }
        : { background: "#fbfaf6", border: "1px solid #e4e2d8" }}
    >
      <span style={{ fontSize: 30, flexShrink: 0 }}>{ementa.emoji}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        {destaque && (
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.09em]" style={{ color: "#a7cbbb" }}>
            <Sparkles size={10} /> Sugestão da semana
          </span>
        )}
        <span className="block truncate font-semibold" style={{ fontSize: 14.5, color: destaque ? "#fff" : "#14231c" }}>
          {ementa.nome}
        </span>
        <span className="flex items-center gap-2.5 mt-0.5" style={{ fontSize: 12, color: destaque ? "#a7cbbb" : "#5c6b62" }}>
          <span className="inline-flex items-center gap-1"><Clock size={11} /> {ementa.tempoMin} min</span>
          {destaque ? <span>{"€".repeat(ementa.custo)}</span> : <BadgeCusto custo={ementa.custo} />}
          {ementa.airfryer && <span className="inline-flex items-center gap-1"><ChefHat size={11} /> air fryer</span>}
          {ementa.veg && <span className="inline-flex items-center gap-1"><Leaf size={11} /> veggie</span>}
        </span>
      </span>
    </button>
  );
}

export default function SecaoEmentas({ setTab }) {
  const [filtro, setFiltro] = useState("todas");
  const [aberta, setAberta] = useState(null);
  const [adicionado, setAdicionado] = useState(0);

  const sugestao = sugestaoDaSemana();
  const FILTROS = [
    { id: "todas", label: "Todas" },
    { id: "baratas", label: "€ mais baratas" },
    { id: "rapidas", label: "≤ 25 min" },
    { id: "airfryer", label: "Air fryer" },
    { id: "veg", label: "Vegetariano" },
  ];
  const visiveis = EMENTAS.filter(e => {
    if (filtro === "baratas") return e.custo === 1;
    if (filtro === "rapidas") return e.tempoMin <= 25;
    if (filtro === "airfryer") return e.airfryer;
    if (filtro === "veg") return e.veg;
    return true;
  });

  function abrir(e) { setAberta(e); setAdicionado(0); }

  function adicionar() {
    const novos = adicionarIngredientesALista(aberta);
    setAdicionado(novos || -1); // -1 = já estavam todos
    evento("ementa_lista", { id: aberta.id });
  }

  const naoDespensa = aberta ? aberta.ingredientes.filter(i => !i.despensa).length : 0;

  return (
    <div>
      {/* Cabeçalho editorial */}
      <div className="mx-4 mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.09em]" style={{ color: "#8a978e" }}>Cozinha económica</p>
        <p className="font-display" style={{ fontSize: 22, fontWeight: 600, color: "#14231c", marginTop: 4 }}>Ementas da semana</p>
        <p className="text-xs mt-1" style={{ color: "#5c6b62" }}>
          Receitas baratas para 4 pessoas — os ingredientes entram na tua lista num toque.
        </p>
        <div className="mt-4" style={{ height: 1, background: "#e4e2d8" }} />
      </div>

      {/* Sugestão da semana */}
      <div className="mx-4 mb-4">
        <CartaoEmenta ementa={sugestao} destaque onAbrir={abrir} />
      </div>

      {/* Filtros */}
      <div className="px-4 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {FILTROS.map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            className="pj-tap press flex-shrink-0 px-3.5 py-2 rounded-xl text-[12px] font-semibold"
            style={filtro === f.id ? { background: "#0b6b4f", color: "#fff" } : { background: "#eeece4", color: "#5c6b62" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de receitas */}
      <div className="mx-4 flex flex-col gap-2.5 pb-4">
        {visiveis.filter(e => e.id !== sugestao.id || filtro !== "todas").map(e => (
          <CartaoEmenta key={e.id} ementa={e} onAbrir={abrir} />
        ))}
      </div>

      <p className="text-[11px] text-center px-6 pb-4 leading-relaxed" style={{ color: "#8a978e" }}>
        Os preços variam por loja e época — por isso indicamos faixas (€ = mais barato) e não totais ao cêntimo.
        Espreita os folhetos antes de ires às compras.
      </p>

      {/* Detalhe da receita */}
      {aberta && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(20,35,28,0.55)", backdropFilter: "blur(3px)" }} onClick={() => setAberta(null)}>
          <div className="w-full max-w-md rounded-t-3xl px-5 pt-5 pb-9" style={{ maxHeight: "90vh", overflowY: "auto", background: "#f6f5f0" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 34 }}>{aberta.emoji}</span>
                <div>
                  <p className="font-display" style={{ fontSize: 19, fontWeight: 600, color: "#14231c", lineHeight: 1.2 }}>{aberta.nome}</p>
                  <p className="flex items-center gap-2.5 mt-1" style={{ fontSize: 12, color: "#5c6b62" }}>
                    <span className="inline-flex items-center gap-1"><Clock size={11} /> {aberta.tempoMin} min</span>
                    <BadgeCusto custo={aberta.custo} />
                    <span>4 pessoas</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setAberta(null)} aria-label="Fechar" className="pj-tap w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#eeece4" }}>
                <X size={15} style={{ color: "#5c6b62" }} />
              </button>
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.09em] mt-5 mb-2" style={{ color: "#8a978e" }}>Ingredientes</p>
            <div className="rounded-2xl overflow-hidden" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
              {aberta.ingredientes.map((ing, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5" style={i > 0 ? { borderTop: "1px solid #eeece4" } : {}}>
                  <span style={{ fontSize: 13.5, fontWeight: ing.despensa ? 500 : 600, color: ing.despensa ? "#8a978e" : "#14231c" }}>
                    {emojiIngrediente(ing.nome)} {ing.nome}{ing.despensa ? " · da despensa" : ""}
                  </span>
                  <span style={{ fontSize: 12.5, color: "#5c6b62" }}>{ing.qtd}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.09em] mt-5 mb-2" style={{ color: "#8a978e" }}>Preparação</p>
            <ol className="flex flex-col gap-2.5" style={{ paddingLeft: 0, listStyle: "none" }}>
              {aberta.passos.map((p, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full text-white text-[11px] font-semibold flex items-center justify-center mt-0.5" style={{ background: "#0b6b4f" }}>{i + 1}</span>
                  <span style={{ fontSize: 13.5, color: "#2c3b33", lineHeight: 1.55 }}>{p}</span>
                </li>
              ))}
            </ol>

            {adicionado !== 0 ? (
              <div className="mt-5">
                <div className="flex items-center justify-center gap-2 py-3.5 rounded-2xl" style={{ background: "#eef3ef" }}>
                  <Check size={16} style={{ color: "#0b6b4f" }} />
                  <span className="text-[13.5px] font-semibold" style={{ color: "#0b6b4f" }}>
                    {adicionado === -1 ? "Já estavam todos na lista" : `${adicionado} ingrediente${adicionado !== 1 ? "s" : ""} na lista`}
                  </span>
                </div>
                <button onClick={() => setTab?.("lista")} className="pj-tap w-full py-3 mt-2 rounded-2xl font-semibold text-[13.5px]" style={{ background: "#0b6b4f", color: "#fff" }}>
                  Ver a lista de compras →
                </button>
              </div>
            ) : (
              <button onClick={adicionar} className="pj-tap w-full py-4 mt-5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2" style={{ background: "#0b6b4f" }}>
                <ShoppingCart size={16} /> Adicionar {naoDespensa} ingredientes à lista
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
