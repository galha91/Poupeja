import { useState } from "react";
import { Scale, ChevronDown, RefreshCw } from "lucide-react";
import LogoLoja from "./LogoLoja";
import { Preco } from "./Preco";
import { eur } from "./lib/formato";
import { evento } from "./lib/analytics";
import { custoPorLoja, termoDePesquisa } from "./lib/comparacao";

/*
 * "Onde fica mais barata a minha lista?"
 *
 * Pesquisa cada artigo da lista (as mesmas pesquisas do "Comparar
 * preços", por isso vêm quase sempre da cache) e soma, por loja, o custo
 * de cada artigo na MESMA quantidade. O total só entra com os artigos que
 * as três lojas online têm — senão ganhava a loja a que faltam mais coisas.
 * O Lidl fica de fora da soma: só tem as promoções da semana.
 */

const LOJAS_CESTO = [
  { id: "continente", nome: "Continente" },
  { id: "pingo-doce", nome: "Pingo Doce" },
  { id: "auchan", nome: "Auchan" },
];
const MAX_ARTIGOS = 25;
const EM_PARALELO = 3;

async function pesquisar(q) {
  const r = await fetch(`/api/precos-supermercado?q=${encodeURIComponent(q)}`);
  if (!r.ok && r.status !== 502) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export default function CompararLista({ itens }) {
  const [estado, setEstado] = useState("inicio"); // inicio | a-carregar | pronto
  const [feitos, setFeitos] = useState(0);
  const [linhas, setLinhas] = useState([]);
  const [verDetalhe, setVerDetalhe] = useState(false);

  const artigos = itens.slice(0, MAX_ARTIGOS);

  async function comparar() {
    setEstado("a-carregar");
    setFeitos(0);
    evento("comparar_lista", { artigos: artigos.length });
    const resultado = new Array(artigos.length);
    let proximo = 0;
    // Poucas de cada vez: o servidor limita pesquisas por minuto.
    await Promise.all(Array.from({ length: EM_PARALELO }, async () => {
      while (proximo < artigos.length) {
        const i = proximo++;
        const it = artigos[i];
        try {
          const dados = await pesquisar(termoDePesquisa(it.nome));
          resultado[i] = { item: it, ...custoPorLoja(dados, it.qty || 1) };
        } catch {
          resultado[i] = { item: it, custos: {}, erro: true };
        }
        setFeitos((n) => n + 1);
      }
    }));
    setLinhas(resultado);
    setEstado("pronto");
  }

  if (!artigos.length) return null;

  if (estado === "inicio") {
    return (
      <button onClick={comparar} className="pj-tap press w-full text-left flex items-center gap-3"
        style={{ padding: "14px 16px", borderRadius: 16, background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
        <span className="flex items-center justify-center flex-none" style={{ width: 38, height: 38, borderRadius: 11, background: "var(--pj-brand-wash)" }}>
          <Scale size={18} style={{ color: "var(--pj-brand-ink)" }} />
        </span>
        <span className="flex-1 min-w-0">
          <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)" }}>Onde fica mais barata esta lista?</span>
          <span style={{ display: "block", fontSize: 12, color: "var(--pj-text-muted)", marginTop: 1 }}>
            Comparamos os {artigos.length} artigos no Continente, Pingo Doce e Auchan
          </span>
        </span>
      </button>
    );
  }

  if (estado === "a-carregar") {
    const pct = Math.round((feitos / artigos.length) * 100);
    return (
      <div style={{ padding: 16, borderRadius: 16, background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--pj-text)" }}>A ver os preços… {feitos} de {artigos.length}</p>
        <div className="mt-2" style={{ height: 5, borderRadius: 999, background: "var(--pj-subtle)", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "var(--pj-brand)", transition: "width .3s" }} />
        </div>
      </div>
    );
  }

  // ── Contas ──
  const comuns = linhas.filter((l) => LOJAS_CESTO.every((s) => l.custos[s.id]));
  const semPreco = linhas.filter((l) => !Object.keys(l.custos).length);
  const totais = LOJAS_CESTO.map((s) => ({
    ...s,
    total: comuns.reduce((t, l) => t + l.custos[s.id].custo, 0),
    ganhos: linhas.filter((l) => {
      const c = Object.entries(l.custos).filter(([id]) => LOJAS_CESTO.some((x) => x.id === id));
      if (!c.length) return false;
      const min = Math.min(...c.map(([, v]) => v.custo));
      return l.custos[s.id] && l.custos[s.id].custo === min;
    }).length,
  })).sort((a, b) => a.total - b.total);
  const melhor = totais[0];
  const pior = totais[totais.length - 1];
  // Dividir as compras: cada artigo onde é mais barato.
  const dividido = comuns.reduce((t, l) => t + Math.min(...LOJAS_CESTO.map((s) => l.custos[s.id].custo)), 0);
  const poupaDividir = melhor ? melhor.total - dividido : 0;

  return (
    <div style={{ borderRadius: 18, background: "var(--pj-card)", border: "1px solid var(--pj-border)", overflow: "hidden" }}>
      {comuns.length ? (
        <>
          <div style={{ background: "var(--pj-brand)", color: "#fff", padding: "12px 16px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.85 }}>A tua lista fica mais barata no</p>
            <p className="font-display" style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>{melhor.nome}</p>
          </div>
          <div style={{ padding: "4px 0" }}>
            {totais.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3" style={{ padding: "10px 16px", borderTop: i ? "1px solid var(--pj-subtle)" : "none" }}>
                <LogoLoja loja={t.nome} size={32} radius={8} />
                <span className="flex-1 min-w-0">
                  <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{t.nome}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--pj-text-faint)" }}>
                    Mais barato em {t.ganhos} de {linhas.length} artigos
                  </span>
                </span>
                <span className="text-right">
                  <Preco valor={t.total} casas={2} tamanho={18} cor={i === 0 ? "var(--pj-brand-ink)" : "var(--pj-text)"} />
                  {i > 0 && <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--pj-text-faint)" }}>+{eur(t.total - melhor.total, 2)} €</span>}
                </span>
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 16px 14px", borderTop: "1px solid var(--pj-subtle)" }}>
            {pior && pior.total - melhor.total >= 0.5 && (
              <p style={{ fontSize: 13, color: "var(--pj-text)", lineHeight: 1.5 }}>
                Comprar tudo no {melhor.nome} poupa <strong>{eur(pior.total - melhor.total, 2)} €</strong> face ao {pior.nome}.
              </p>
            )}
            {poupaDividir >= 1 && (
              <p style={{ fontSize: 13, color: "var(--pj-text)", lineHeight: 1.5, marginTop: 4 }}>
                Dividindo as compras pelas lojas, poupavas mais <strong>{eur(poupaDividir, 2)} €</strong>.
              </p>
            )}
            <p style={{ fontSize: 11.5, color: "var(--pj-text-faint)", marginTop: 6, lineHeight: 1.5 }}>
              Total dos {comuns.length} artigos que as três lojas têm, na mesma quantidade em todas.
              {comuns.length < linhas.length && ` ${linhas.length - comuns.length} ficaram de fora da soma.`}
            </p>
          </div>
        </>
      ) : (
        <p style={{ padding: 16, fontSize: 13.5, color: "var(--pj-text-muted)" }}>
          Não encontrámos estes artigos nas três lojas ao mesmo tempo. Experimenta nomes mais simples (ex.: «arroz», «leite»).
        </p>
      )}

      <button onClick={() => setVerDetalhe((v) => !v)} className="pj-tap press w-full flex items-center justify-center gap-1"
        style={{ padding: "10px 0", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text-muted)", background: "var(--pj-surface)", border: 0, borderTop: "1px solid var(--pj-subtle)" }}>
        {verDetalhe ? "Esconder" : "Ver"} artigo a artigo
        <ChevronDown size={14} style={{ transform: verDetalhe ? "rotate(180deg)" : "none" }} />
      </button>
      {verDetalhe && (
        <div>
          {linhas.map((l, i) => {
            const opcoes = LOJAS_CESTO.filter((s) => l.custos[s.id]).map((s) => ({ ...s, ...l.custos[s.id] })).sort((a, b) => a.custo - b.custo);
            const top = opcoes[0];
            return (
              <div key={l.item.id || i} className="flex items-start gap-3" style={{ padding: "10px 16px", borderTop: "1px solid var(--pj-subtle)" }}>
                <span className="flex-1 min-w-0">
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--pj-text)" }}>
                    {l.item.nome}{l.item.qty > 1 ? ` ×${l.item.qty}` : ""}
                  </span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--pj-text-faint)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {top ? `${top.nome} · ${top.produto.nome}${l.referencia ? ` · ${String(l.referencia.qtd).replace(".", ",")} ${l.referencia.unidade}` : ""}` : l.erro ? "Não foi possível pesquisar" : "Sem resultados"}
                  </span>
                </span>
                {top && <span className="pj-num" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--pj-text)" }}>{eur(top.custo, 2)} €</span>}
              </div>
            );
          })}
          {semPreco.length > 0 && (
            <p style={{ padding: "8px 16px 12px", fontSize: 11.5, color: "var(--pj-text-faint)" }}>
              Sem preço: {semPreco.map((l) => l.item.nome).join(", ")}.
            </p>
          )}
        </div>
      )}
      <button onClick={comparar} className="pj-tap press w-full flex items-center justify-center gap-1.5"
        style={{ padding: "10px 0", fontSize: 12.5, fontWeight: 600, color: "var(--pj-brand-ink)", background: "transparent", border: 0, borderTop: "1px solid var(--pj-subtle)" }}>
        <RefreshCw size={13} /> Comparar outra vez
      </button>
    </div>
  );
}
