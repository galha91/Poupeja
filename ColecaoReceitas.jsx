import Head from "next/head";
import { Clock, Leaf } from "lucide-react";
import LayoutPublico from "./LayoutPublico";
import { BotaoAbrirPoupeja, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao } from "./PaginasPrecos";
import { breadcrumbLd } from "./lib/seoPrecos";
import { jsonLdSeguro } from "./lib/escapar";
import { URL_SITE } from "./lib/site";

/*
 * Página pública de uma coleção de receitas (/receitas/frango,
 * /receitas/jantares-rapidos…). Estática: os dados vêm do código
 * (lib/receitas/colecoes.js), sem leituras ao Supabase.
 */

const tempo = (min) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)} h${min % 60 ? ` ${String(min % 60).padStart(2, "0")}` : ""}`);
const chip = { fontSize: 13, fontWeight: 600, color: "var(--pj-brand-ink)", background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 12, padding: "8px 14px" };

export default function ColecaoReceitas({ colecao, lista, grupos }) {
  const canonical = `${URL_SITE}/receitas/${colecao.slug}`;
  const passos = [
    { nome: "PoupeJá", path: "/" },
    { nome: "Receitas baratas", path: "/receitas" },
    { nome: colecao.curto, path: `/receitas/${colecao.slug}` },
  ];
  const titulo = `${colecao.titulo}: ${lista.length} ideias para 4 pessoas`;
  const rapidas = lista.filter((r) => r.tempoMin <= 30).length;
  const baratas = lista.filter((r) => r.custo === 1).length;
  const descricao = `${lista.length} receitas (${lista.slice(0, 3).map((r) => r.nome.toLowerCase()).join(", ")}…) com quantidades para 4 pessoas e passo a passo. ${baratas} das mais baratas (€) e ${rapidas} prontas em meia hora.`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: colecao.titulo,
    numberOfItems: lista.length,
    itemListElement: lista.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.nome, url: `${URL_SITE}/receitas/${r.id}` })),
  };
  return (
    <LayoutPublico destaqueEmentas>
      <Head>
        <title>{`${titulo} | PoupeJá`}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={titulo} key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(ld) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(breadcrumbLd(URL_SITE, passos)) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>{colecao.titulo}</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)" }}>{colecao.intro}</p>
        <p style={estiloTexto}>
          {lista.length} receitas para 4 pessoas, as mais baratas primeiro. O custo vai em faixas (€ a €€€): o preço a sério depende da loja e da semana,
          e a app PoupeJá compara-o nos supermercados quando os ingredientes vão para a lista.
        </p>

        <div className="rounded-2xl overflow-hidden" style={{ ...estiloCartao, marginTop: 20 }}>
          {lista.map((r, i) => (
            <a key={r.id} href={`/receitas/${r.id}`} className="pj-tap no-underline flex items-center gap-3 px-4 py-3"
              style={i ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
              <span aria-hidden="true" className="flex items-center justify-center flex-shrink-0" style={{ fontSize: 24, width: 44, height: 44, borderRadius: 12, background: "var(--pj-surface)" }}>{r.emoji}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>{r.nome}</span>
                <span className="flex flex-wrap items-center gap-x-3" style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 2 }}>
                  <span className="inline-flex items-center gap-1"><Clock size={11} /> {tempo(r.tempoMin)}</span>
                  <span style={{ fontWeight: 600, color: "var(--pj-brand-ink)" }}>{"€".repeat(r.custo)}<span aria-hidden="true" style={{ color: "var(--pj-text-faint)", opacity: 0.45 }}>{"€".repeat(3 - r.custo)}</span></span>
                  <span>{r.kcal} kcal</span>
                  {r.vegano ? <span className="inline-flex items-center gap-1"><Leaf size={11} /> vegano</span>
                    : r.veg ? <span className="inline-flex items-center gap-1"><Leaf size={11} /> vegetariano</span> : null}
                </span>
              </span>
            </a>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 8 }}>Calorias por pessoa, aproximadas, calculadas a partir dos ingredientes.</p>

        <BotaoAbrirPoupeja href="/?atalho=ementas" tipo="receita" texto="Planear a semana com estas receitas, com lista de compras" />

        {grupos.map((g) => (
          <div key={g.titulo}>
            <h2 className="font-display" style={estiloH2}>{g.titulo}</h2>
            <div className="flex flex-wrap gap-2">
              {g.itens.map((c) => (
                <a key={c.slug} href={`/receitas/${c.slug}`} className="pj-tap no-underline" style={chip}>{c.curto}</a>
              ))}
            </div>
          </div>
        ))}
        <p style={{ marginTop: 20 }}>
          <a href="/receitas" className="pj-tap no-underline" style={{ ...chip, color: "var(--pj-text-muted)" }}>Todas as receitas</a>
        </p>
      </div>
    </LayoutPublico>
  );
}
