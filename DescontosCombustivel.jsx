import { useState } from "react";
import { Percent, X, Plus } from "lucide-react";
import { centimosValidos, normalizarMarca, MAX_CENT } from "./lib/descontosCombustivel";
import { evento } from "./lib/analytics";

/*
 * "O meu desconto" — uma linha discreta por cima da lista de postos.
 * Fechada, diz só o que está ativo ("Galp −10 cênt."). Aberta, escolhe-se
 * a marca (das que estão na lista) e os cêntimos por litro.
 */
export default function DescontosCombustivel({ marcas, descontos, onChange }) {
  const [aberto, setAberto] = useState(false);
  const [marca, setMarca] = useState("");
  const [cent, setCent] = useState("");
  const [erro, setErro] = useState("");

  const ativos = Object.entries(descontos || {});
  const nomeDe = (k) => marcas.find(m => normalizarMarca(m) === k) || k.toUpperCase();

  function adicionar(e) {
    e.preventDefault();
    const c = centimosValidos(cent);
    if (!marca) return setErro("Escolhe a marca.");
    if (!c) return setErro(`Escreve os cêntimos por litro (entre 0,1 e ${MAX_CENT}).`);
    onChange({ ...descontos, [normalizarMarca(marca)]: c });
    evento("desconto_combustivel", { acao: "adicionar" });
    setMarca(""); setCent(""); setErro(""); setAberto(false);
  }
  function remover(k) {
    const d = { ...descontos }; delete d[k];
    onChange(d);
    evento("desconto_combustivel", { acao: "remover" });
  }

  return (
    <div className="px-4 mb-3">
      <div className="flex items-center flex-wrap" style={{ gap: 6 }}>
        <Percent size={13} style={{ color: "var(--pj-text-faint)" }} />
        {ativos.length === 0 && !aberto && (
          <button onClick={() => setAberto(true)} className="pj-tap pj-alvo text-[12px] font-semibold" style={{ color: "var(--pj-brand-ink)" }}>
            Tens desconto numa marca? Mostra o preço que pagas
          </button>
        )}
        {ativos.map(([k, c]) => (
          <span key={k} className="inline-flex items-center text-[11.5px] font-semibold rounded-lg"
            style={{ gap: 4, padding: "4px 4px 4px 9px", background: "var(--pj-brand-wash)", color: "var(--pj-brand-ink)" }}>
            {nomeDe(k)} −{String(c).replace(".", ",")} cênt.
            <button onClick={() => remover(k)} aria-label={`Remover o desconto ${nomeDe(k)}`} className="pj-tap flex items-center justify-center rounded-md" style={{ width: 22, height: 22 }}>
              <X size={12} />
            </button>
          </span>
        ))}
        {ativos.length > 0 && !aberto && (
          <button onClick={() => setAberto(true)} aria-label="Adicionar outro desconto" className="pj-tap flex items-center justify-center rounded-lg"
            style={{ width: 28, height: 28, background: "var(--pj-subtle)", color: "var(--pj-text-muted)" }}>
            <Plus size={13} />
          </button>
        )}
      </div>

      {aberto && (
        <form onSubmit={adicionar} className="card p-3 mt-2">
          <p className="text-[12px]" style={{ color: "var(--pj-text-muted)", lineHeight: 1.45 }}>
            Cartão de frota, de supermercado ou da empresa: diz quanto descontas por litro e a lista passa a mostrar o que pagas. Fica só neste telemóvel.
          </p>
          <div className="flex mt-2.5" style={{ gap: 8 }}>
            <select value={marca} onChange={e => setMarca(e.target.value)} aria-label="Marca"
              className="flex-1 min-w-0 rounded-xl text-[13px]" style={{ padding: "9px 10px", background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" }}>
              <option value="">Marca…</option>
              {marcas.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input value={cent} onChange={e => setCent(e.target.value)} inputMode="decimal" placeholder="cênt./L" aria-label="Cêntimos por litro"
              className="rounded-xl text-[13px]" style={{ width: 84, padding: "9px 10px", background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" }} />
          </div>
          {erro && <p role="alert" className="text-[12px] font-semibold mt-2" style={{ color: "var(--pj-danger)" }}>{erro}</p>}
          <div className="flex justify-end mt-2.5" style={{ gap: 8 }}>
            <button type="button" onClick={() => { setAberto(false); setErro(""); }} className="pj-tap text-[12px] font-semibold rounded-lg" style={{ padding: "8px 12px", color: "var(--pj-text-muted)" }}>Cancelar</button>
            <button type="submit" className="pj-tap text-[12px] font-semibold rounded-lg text-white" style={{ padding: "8px 14px", background: "var(--pj-brand)" }}>Guardar</button>
          </div>
        </form>
      )}
    </div>
  );
}
