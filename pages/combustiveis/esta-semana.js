import Head from "next/head";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import LayoutPublico, { CtaApp } from "../../LayoutPublico";
import { Preco } from "../../Preco";
import { eur } from "../../lib/formato";
import { URL_SITE } from "../../lib/site";
import { FONTES } from "../../lib/fontes";
import { lerResumosDiarios } from "../../lib/precosSnapshot";
import { variacaoSemanal } from "../../lib/combustivelSemana";

/*
 * "Combustíveis esta semana" — o que cada marca subiu ou desceu nos
 * últimos 7 dias, com os preços médios reais da DGEG (resumo diário em
 * precos_dgeg_diario). Responde à pesquisa de todas as sextas e
 * segundas ("combustíveis sobem ou descem"), mas só com o que JÁ
 * aconteceu: não é uma previsão, e diz isso na página.
 *
 * Sem uma semana de dados ainda, a página diz desde quando recolhe e fica
 * fora do Google (noindex) até ter conteúdo.
 */
const TIPOS_PAGINA = ["Gasóleo", "Gasolina 95"];
const fmtDia = (d) => new Date(`${d}T12:00:00`).toLocaleDateString("pt-PT", { day: "numeric", month: "long" });
const cent = (v) => `${Math.abs(v).toFixed(1).replace(".", ",")} cênt.`;

function Variacao({ diff }) {
  if (diff == null) return null;
  const parado = Math.abs(diff) < 0.5;
  const desceu = diff < 0;
  const Icon = parado ? Minus : desceu ? TrendingDown : TrendingUp;
  return (
    <span className="pj-num inline-flex items-center flex-shrink-0" style={{ gap: 3, fontSize: 12, fontWeight: 600, padding: "3px 7px", borderRadius: 8,
      background: parado ? "var(--pj-subtle)" : desceu ? "var(--pj-brand-wash)" : "var(--pj-subtle)",
      color: parado ? "var(--pj-text-muted)" : desceu ? "var(--pj-brand-ink)" : "var(--pj-text)" }}>
      <Icon size={12} /> {parado ? "igual" : `${desceu ? "−" : "+"}${cent(diff)}`}
    </span>
  );
}

export default function CombustiveisSemana({ v }) {
  const temDados = !!v?.porTipo;
  const canonical = `${URL_SITE}/combustiveis/esta-semana`;
  const g = v?.porTipo?.["Gasóleo"]?.pais;
  const b = v?.porTipo?.["Gasolina 95"]?.pais;
  const verbo = (d) => d == null ? "" : Math.abs(d) < 0.5 ? "ficou igual" : d < 0 ? `desceu ${cent(d)}` : `subiu ${cent(d)}`;
  const titulo = "Combustíveis esta semana: o que subiu e desceu, por marca | PoupeJá";
  const descricao = temDados
    ? `Nos últimos 7 dias o gasóleo ${verbo(g?.diffCent)} e a gasolina 95 ${verbo(b?.diffCent)} por litro (média nacional, dados DGEG). Veja a variação de cada marca.`
    : "A variação semanal dos preços dos combustíveis por marca, com dados oficiais da DGEG.";

  const rotulo = { fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" };
  const cartao = { background: "var(--pj-card)", border: "1px solid var(--pj-border)" };

  return (
    <LayoutPublico>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={canonical} />
        {!temDados && <meta name="robots" content="noindex" />}
        <meta property="og:title" content="Combustíveis esta semana: o que subiu e desceu" key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <p style={rotulo}>
          <a href="/combustiveis" className="pj-alvo" style={{ color: "inherit" }}>Combustíveis</a> · Dados oficiais{" "}
          <a href={FONTES.dgeg.href} target="_blank" rel="noopener noreferrer" className="pj-alvo" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}>DGEG</a>
        </p>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 10 }}>
          Combustíveis esta semana: o que subiu e o que desceu
        </h1>

        {!temDados ? (
          <p style={{ fontSize: 14.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 12 }}>
            {v?.primeiroDia
              ? <>Estamos a guardar os preços médios de cada dia desde {fmtDia(v.primeiroDia)}. A comparação com a semana anterior aparece quando houver 7 dias de dados.</>
              : <>Estamos a começar a guardar os preços médios de cada dia. A comparação com a semana anterior aparece quando houver 7 dias de dados.</>}
          </p>
        ) : (
          <>
            <p style={{ fontSize: 14.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 12 }}>
              Preço médio por litro a <strong style={{ color: "var(--pj-text)" }}>{fmtDia(v.hoje)}</strong>, comparado com {fmtDia(v.antes)}.
              É o que <strong style={{ color: "var(--pj-text)" }}>já mudou</strong> nos postos, não uma previsão.
            </p>

            {TIPOS_PAGINA.filter(t => v.porTipo[t]).map(t => {
              const { pais, marcas } = v.porTipo[t];
              return (
                <section key={t}>
                  <div className="rounded-2xl p-4 mt-6" style={cartao}>
                    <p style={rotulo}>{t} · média nacional</p>
                    <div className="flex items-center justify-between" style={{ marginTop: 8, gap: 10 }}>
                      <Preco valor={pais.media} casas={3} tamanho={30} />
                      <Variacao diff={pais.diffCent} />
                    </div>
                    <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 6 }}>
                      {pais.n} postos · o mais barato do país a €{eur(pais.minimo, 3)}
                    </p>
                  </div>
                  {marcas.length > 0 && (
                    <>
                      <h2 className="font-display" style={{ fontSize: 18, fontWeight: 600, marginTop: 18, marginBottom: 10 }}>{t} por marca</h2>
                      <div className="rounded-2xl overflow-hidden" style={cartao}>
                        {marcas.map((m, i) => (
                          <div key={m.marca} className="flex items-center justify-between px-4 py-3" style={{ gap: 10, ...(i ? { borderTop: "1px solid var(--pj-subtle)" } : {}) }}>
                            <div style={{ minWidth: 0 }}>
                              <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{m.marca}</p>
                              <p className="pj-num" style={{ fontSize: 12, color: "var(--pj-text-faint)" }}>média €{eur(m.media, 3)} · {m.n} postos</p>
                            </div>
                            <Variacao diff={m.diffCent} />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </section>
              );
            })}
          </>
        )}

        <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 14, lineHeight: 1.55 }}>
          Médias dos preços comunicados pelos postos à DGEG. Só entram marcas com 10 ou mais postos, para um só posto não mexer na média.
          O preço no posto pode variar.
        </p>

        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 10 }}>Onde abastecer hoje</h2>
        <a href="/combustiveis" className="pj-tap no-underline flex items-center justify-between rounded-2xl px-4 py-3" style={{ ...cartao, color: "var(--pj-text)", fontWeight: 600, fontSize: 14 }}>
          Postos mais baratos por distrito e concelho <span aria-hidden="true">→</span>
        </a>

        <CtaApp texto="Vê os postos mais baratos perto de ti — grátis" />
      </div>
    </LayoutPublico>
  );
}

export async function getServerSideProps({ res }) {
  const v = variacaoSemanal(await lerResumosDiarios(10).catch(() => []));
  res.setHeader("Cache-Control", "public, s-maxage=1800");
  return { props: { v: v || null } };
}
