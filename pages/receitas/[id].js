import Head from "next/head";
import { Clock, Users, Leaf, ChefHat } from "lucide-react";
import LayoutPublico from "../../LayoutPublico";
import { receitas, formatarTempo, rendimento } from "../../lib/receitas/motor";
import { BotaoAbrirPoupeja } from "../../PaginasPrecos";
import { euros, porUnidade } from "../../lib/seoFormato";
import { custoReceita, custoPorPessoa as porPessoa, hojeLisboa } from "../../lib/seoPrecos";
import { resumosRecentes } from "../../lib/seoPrecosDados";

import { jsonLdSeguro } from "../../lib/escapar";
import ColecaoReceitas from "../../ColecaoReceitas";
import IngredientesReceita from "../../IngredientesReceita";
import FotoReceita from "../../FotoReceita";
import { fotosDe } from "../../lib/receitas/fotos";
import { COLECOES, GRUPOS_COLECAO, colecaoPorSlug, receitasDaColecao, colecoesDaReceita, parecidas } from "../../lib/receitas/colecoes";
const CATEGORIA = { prato: "Prato principal", sopa: "Sopa", "pequeno-almoco": "Pequeno-almoço", sobremesa: "Sobremesa" };

const EMENTAS = receitas();

const SITE_URL = "https://xn--poupej-uta.com";

/*
 * Página pública SEO — uma receita económica.
 * Estática; alvo: "receita caldo verde barata", "jantar económico 4 pessoas", etc.
 * O JSON-LD Recipe torna-a elegível para rich results do Google (cartões de receita).
 *
 * O mesmo caminho serve as coleções (/receitas/frango…): ver ColecaoReceitas.
 */
export default function Pagina(props) {
  return props.colecao ? <ColecaoReceitas {...props} /> : <Receita {...props} />;
}

