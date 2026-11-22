import { useState } from "react";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";
import { ingredientesPara, emojiIngrediente, rendimento } from "./lib/receitas/motor";
import { evento } from "./lib/analytics";

/*
 * Ingredientes da página pública de uma receita, com as porções a ajustar
 * e "Adicionar à lista de compras" logo a seguir: é ali que nasce a
 * vontade de comprar, e não no fim da página.
 *
 * O HTML do servidor sai com as porções da receita (o que o Google lê
 * fica igual). A lista é a do dispositivo (lib/receitas/paraLista), a
 * mesma da app: o site e a app são a mesma origem.
 */
export default function IngredientesReceita({ receita }) {
  const [pessoas, setPessoas] = useState(receita.porcoes);
  const [estado, setEstado] = useState(null); // null | "a-pôr" | número de artigos novos
  const ingredientes = ingredientesPara(receita, pessoas);
  const aComprar = ingredientes.filter((i) => !i.despensa);

  async function adicionar() {
    setEstado("a-pôr");
    try {
      const { adicionarALista } = await import("./lib/receitas/paraLista");
      const n = await adicionarALista(aComprar);
      setEstado(n);
      evento("receita_lista", { onde: "pagina", receita: receita.id, novos: n });
    } catch {
      setEstado(null);
    }
  }

  const botao = { width: 34, height: 34, borderRadius: 11, background: "var(--pj-subtle)", border: 0 };
  return (
    <>
      <div className="flex items-center justify-between" style={{ marginTop: 32, marginBottom: 12, gap: 12 }}>
        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600 }}>Ingredientes</h2>
        <div className="flex items-center" style={{ gap: 6 }}>
          <button type="button" onClick={() => { setPessoas((p) => Math.max(1, p - 1)); setEstado(null); }} aria-label="Menos uma porção" className="pj-tap flex items-center justify-center" style={botao}>
            <Minus size={14} />
          </button>
          <span className="tabular-nums text-center" aria-live="polite" style={{ minWidth: 78, fontSize: 13, fontWeight: 600, color: "var(--pj-text)" }}>{rendimento(pessoas, receita.un)}</span>
          <button type="button" onClick={() => { setPessoas((p) => Math.min(40, p + 1)); setEstado(null); }} aria-label="Mais uma porção" className="pj-tap flex items-center justify-center" style={botao}>
            <Plus size={14} />
          </button>
        </div>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
        {ingredientes.map((ing, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2.5" style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
            <span style={{ fontSize: 14, fontWeight: ing.despensa ? 500 : 600, color: ing.despensa ? "var(--pj-text-faint)" : "var(--pj-text)" }}>
              {emojiIngrediente(ing.nome)} {ing.nome}{ing.despensa ? " · da despensa" : ""}
            </span>
            <span className="tabular-nums" style={{ fontSize: 13, color: "var(--pj-text-muted)" }}>{ing.qtd}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 10 }}>
        Os ingredientes "da despensa" são básicos que quase toda a gente tem em casa e não entram na lista.
      </p>

      {typeof estado === "number" ? (
        <a href="/?atalho=lista" className="pj-tap no-underline flex items-center justify-between rounded-2xl"
          style={{ marginTop: 12, padding: "14px 18px", background: "var(--pj-brand-wash)", border: "1px solid var(--pj-border)", color: "var(--pj-brand-ink)", fontWeight: 600, fontSize: 14.5, gap: 10 }}>
          <span className="inline-flex items-center" style={{ gap: 8 }}>
            <Check size={17} />
            {estado === 0 ? "Já estava tudo na tua lista" : `${estado} ${estado === 1 ? "artigo" : "artigos"} na tua lista`}
          </span>
          <span>Ver onde fica mais barato →</span>
        </a>
      ) : (
        <button type="button" onClick={adicionar} disabled={estado === "a-pôr" || !aComprar.length} className="pj-tap press w-full flex items-center justify-center rounded-2xl"
          style={{ marginTop: 12, minHeight: 50, gap: 8, background: "var(--pj-brand)", color: "#fff", border: 0, fontWeight: 600, fontSize: 15 }}>
          <ShoppingCart size={17} /> Adicionar à lista de compras
        </button>
      )}
    </>
  );
}
