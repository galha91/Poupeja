import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import InteresseNegocios from "../InteresseNegocios";
import LogoLoja from "../LogoLoja";
import { Migalhas, Pilulas, Atualizado, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloRotulo, estiloLink } from "../PaginasPrecos";
import { breadcrumbLd } from "../lib/seoPrecos";
import { euros } from "../lib/seoFormato";
import { URL_SITE } from "../lib/site";

import { jsonLdSeguro } from "../lib/escapar";
/*
 * PoupeJá Negócios — página de validação. Para cafés, restaurantes e
 * pastelarias que se abastecem no supermercado: mostra um cabaz de exemplo
 * com preços reais (lib/cabazNegocios, calculado uma vez por dia nos GitHub
 * Actions) e recolhe a lista de espera. O serviço ainda não existe e a
 * página diz isso mesmo; nada aqui promete o que não está feito.
 */
const TITULO = "PoupeJá Negócios: onde o teu café ou restaurante compra mais barato";
const DESCRICAO = "Para cafés, restaurantes e pastelarias que se abastecem no supermercado: vê quanto custa o mesmo cabaz semanal no Continente, Pingo Doce e Auchan e entra na lista de espera.";

export async function getStaticProps() {
  const { lerCabazNegocios } = await import("../lib/cabazNegocios");
  const cabaz = await lerCabazNegocios();
  return { props: { cabaz }, revalidate: cabaz ? 12 * 3600 : 3600 };
}

