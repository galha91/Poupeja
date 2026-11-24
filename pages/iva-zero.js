import Head from "next/head";
import LayoutPublico, { CtaApp } from "../LayoutPublico";
import { Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import { breadcrumbLd } from "../lib/seoPrecos";
import { jsonLdSeguro } from "../lib/escapar";
import { eur } from "../lib/formato";
import { dataExtenso } from "../lib/datas";
import { URL_SITE, DOMINIO_VISIVEL } from "../lib/site";
import {
  lerIvaZero, ivaZeroServe, pctDe, INICIO, FIM_PREVISTO, DESCIDA_ESPERADA, DIAS_REFERENCIA, LISTA_OFICIAL, GRUPOS,
} from "../lib/ivaZero";

/*
 * IVA zero 2027: a descida chega às prateleiras? O mesmo produto, na mesma
 * loja, antes e depois de 1 de janeiro (lib/ivaZero). Lê uma linha de
 * paginas_marca calculada nos GitHub Actions (regra 1 do CLAUDE.md). Sem
 * dados recentes fica fora do Google (noindex).
 */
const rotulo = { fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" };
const linha = (i) => (i ? { borderTop: "1px solid var(--pj-subtle)" } : {});
const forte = { color: "var(--pj-text)" };
const virgula = (v) => String(v).replace(".", ",");
const pct = (v) => (v == null ? "—" : `${v > 0 ? "+" : v < 0 ? "−" : ""}${virgula(Math.abs(v))}%`);
const corPct = (v) => (v <= -5 ? "var(--pj-brand-ink)" : v > 0.5 ? "var(--pj-danger)" : "var(--pj-text)");

function Barra({ c }) {
  const partes = [
    { k: "desceu", cor: "var(--pj-brand)" },
    { k: "parte", cor: "var(--pj-brand-wash)" },
    { k: "igual", cor: "var(--pj-subtle)" },
    { k: "subiu", cor: "var(--pj-danger)" },
  ];
  return (
    <div className="flex" style={{ height: 8, borderRadius: 4, overflow: "hidden", marginTop: 8, background: "var(--pj-subtle)" }} aria-hidden>
      {partes.map((p) => (c[p.k] ? <span key={p.k} style={{ width: `${(c[p.k] / c.n) * 100}%`, background: p.cor }} /> : null))}
    </div>
  );
}

function Contagem({ c, depois }) {
  return (
    <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 6, lineHeight: 1.5 }}>
      {depois
        ? `${pctDe(c.desceu, c.n)}% desceram o equivalente ao IVA · ${pctDe(c.parte, c.n)}% desceram menos · ${pctDe(c.igual, c.n)}% ficaram iguais · ${pctDe(c.subiu, c.n)}% subiram`
        : `${pctDe(c.subiu, c.n)}% acima do preço de referência · ${pctDe(c.igual, c.n)}% iguais · ${pctDe(c.parte + c.desceu, c.n)}% abaixo`}
    </p>
  );
}

