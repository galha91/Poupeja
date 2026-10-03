import { useState } from "react";
import dynamic from "next/dynamic";
import { Scale } from "lucide-react";
import { termoDePesquisa, custoPorLoja } from "./lib/comparacao";
import { N_COMPARADAS } from "./lib/cobertura";
import { pesquisarComRecurso } from "./lib/precosLocais";
import { evento } from "./lib/analytics";

/*
 * "Onde fica mais barata a minha lista?"
 *
 * Pesquisa cada artigo (as mesmas pesquisas do "Comparar preços", quase
 * sempre servidas da cache) e entrega as contas ao ResultadoLista. Sem
 * rede, usa os últimos preços guardados no dispositivo.
 *
 * Este ficheiro fica leve de propósito: aparece sempre que a lista tem 2
 * artigos, mas o resultado (contas, alertas, cobertura) só é carregado
 * quando alguém toca em comparar.
 */

const ResultadoLista = dynamic(() => import("./ResultadoLista"), { ssr: false, loading: () => null });
import { MAX_ARTIGOS } from "./lib/listaCompras";
export { MAX_ARTIGOS };
const EM_PARALELO = 3;

/*
 * Pesquisa os artigos e devolve as linhas que o ResultadoLista soma.
 * Também usado pelo bloco "Onde fica mais barata?" do ecrã da lista.
 */
export async function compararArtigos(itens, aoAvancar = () => {}) {
  const artigos = itens.slice(0, MAX_ARTIGOS);
  evento("comparar_lista", { artigos: artigos.length });
  // Catálogo: o termo de pesquisa certo de cada artigo e os que se sabe
  // não terem preço comparável (não vale a pena perguntar às lojas).
  const [catalogo, cobertura] = await Promise.all([
    import("./lib/catalogoLista").catch(() => null),
    import("./data/catalogo-precos.json").then((m) => m.default || m).catch(() => ({})),
  ]);
  const semPreco = new Set(cobertura.semPreco || []);
  const resultado = new Array(artigos.length);
  let proximo = 0;
  // Poucas de cada vez: o servidor limita pesquisas por minuto.
  await Promise.all(Array.from({ length: EM_PARALELO }, async () => {
    while (proximo < artigos.length) {
      const i = proximo++;
      const it = artigos[i];
      const doCat = catalogo?.doCatalogo(it.nome);
      const q = it.q || doCat?.q || termoDePesquisa(it.nome);
      if (doCat && semPreco.has(doCat.id)) {
        resultado[i] = { item: it, q, custos: {} };
        aoAvancar();
        continue;
      }
      try {
        const { dados, guardado } = await pesquisarComRecurso(q);
        resultado[i] = { item: it, q, dados, guardado, ...custoPorLoja(dados, it.qty || 1) };
      } catch {
        resultado[i] = { item: it, q, custos: {}, erro: true };
      }
      aoAvancar();
    }
  }));
  return resultado;
}

export default function CompararLista({ itens, nota = true }) {
  const [estado, setEstado] = useState("inicio"); // inicio | a-carregar | pronto
  const [feitos, setFeitos] = useState(0);
  const [linhas, setLinhas] = useState([]);

  const artigos = itens.slice(0, MAX_ARTIGOS);

  // Começa a carregar o código do resultado em paralelo com as pesquisas.
  async function comparar() {
    import("./ResultadoLista");
    setEstado("a-carregar");
    setFeitos(0);
    setLinhas(await compararArtigos(artigos, () => setFeitos((n) => n + 1)));
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
            Comparamos os {artigos.length} artigos em {N_COMPARADAS} supermercados
          </span>
        </span>
      </button>
    );
  }

  if (estado === "a-carregar") {
    const pct = Math.round((feitos / artigos.length) * 100);
    return (
      <div role="status" style={{ padding: 16, borderRadius: 16, background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--pj-text)" }}>A ver os preços… {feitos} de {artigos.length}</p>
        <div className="mt-2" style={{ height: 5, borderRadius: 999, background: "var(--pj-subtle)", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "var(--pj-brand)", transition: "width .3s" }} />
        </div>
      </div>
    );
  }

  return <ResultadoLista linhas={linhas} nota={nota} onAtualizar={comparar} />;
}