function Receita({ receita, outras, colecoes = [], custo = null }) {
  const rende = rendimento(receita.porcoes, receita.un);
  const porUm = rendimento(1, receita.un).slice(2);
  const pessoaDesc = porPessoa(custo, receita.porcoes);
  const descricao = pessoaDesc
    ? `${receita.nome} por cerca de ${euros(pessoaDesc)} € por ${rendimento(1, receita.un).slice(2)}, com os preços de hoje nos supermercados. Pronta em ${formatarTempo(receita.tempoMin)}, ${rende}, passo a passo simples.`
    : `Receita económica de ${receita.nome} (${rende}), pronta em ${formatarTempo(receita.tempoMin)}. Ingredientes com quantidades e passo a passo simples — poupa nas compras com o PoupeJá.`;
  // Até ~60 caracteres: o que passa disso o Google corta no resultado.
  const titulo = [
    `${receita.nome} — receita barata (${rende}, ${formatarTempo(receita.tempoMin)}) | PoupeJá`,
    `${receita.nome} — receita barata (${rende}) | PoupeJá`,
    `${receita.nome} — receita barata | PoupeJá`,
  ].find(t => t.length <= 60) || `${receita.nome} | PoupeJá`;
  /* Custo por pessoa em destaque (título, imagem de partilha, Google) só
     quando quase todos os ingredientes têm preço: com metade, o número
     ficava baixo demais e prometia o que a receita não cumpre. Abaixo
     disso fica a faixa € / €€ de sempre. */
  const pessoa = porPessoa(custo, receita.porcoes);
  const pessoaTxt = pessoa ? `${euros(pessoa)} €` : null;
  const fotos = fotosDe(receita.id);
  const ogImage = `${SITE_URL}/api/og?v=receita&nome=${encodeURIComponent(receita.nome)}&tempo=${receita.tempoMin}&custo=${receita.custo}${pessoa ? `&pp=${pessoa.toFixed(2)}` : ""}${fotos ? `&foto=${receita.id}` : ""}`;
  // O Google pede a mesma fotografia em 1:1, 4:3 e 16:9 para os cartões de receita.
  const imagensLd = fotos ? [fotos.quadrada, fotos.grande, fotos.larga].map((u) => `${SITE_URL}${u}`) : [ogImage];

  const dietasLd = [
    receita.vegano && "https://schema.org/VeganDiet",
    receita.veg && "https://schema.org/VegetarianDiet",
    receita.dietas.includes("sem-gluten") && "https://schema.org/GlutenFreeDiet",
    receita.dietas.includes("sem-lactose") && "https://schema.org/LowLactoseDiet",
  ].filter(Boolean);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: receita.nome,
    description: descricao,
    image: imagensLd,
    author: { "@type": "Organization", name: "PoupeJá", url: SITE_URL },
    recipeYield: rende,
    totalTime: `PT${receita.tempoMin}M`,
    recipeCuisine: "Portuguesa",
    recipeCategory: CATEGORIA[receita.tipo],
    keywords: `receita barata, receita económica, ${receita.nome.toLowerCase()}, ${CATEGORIA[receita.tipo].toLowerCase()}`,
    recipeIngredient: receita.ingredientes.map(i => `${i.nome} — ${i.qtd}`),
    recipeInstructions: receita.passos.map((p, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text: p,
    })),
    nutrition: {
      "@type": "NutritionInformation",
      servingSize: `1 ${porUm}`,
      calories: `${receita.nutricao.kcal} kcal`,
      proteinContent: `${receita.nutricao.p} g`,
      carbohydrateContent: `${receita.nutricao.hc} g`,
      fatContent: `${receita.nutricao.g} g`,
      fiberContent: `${receita.nutricao.fib} g`,
    },
    ...(dietasLd.length ? { suitableForDiet: dietasLd } : {}),
    ...(custo?.total ? { estimatedCost: { "@type": "MonetaryAmount", currency: "EUR", value: custo.total.toFixed(2) } } : {}),
  };

  return (
    <LayoutPublico destaqueEmentas>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={`${SITE_URL}/receitas/${receita.id}`} />
        <meta property="og:title" content={`${receita.nome} — receita barata (${rende})`} key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={`${SITE_URL}/receitas/${receita.id}`} key="og:url" />
        <meta property="og:image" content={ogImage} key="og:image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(jsonLd) }} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          <a href="/receitas" className="pj-alvo" style={{ color: "var(--pj-text-faint)" }}>Receitas baratas</a>
        </p>
        {/* O emoji fica fora do <h1>: o texto do título é o que o Google lê
            e mostra, e "🍲 Caldo verde" não é o nome da receita. À vista
            continua igual, ao lado. */}
        <div className="flex items-baseline" style={{ gap: 8, marginTop: 10 }}>
          <span aria-hidden="true" style={{ fontSize: 28, lineHeight: 1.15 }}>{receita.emoji}</span>
          <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            {receita.nome}
          </h1>
        </div>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1" style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 12 }}>
          <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {formatarTempo(receita.tempoMin)}</span>
          <span className="inline-flex items-center gap-1.5"><Users size={13} /> {rende}</span>
          {pessoaTxt ? (
            <a href="#quanto-custa" style={{ fontWeight: 700, color: "var(--pj-brand-ink)" }}>
              ≈ {pessoaTxt} por {porUm}
            </a>
          ) : (
            <span style={{ fontWeight: 600, color: "var(--pj-brand-ink)" }}>
              {"€".repeat(receita.custo)}<span aria-hidden="true" style={{ color: "var(--pj-text-faint)", opacity: 0.45 }}>{"€".repeat(3 - receita.custo)}</span>
              {" "}{receita.custo === 1 ? "muito barata" : "barata"}
            </span>
          )}
          {receita.airfryer && <span className="inline-flex items-center gap-1.5"><ChefHat size={13} /> air fryer</span>}
          {receita.veg && <span className="inline-flex items-center gap-1.5"><Leaf size={13} /> vegetariano</span>}
        </p>

        <div style={{ marginTop: 20 }}>
          <FotoReceita id={receita.id} nome={receita.nome} prioridade preco={pessoaTxt ? `${pessoaTxt} por ${porUm}` : null} />
        </div>

        <div className="grid grid-cols-4 gap-1 text-center rounded-2xl" style={{ marginTop: 20, padding: "14px 8px", background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
          {[
            [receita.nutricao.kcal, "kcal"],
            [`${receita.nutricao.p} g`, "proteína"],
            [`${receita.nutricao.hc} g`, "hidratos"],
            [`${receita.nutricao.g} g`, "gordura"],
          ].map(([v, l]) => (
            <div key={l}>
              <p className="font-display" style={{ fontSize: 19, fontWeight: 600 }}>{v}</p>
              <p style={{ fontSize: 11.5, color: "var(--pj-text-muted)" }}>{l}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 8 }}>
          Por {porUm}, valores aproximados calculados a partir dos ingredientes.
        </p>

        <IngredientesReceita receita={receita} />

        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>
          Preparação
        </h2>
        <ol className="flex flex-col gap-3" style={{ paddingLeft: 0, listStyle: "none" }}>
          {receita.passos.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full text-white flex items-center justify-center" style={{ background: "var(--pj-brand)", fontSize: 12, fontWeight: 600, marginTop: 1 }}>{i + 1}</span>
              <span style={{ fontSize: 14.5, color: "var(--pj-text-strong)", lineHeight: 1.6 }}>{p}</span>
            </li>
          ))}
        </ol>

        <h2 id="quanto-custa" className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36, scrollMarginTop: 16 }}>
          Quanto custa esta receita?
        </h2>
        <p style={{ fontSize: 14, color: "var(--pj-text-muted)", lineHeight: 1.7, marginTop: 10 }}>
          {pessoaTxt
            ? <>O valor muda com as promoções de cada semana.</>
            : <>Indicamos uma faixa de custo ({"€".repeat(receita.custo)}) em vez de um total ao cêntimo,
              porque os preços variam por loja e época.</>}
          {" "}Para pagares o mínimo, espreita os{" "}
          <a href="/folhetos" style={{ color: "var(--pj-brand-ink)", fontWeight: 600 }}>folhetos dos supermercados desta semana</a>{" "}
          antes de ires às compras — na app PoupeJá os ingredientes desta receita entram na tua lista
          de compras num toque.
        </p>
        {/* Com os preços de hoje: só os ingredientes que se convertem na
            unidade do preço (gramas × €/kg), e a página diz quantos foram. */}
        {custo?.total != null && (
          <p style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.7, marginTop: 10 }}>
            Com os preços de hoje, no supermercado mais barato para cada um,{" "}
            <strong>{custo.comPreco} dos {custo.contados} ingredientes</strong> custam cerca de{" "}
            <strong style={{ color: "var(--pj-brand-ink)" }}>{euros(custo.total)} €</strong> para {rende}
            {pessoaTxt ? <> (<strong>{pessoaTxt} por {porUm}</strong>)</> : null}.
            Os da despensa ficam de fora, e para o que se compra à unidade usamos pesos médios: é uma estimativa.
          </p>
        )}
        {custo?.ligacoes?.length > 0 && (
          <>
            <h3 className="font-display" style={{ fontSize: 16, fontWeight: 600, marginTop: 20, marginBottom: 10 }}>
              Preço dos ingredientes hoje
            </h3>
            <div className="flex flex-wrap gap-2">
              {custo.ligacoes.map(l => (
                <a key={l.slug} href={`/precos/${l.slug}`} className="pj-tap no-underline"
                  style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-brand-ink)", background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 12, padding: "8px 14px" }}>
                  {l.nome}{l.valor != null ? ` · ${euros(l.valor)} €${porUnidade(l.unidade)}` : ""}
                </a>
              ))}
            </div>
          </>
        )}
        <BotaoAbrirPoupeja href="/?atalho=ementas" tipo="receita" texto="Pôr esta receita no plano da semana, com lista de compras" />

        {receita.tipo === "prato" && (
          <>
            <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36 }}>
              Para a marmita
            </h2>
            <p style={{ fontSize: 14, color: "var(--pj-text-muted)", lineHeight: 1.7, marginTop: 10 }}>
              Cozinha a dobrar e o almoço do dia seguinte fica feito: com as quantidades para 8 em vez de 4, metade vai para
              caixas logo depois do jantar e entra no frigorífico em menos de 2 horas (tampa só quando arrefecer). Come-se em 2 ou 3 dias;
              aquece até ficar bem quente no meio.
              No plano da semana da app, «Ajustar» → «A dobrar, para a marmita» soma as compras sozinho.
            </p>
          </>
        )}

        {colecoes.length > 0 && (
          <>
            <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36, marginBottom: 14 }}>
              Esta receita está em
            </h2>
            <div className="flex flex-wrap gap-2">
              {colecoes.map((c) => (
                <a key={c.slug} href={`/receitas/${c.slug}`} className="pj-tap no-underline"
                  style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-brand-ink)", background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 12, padding: "8px 14px" }}>
                  {c.titulo}
                </a>
              ))}
            </div>
          </>
        )}

        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36, marginBottom: 14 }}>
          Receitas parecidas
        </h2>
        <div className="flex flex-wrap gap-2">
          {outras.map(o => (
            <a
              key={o.id}
              href={`/receitas/${o.id}`}
              className="pj-tap no-underline"
              style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-brand-ink)", background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 12, padding: "8px 14px" }}
            >
              {o.emoji} {o.nome}
            </a>
          ))}
          <a
            href="/receitas"
            className="pj-tap no-underline"
            style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-text-muted)", background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 12, padding: "8px 14px" }}
          >
            Todas as receitas
          </a>
        </div>

      </div>
    </LayoutPublico>
  );
}