export default function IvaZero({ dados = null, atual = false }) {
  const canonical = `${URL_SITE}/iva-zero`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "IVA zero", path: "/iva-zero" }];
  const r = dados?.resumo;
  const depois = dados?.fase === "depois";
  const titulo = "IVA zero 2027: a descida chega ao preço do supermercado?";
  const descricao = r && depois
    ? `Desde 1 de janeiro, ${pctDe(r.total.desceu, r.total.n)}% de ${r.total.n} alimentos essenciais desceram o equivalente ao IVA. Variação média: ${pct(r.total.varMedia)}. Mesmo produto, mesma loja, antes e depois.`
    : `O IVA zero volta a 1 de janeiro de 2027. O PoupeJá acompanha ${r ? `${r.total.n} ` : ""}alimentos essenciais, produto a produto, para ver se a descida chega ao preço final.`;
  const frase = r && depois
    ? `Segundo o PoupeJá, a ${dataExtenso(dados.dia)}, ${pctDe(r.total.desceu, r.total.n)}% de ${r.total.n} alimentos essenciais acompanhados tinham descido pelo menos 5% face ao preço de dezembro; a variação média era de ${pct(r.total.varMedia)} (preços online).`
    : "";

  return (
    <LayoutPublico>
      <Head>
        <title>{`${titulo} | PoupeJá`}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={canonical} />
        {!atual && <meta name="robots" content="noindex" />}
        <meta property="og:title" content={titulo} key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(breadcrumbLd(URL_SITE, passos)) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>IVA zero: a descida chega ao preço do supermercado?</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
          O Orçamento do Estado para 2027 volta a tirar o IVA a um conjunto de alimentos essenciais de {dataExtenso(INICIO)} a {dataExtenso(FIM_PREVISTO)},
          com possibilidade de prolongamento. Um alimento que pagava 6% de IVA devia ficar {virgula(DESCIDA_ESPERADA)}% mais barato.
          Aqui vê-se se fica: o mesmo produto, na mesma loja, antes e depois.
        </p>
        {!LISTA_OFICIAL && (
          <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 10, lineHeight: 1.55 }}>
            A lista oficial dos alimentos abrangidos ainda não foi publicada. Até lá acompanhamos os alimentos essenciais das categorias abaixo; quando a lista sair, a página passa a contar só os abrangidos.
          </p>
        )}

        {!r ? (
          <p style={estiloTexto}>Os primeiros números aparecem aqui assim que os preços de referência forem calculados.</p>
        ) : (
          <>
            <div className="rounded-2xl p-4 mt-6" style={estiloCartao}>
              <p style={rotulo}>{depois ? "Desde 1 de janeiro" : "Antes do IVA zero"}</p>
              {depois ? (
                <>
                  <p className="font-display" style={{ fontSize: 30, fontWeight: 700, color: "var(--pj-brand-ink)", marginTop: 6 }}>{pctDe(r.total.desceu, r.total.n)}%</p>
                  <p style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.5 }}>
                    dos {r.total.n} produtos desceram o equivalente ao IVA (5% ou mais). Variação média: <strong style={forte}>{pct(r.total.varMedia)}</strong>.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display" style={{ fontSize: 30, fontWeight: 700, color: "var(--pj-brand-ink)", marginTop: 6 }}>{r.total.n}</p>
                  <p style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.5 }}>
                    produtos de marca acompanhados todos os dias. Face à mediana dos últimos {DIAS_REFERENCIA} dias, estão em média <strong style={forte}>{pct(r.total.varMedia)}</strong>.
                  </p>
                </>
              )}
              <Barra c={r.total} />
              <Contagem c={r.total} depois={depois} />
              <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 6 }}>Preços online de {dataExtenso(dados.dia)}.</p>
            </div>

            <h2 className="font-display" style={estiloH2}>Por cadeia</h2>
            <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
              {r.porLoja.map((l, i) => (
                <div key={l.loja} className="px-4 py-3" style={linha(i)}>
                  <div className="flex items-center justify-between" style={{ gap: 10 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)" }}>{l.nome}</span>
                    <span className="pj-num" style={{ fontSize: 14.5, fontWeight: 700, color: corPct(l.varMedia) }}>{pct(l.varMedia)}</span>
                  </div>
                  <Barra c={l} />
                  <Contagem c={l} depois={depois} />
                  <p style={{ fontSize: 12, color: "var(--pj-text-faint)" }}>{l.n} produtos</p>
                </div>
              ))}
            </div>

            <h2 className="font-display" style={estiloH2}>Por tipo de alimento</h2>
            <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
              {r.porGrupo.map((g, i) => (
                <div key={g.id} className="flex items-center justify-between px-4 py-3" style={{ gap: 10, ...linha(i) }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{g.nome}</p>
                    <p style={{ fontSize: 12, color: "var(--pj-text-faint)" }}>
                      {g.n} produtos{depois ? ` · ${pctDe(g.desceu, g.n)}% desceram o IVA` : ""}
                    </p>
                  </div>
                  <span className="pj-num" style={{ fontSize: 14, fontWeight: 700, color: corPct(g.varMedia) }}>{pct(g.varMedia)}</span>
                </div>
              ))}
            </div>

            {depois && r.subiram?.length > 0 && (
              <>
                <h2 className="font-display" style={estiloH2}>Subiram em vez de descer</h2>
                <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
                  {r.subiram.map((p, i) => (
                    <div key={`${p.loja}${p.nome}`} className="flex items-center justify-between px-4 py-3" style={{ gap: 10, ...linha(i) }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--pj-text)" }}>{p.nome}</p>
                        <p className="pj-num" style={{ fontSize: 12, color: "var(--pj-text-faint)" }}>{p.loja} · {eur(p.ref, 2)} € → {eur(p.atual, 2)} €</p>
                      </div>
                      <span className="pj-num" style={{ fontSize: 13.5, fontWeight: 700, color: corPct(p.pct) }}>{pct(p.pct)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {dados.serie?.length > 1 && (
              <>
                <h2 className="font-display" style={estiloH2}>Dia a dia</h2>
                <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
                  {[...dados.serie].reverse().slice(0, 14).map((p, i) => (
                    <div key={p.dia} className="flex items-center justify-between px-4 py-2.5" style={{ gap: 10, ...linha(i) }}>
                      <span style={{ fontSize: 13.5, color: "var(--pj-text)" }}>{dataExtenso(p.dia, { ano: false })}</span>
                      <span className="pj-num" style={{ fontSize: 13.5, fontWeight: 600, color: corPct(p.varMedia) }}>
                        {pct(p.varMedia)}{depois ? ` · ${pctDe(p.desceu, p.n)}% desceram` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <h2 className="font-display" style={estiloH2}>Como é calculado</h2>
        <p style={{ ...estiloTexto, marginTop: 0 }}>
          Todos os dias o PoupeJá guarda o preço online de cada produto de marca nas cadeias comparadas. O <strong style={forte}>preço de referência</strong> de
          cada produto é a mediana dos seus preços nos {DIAS_REFERENCIA} dias antes de 1 de janeiro (a mediana não se deixa enganar por uma promoção de um dia),
          e fica fixo a partir dessa data. Depois compara-se com o último preço visto, sempre o mesmo produto na mesma loja.
        </p>
        <p style={estiloTexto}>
          Conta como «desceu o equivalente ao IVA» uma descida de 5% ou mais (a descida exata de 6% para 0% é {virgula(DESCIDA_ESPERADA)}%; a margem cobre o arredondamento ao cêntimo).
          Categorias acompanhadas: {GRUPOS.map((g) => g.nome.toLowerCase()).join("; ")}.
        </p>
        <p style={estiloTexto}>
          <strong style={forte}>Limitações.</strong> São preços das lojas online, que podem ser diferentes dos da loja física. Entram só produtos de marca
          com preço em pelo menos 3 dias da janela de referência. Uma promoção no dia da comparação conta como descida. A variação não separa o efeito do IVA
          de outras mudanças de preço.
        </p>

        {frase && (
          <>
            <h2 className="font-display" style={estiloH2}>Como citar</h2>
            <div className="rounded-2xl p-4" style={estiloCartao}>
              <p style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.6 }}>{frase}</p>
              <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 8 }}>Fonte: PoupeJá, {DOMINIO_VISIVEL}/iva-zero</p>
            </div>
          </>
        )}
        <p style={estiloTexto}>
          Os números podem ser usados livremente com indicação da fonte. Para dados de uma cadeia ou de um produto, ver a{" "}
          <a href="/imprensa" style={estiloLink}>página de imprensa</a>. O custo do cabaz semana a semana está no <a href="/barometro" style={estiloLink}>barómetro</a>.
        </p>

        <CtaApp texto="Compara a tua lista de compras, grátis e sem conta" href="/?atalho=lista" />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  const p = await lerIvaZero();
  const atual = !!p && ivaZeroServe(p);
  // A referência por produto fica na base de dados; a página só leva o resumo.
  const dados = p ? { fase: p.fase, dia: p.dia, resumo: p.resumo || null, serie: (p.serie || []).slice(-14) } : null;
  return { props: { dados, atual }, revalidate: 12 * 3600 };
}
