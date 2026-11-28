import Head from "next/head";
import { Clock, ChefHat, Leaf } from "lucide-react";
import LayoutPublico, { CtaApp } from "../../LayoutPublico";
import { DestaqueEmentasPublico } from "../../DestaqueEmentas";
import CartaoImportar from "../../CartaoImportar";
import { receitas, formatarTempo, rendimento } from "../../lib/receitas/motor";
import FotoReceita from "../../FotoReceita";
import { temFoto } from "../../lib/receitas/fotos";
// Com fotografias na lista, o emoji ocupa o mesmo espaço e os nomes ficam alinhados.
const COM_FOTOS = receitas().some((r) => temFoto(r.id));

import { jsonLdSeguro } from "../../lib/escapar";
import { COLECOES, GRUPOS_COLECAO } from "../../lib/receitas/colecoes";
const EMENTAS = receitas();
const GRUPOS = [
  { tipo: "prato", titulo: "Jantares", ancora: "jantares" },
  { tipo: "sopa", titulo: "Sopas", ancora: "sopas" },
  { tipo: "pequeno-almoco", titulo: "Pequeno-almoço e lanche", ancora: "pequeno-almoco" },
  { tipo: "sobremesa", titulo: "Sobremesas", ancora: "sobremesas" },
];

const SITE_URL = "https://xn--poupej-uta.com";

/*
 * Página pública SEO — receitas económicas para 4 pessoas.
 * Estática; alvo: "receitas baratas", "receitas económicas",
 * "jantar barato para 4 pessoas", "refeições económicas".
 */
export default function Receitas({ custos = null }) {
  const pp = (r) => custos?.[r.id] ? `${custos[r.id].toFixed(2).replace(".", ",")} €/${rendimento(1, r.un).slice(2)}` : null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Receitas baratas",
    numberOfItems: EMENTAS.length,
    itemListElement: EMENTAS.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: e.nome,
      url: `${SITE_URL}/receitas/${e.id}`,
    })),
  };
  return (
    <LayoutPublico>
      <Head>
        <title>{`Receitas Baratas — ${EMENTAS.length} jantares, sopas, pequenos-almoços e sobremesas | PoupeJá`}</title>
        <meta name="description" content={`${EMENTAS.length} receitas portuguesas baratas, com ingredientes, quantidades e passo a passo. Jantares, sopas, pequenos-almoços e sobremesas, para todos os aparelhos da cozinha — grátis, sem registo.`} />
        <link rel="canonical" href={`${SITE_URL}/receitas`} />
        <meta property="og:title" content="Receitas baratas" key="og:title" />
        <meta property="og:description" content={`${EMENTAS.length} refeições económicas portuguesas com passo a passo — e os ingredientes entram na lista de compras num toque.`} key="og:description" />
        <meta property="og:url" content={`${SITE_URL}/receitas`} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(jsonLd) }} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          Cozinha económica
        </p>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 10 }}>
          Receitas baratas
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 12 }}>
          {EMENTAS.length} receitas portuguesas económicas — jantares, sopas, pequenos-almoços e sobremesas — com quantidades certas e passo a passo simples.
          Na app PoupeJá os ingredientes de cada receita entram na tua{" "}
          <strong style={{ color: "var(--pj-text)" }}>lista de compras num toque</strong> — e vês os folhetos
          antes de ir às compras.
        </p>

        <CartaoImportar onde="receitas" style={{ marginTop: 20 }} />

        {/* O planeador logo no topo: é o que distingue estas receitas. */}
        <DestaqueEmentasPublico />

        {/* As coleções: "receitas de frango", "jantares rápidos"… */}
        {GRUPOS_COLECAO.map((g) => (
          <nav key={g.id} aria-label={`Receitas ${g.titulo.toLowerCase()}`} style={{ marginTop: 20 }}>
            <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 8 }}>{g.titulo}</p>
            <div className="flex flex-wrap gap-2">
              {COLECOES.filter((c) => c.grupo === g.id).map((c) => (
                <a key={c.slug} href={`/receitas/${c.slug}`} className="pj-tap no-underline"
                  style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-brand-ink)", background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 12, padding: "8px 14px" }}>
                  {c.curto}
                </a>
              ))}
            </div>
          </nav>
        ))}

        {GRUPOS.map((g) => {
          // Com os preços de hoje, dentro de cada faixa € as mais baratas por pessoa vêm primeiro.
          const doGrupo = EMENTAS.filter((e) => e.tipo === g.tipo)
            .sort((a, b) => a.custo - b.custo || (custos?.[a.id] ?? 99) - (custos?.[b.id] ?? 99));
          return (
            <section key={g.tipo}>
              <h2 id={g.ancora} className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>
                {g.titulo} <span style={{ fontSize: 14, fontWeight: 500, color: "var(--pj-text-faint)" }}>· {doGrupo.length}</span>
              </h2>
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
          {doGrupo.map((e, i) => (
            <a
              key={e.id}
              href={`/receitas/${e.id}`}
              className="flex items-center gap-3.5 px-4 py-3.5 no-underline"
              style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}
            >
              {temFoto(e.id)
                ? <FotoReceita id={e.id} nome={e.nome} tamanho="mini" px={52} />
                : <span className="flex items-center justify-center" style={{ fontSize: 28, flexShrink: 0, width: COM_FOTOS ? 52 : "auto" }}>{e.emoji}</span>}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)" }}>{e.nome}</span>
                <span className="flex items-center gap-2.5" style={{ fontSize: 12, color: "var(--pj-text-muted)", marginTop: 2 }}>
                  <span className="inline-flex items-center gap-1"><Clock size={11} /> {formatarTempo(e.tempoMin)}</span>
                  <span style={{ fontWeight: 600, color: "var(--pj-brand-ink)" }}>{pp(e) || "€".repeat(e.custo)}</span>
                  {e.airfryer && <span className="inline-flex items-center gap-1"><ChefHat size={11} /> air fryer</span>}
                  {e.veg && <span className="inline-flex items-center gap-1"><Leaf size={11} /> vegetariano</span>}
                </span>
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pj-brand-ink)", flexShrink: 0 }}>Ver →</span>
            </a>
          ))}
        </div>

            </section>
          );
        })}

        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36 }}>
          Comer bem por pouco — como funciona
        </h2>
        <p style={{ fontSize: 14, color: "var(--pj-text-muted)", lineHeight: 1.7, marginTop: 10 }}>
          Todas as receitas usam ingredientes baratos e fáceis de encontrar em qualquer supermercado
          português. Indicamos faixas de custo (€ = mais barato) em vez de totais ao cêntimo, porque
          os preços variam por loja e época. O truque para poupar de verdade: escolhe as receitas da
          semana, mete os ingredientes na lista e espreita os <a href="/folhetos" style={{ color: "var(--pj-brand-ink)", fontWeight: 600 }}>folhetos dos supermercados</a>{" "}
          antes de sair de casa.
        </p>

        <CtaApp href="/?atalho=ementas" texto="Cria o teu plano da semana na app — grátis, sem conta" />
      </div>
    </LayoutPublico>
  );
}

/*
 * O custo por pessoa de cada receita vem de uma linha pequena de
 * paginas_marca, calculada no GitHub (lib/receitasCusto). Sem ela, a
 * página fica igual à de sempre, com a faixa € / €€.
 */
export async function getStaticProps() {
  const { lerCustosReceitas } = await import("../../lib/receitasCusto");
  const custos = await lerCustosReceitas();
  return { props: { custos }, revalidate: 12 * 3600 };
}