const forte = { color: "var(--pj-text)" };
const celula = { padding: "10px 12px", fontSize: 13.5, textAlign: "right", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" };

function CabazExemplo({ cabaz }) {
  const { lojas, itens, barata, cara, empate, divisao } = cabaz;
  return (
    <>
      <h2 className="font-display" style={estiloH2}>Um cabaz de exemplo, com preços de hoje</h2>
      <p style={{ ...estiloTexto, marginTop: 0 }}>
        {itens.length} artigos que um café ou restaurante pequeno gasta numa semana, nas mesmas quantidades em cada loja.{" "}
        {empate
          ? <>As lojas mais baratas quase empatam; a diferença para a mais cara é de <strong style={forte}>{euros(cabaz.poupancaSemana)} €</strong>.</>
          : <>No <strong style={forte}>{barata.nome}</strong> custa <strong style={forte}>{euros(barata.total)} €</strong>; no {cara.nome}, {euros(cara.total)} €. São <strong style={forte}>{euros(cabaz.poupancaSemana)} € de diferença numa semana</strong>.</>}
      </p>

      <div className="rounded-2xl overflow-hidden" style={{ ...estiloCartao, marginTop: 14 }}>
        {lojas.map((l, i) => (
          <div key={l.loja} className="flex items-center justify-between px-4 py-3" style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
            <span className="flex items-center gap-3" style={{ minWidth: 0 }}>
              <LogoLoja nome={l.nome} size={30} />
              <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)" }}>{l.nome}</span>
            </span>
            <span style={{ fontSize: 16, fontWeight: 600, color: i === 0 && !empate ? "var(--pj-brand-ink)" : "var(--pj-text)", fontVariantNumeric: "tabular-nums" }}>{euros(l.total)} €</span>
          </div>
        ))}
      </div>

      {divisao && (
        <p style={estiloTexto}>
          Dividindo as compras por duas lojas ({divisao.lojas.map((l) => `${l.artigos} artigos no ${l.nome}`).join(" e ")}) o cabaz fica em{" "}
          <strong style={forte}>{euros(divisao.total)} €</strong>, menos {euros(divisao.poupancaExtra)} € do que na loja mais barata.
        </p>
      )}
      {cabaz.poupancaMediaMes > 0 && (
        <p style={estiloTexto}>
          Quem compra tudo sempre na mesma loja paga em média {euros(cabaz.media)} € por este cabaz. Escolher a melhor opção de cada semana
          dá uma diferença estimada de <strong style={forte}>{euros(cabaz.poupancaMediaMes)} € por mês</strong>. É uma estimativa para este
          cabaz: o teu depende do que compras.
        </p>
      )}

      <div className="rounded-2xl" style={{ ...estiloCartao, marginTop: 18, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <caption className="sr-only">Custo de cada artigo do cabaz em cada supermercado</caption>
          <thead>
            <tr>
              <th scope="col" style={{ ...estiloRotulo, padding: "12px 12px 10px 16px", textAlign: "left" }}>Artigo</th>
              {lojas.map((l) => <th scope="col" key={l.loja} style={{ ...estiloRotulo, padding: "12px 12px 10px", textAlign: "right" }}>{l.nome}</th>)}
            </tr>
          </thead>
          <tbody>
            {itens.map((it) => (
              <tr key={it.nome} style={{ borderTop: "1px solid var(--pj-subtle)" }}>
                <th scope="row" style={{ padding: "10px 12px 10px 16px", textAlign: "left", fontWeight: 500, fontSize: 13.5, color: "var(--pj-text)" }}>
                  {it.nome} <span style={{ color: "var(--pj-text-faint)", fontSize: 12, whiteSpace: "nowrap" }}>{it.rotulo}</span>
                </th>
                {lojas.map((l) => (
                  <td key={l.loja} style={{ ...celula, fontWeight: it.barata === l.loja ? 600 : 400, color: it.barata === l.loja ? "var(--pj-brand-ink)" : "var(--pj-text-muted)" }}>
                    {euros(it.custos[l.loja])} €
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 10, lineHeight: 1.6 }}>
        <Atualizado dia={cabaz.dia} prefixo="Preços de" />. Preço mais baixo de cada artigo em cada loja online, ao quilo, litro ou unidade,
        com IVA. A verde, a loja mais barata em cada artigo. Só entram artigos que as três lojas têm. Os preços podem mudar e a loja física
        pode ter outros.
      </p>
    </>
  );
}

export default function Negocios({ cabaz }) {
  const canonical = `${URL_SITE}/negocios`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Negócios", path: "/negocios" }];
  return (
    <LayoutPublico>
      <Head>
        <title>{TITULO}</title>
        <meta name="description" content={DESCRICAO} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={TITULO} key="og:title" />
        <meta property="og:description" content={DESCRICAO} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(breadcrumbLd(URL_SITE, passos)) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <p style={{ ...estiloRotulo, marginTop: 14 }}>Em preparação</p>
        <h1 className="font-display" style={estiloH1}>PoupeJá Negócios: onde o teu café ou restaurante compra mais barato</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
          Se abasteces o teu negócio no supermercado, o mesmo cabaz não custa o mesmo em todas as lojas, e a mais barata muda de semana para
          semana. Guardamos todos os dias os preços de centenas de artigos e fazemos essa conta por ti.
        </p>
        <a href="#lista-de-espera" className="pj-tap inline-flex no-underline mt-5 rounded-2xl px-5 py-3"
          style={{ background: "var(--pj-brand)", color: "#fff", fontSize: 14.5, fontWeight: 600 }}>
          Entrar na lista de espera
        </a>

        {cabaz && <CabazExemplo cabaz={cabaz} />}

        <h2 className="font-display" style={estiloH2}>O que estamos a preparar</h2>
        <ol style={{ ...estiloTexto, marginTop: 0, paddingLeft: 20, listStyle: "decimal" }}>
          <li style={{ marginTop: 6 }}><strong style={forte}>A tua lista fixa.</strong> Os artigos que compras sempre, com as tuas quantidades.</li>
          <li style={{ marginTop: 6 }}><strong style={forte}>Um email quando compensa mudar.</strong> Onde está mais barato cada artigo e a lista toda, numa loja ou em duas.</li>
          <li style={{ marginTop: 6 }}><strong style={forte}>A conta ao fim da semana.</strong> Quanto custou a tua lista em cada loja e quanto poupaste com a escolha que fizeste.</li>
        </ol>

        <h2 className="font-display" style={estiloH2}>O que não faz</h2>
        <p style={{ ...estiloTexto, marginTop: 0 }}>
          Só comparamos lojas que publicam os preços online: Continente, Pingo Doce e Auchan nesta página, e outras cadeias em alguns artigos.
          Makro, Recheio e outros grossistas ficam de fora, porque não publicam preços que possamos comparar. São preços de prateleira, com
          IVA, sem descontos de cartão nem condições negociadas com fornecedores.
        </p>

        <InteresseNegocios />

        <h2 className="font-display" style={estiloH2}>Perguntas frequentes</h2>
        <div style={{ marginTop: 18 }}>
          <h3 style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>Quando abre e quanto custa?</h3>
          <p style={{ ...estiloTexto, marginTop: 6 }}>Ainda não há data nem preço. Abre se houver negócios suficientes interessados; por isso perguntamos quanto pagarias.</p>
        </div>
        <div style={{ marginTop: 18 }}>
          <h3 style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>Posso comparar preços já hoje?</h3>
          <p style={{ ...estiloTexto, marginTop: 6 }}>
            Sim. A comparação de listas do PoupeJá é grátis e não pede conta: <a href="/?atalho=lista" style={estiloLink}>compara a tua lista</a> ou
            vê os <a href="/precos" style={estiloLink}>preços de supermercado de hoje</a>.
          </p>
        </div>
        <div style={{ marginTop: 18 }}>
          <h3 style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>O que fazem com o meu email?</h3>
          <p style={{ ...estiloTexto, marginTop: 6 }}>Usamo-lo só para te avisar sobre o PoupeJá Negócios. Não o vendemos nem cedemos. Para sair, basta responderes a um email nosso.</p>
        </div>

        <h2 className="font-display" style={estiloH2}>Ver também</h2>
        <Pilulas itens={[
          { href: "/precos", texto: "Preços de supermercado" },
          { href: "/comparar", texto: "Comparar supermercados" },
          { href: "/combustiveis", texto: "Combustíveis mais baratos" },
          { href: "/recibos-verdes", texto: "Recibos verdes", fraco: true },
        ]} />
      </div>
    </LayoutPublico>
  );
}