export async function getStaticPaths() {
  return {
    paths: [...EMENTAS.map(e => ({ params: { id: e.id } })), ...COLECOES.map(c => ({ params: { id: c.slug } }))],
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const colecao = colecaoPorSlug(params.id);
  if (colecao) {
    // Só código: sem Supabase e sem revalidate (muda com um deploy).
    const lista = receitasDaColecao(colecao).map((r) => ({
      id: r.id, nome: r.nome, emoji: r.emoji, tempoMin: r.tempoMin, custo: r.custo, kcal: r.nutricao.kcal, veg: r.veg, vegano: r.vegano,
    }));
    const grupos = GRUPOS_COLECAO.map((g) => ({
      titulo: g.titulo,
      itens: COLECOES.filter((c) => c.grupo === g.id && c.slug !== colecao.slug).map((c) => ({ slug: c.slug, curto: c.curto })),
    })).filter((g) => g.itens.length);
    return { props: { colecao: { slug: colecao.slug, titulo: colecao.titulo, intro: colecao.intro, curto: colecao.curto }, lista, grupos } };
  }
  const receita = EMENTAS.find(e => e.id === params.id);
  if (!receita) return { notFound: true };
  const custo = custoReceita(receita.ingredientes, await resumosRecentes(hojeLisboa()));
  return {
    props: {
      receita,
      outras: parecidas(receita).map(e => ({ id: e.id, nome: e.nome, emoji: e.emoji })),
      colecoes: colecoesDaReceita(receita).map(c => ({ slug: c.slug, titulo: c.titulo })),
      custo: JSON.parse(JSON.stringify(custo)),
    },
    // Os preços dos ingredientes mudam: a página regenera-se de 3 em 3 horas.
    revalidate: 43200,
  };
}
