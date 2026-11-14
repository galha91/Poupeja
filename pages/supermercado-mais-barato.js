import Head from "next/head";
import LayoutPublico, { CtaApp } from "../LayoutPublico";
import { Preco } from "../Preco";
import { Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import { breadcrumbLd } from "../lib/seoPrecos";
import { jsonLdSeguro } from "../lib/escapar";
import { eur } from "../lib/formato";
import { dataExtenso } from "../lib/datas";
import { URL_SITE } from "../lib/site";
import { cadeia, N_COMPARADAS } from "../lib/cobertura";
import { lerBarometro, barometroServe } from "../lib/barometro";
import { resumoMaisBarato, frenteAFrente } from "../lib/maisBarato";

/*
 * "Qual é o supermercado mais barato em Portugal?" — a resposta com os
 * dados do Barómetro (o mesmo cabaz, semana a semana), sem vencedor
 * inventado: com empate diz que há empate, e explica porque é que o
 * primeiro lugar muda.
 *
 * Lê a mesma linha de paginas_marca que /barometro (regra 1 do
 * CLAUDE.md). Sem dados recentes fica fora do Google (noindex).
 */

const forte = { color: "var(--pj-text)" };
const linha = (i) => (i ? { borderTop: "1px solid var(--pj-subtle)" } : {});
const vezes = (n) => (n === 1 ? "1 semana" : `${n} semanas`);

function respostaPar(f) {
  if (!f) return null;
  const { nomeA, nomeB, a, b, empates, semanas, ultima } = f;
  const quem = ultima.diff < 0 ? nomeA : ultima.diff > 0 ? nomeB : null;
  const ult = quem
    ? `Na semana de ${dataExtenso(ultima.dia, { ano: false })}, o cabaz ficou ${eur(Math.abs(ultima.diff), 2)} € mais barato no ${quem}.`
    : `Na semana de ${dataExtenso(ultima.dia, { ano: false })}, o cabaz custou o mesmo nos dois.`;
  return `${ult} Nas últimas ${vezes(semanas)} em que as duas cadeias tiveram preço para todo o cabaz, o ${nomeA} ficou mais barato em ${vezes(a)} e o ${nomeB} em ${vezes(b)}${empates ? `, com ${empates} empate${empates > 1 ? "s" : ""}` : ""}. A diferença costuma ser pequena: depende da lista, mais do que da cadeia.`;
}

export default function SupermercadoMaisBarato({ semanas = [], atual = false }) {
  const canonical = `${URL_SITE}/supermercado-mais-barato`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Supermercado mais barato", path: "/supermercado-mais-barato" }];
  const r = resumoMaisBarato(semanas);
  const s = r?.ultima;
  const barata = s?.lojas[0];
  const cara = s?.lojas[s.lojas.length - 1];
  const lider = r?.vitorias[0];
  const ano = s ? s.dia.slice(0, 4) : "";
  const titulo = `Qual é o supermercado mais barato em Portugal?${ano ? ` (${ano})` : ""}`;

  const resposta = !s ? ""
    : s.empate
      ? `Esta semana não há uma cadeia claramente mais barata: no cabaz básico de ${s.artigos.length} artigos, entre o ${barata.nome} (${eur(barata.total, 2)} €) e o ${cara.nome} (${eur(cara.total, 2)} €) vão só ${eur(cara.total - barata.total, 2)} €.`
      : `Na semana de ${dataExtenso(s.dia, { ano: false })}, o mais barato foi o ${barata.nome}: o cabaz básico de ${s.artigos.length} artigos custou ${eur(barata.total, 2)} €, contra ${eur(cara.total, 2)} € no ${cara.nome}.`;
  const descricao = s
    ? `${resposta} O primeiro lugar muda de semana para semana: veja quem ganhou nas últimas ${r.semanas}.`
    : "Qual é o supermercado mais barato em Portugal, com o mesmo cabaz em cada cadeia, semana a semana, e porque é que o primeiro lugar muda.";

  const cp = frenteAFrente(semanas, "continente", "pingo-doce");
  const ca = frenteAFrente(semanas, "continente", "auchan");
  const lidl = cadeia("lidl");
  const mercadona = cadeia("mercadona");
  const faq = [
    cp && { p: "Qual é mais barato, o Continente ou o Pingo Doce?", r: respostaPar(cp) },
    ca && { p: "Qual é mais barato, o Continente ou o Auchan?", r: respostaPar(ca) },
    lidl && {
      p: "E o Lidl?",
      r: `O Lidl não tem loja online em Portugal: só publica as promoções do folheto. Por isso não tem um preço do dia para todo o cabaz e não entra nesta conta. Na app PoupeJá, os preços do Lidl entram na comparação da tua lista quando há promoção ou quando alguém lê um talão.`,
    },
    mercadona && {
      p: "E a Mercadona?",
      r: `Não entra: ${mercadona.motivo.charAt(0).toLowerCase()}${mercadona.motivo.slice(1)}. Não inventamos nem estimamos preços de cadeias que não conseguimos ver.`,
    },
    {
      p: "O supermercado mais barato online também é o mais barato na loja?",
      r: "Nem sempre. Estes são preços das lojas online, sem entrega. Na loja física podem existir promoções do folheto, descontos de cartão de cliente e talões que aqui não contam.",
    },
    {
      p: "Como descubro o supermercado mais barato para a minha lista?",
      r: `Compara a tua lista, com as quantidades certas, no mesmo dia. A app PoupeJá faz isso de graça e sem conta: soma a lista em ${N_COMPARADAS} supermercados, diz qual fica mais barato, e se compensa dividir as compras por duas lojas, já com o combustível da viagem.`,
    },
  ].filter(Boolean);

  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [{ p: titulo.replace(/ \(\d{4}\)$/, ""), r: resposta }, ...faq].filter((x) => x.r).map((x) => ({
      "@type": "Question", name: x.p, acceptedAnswer: { "@type": "Answer", text: x.r },
    })),
  };

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
        {s && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(ld) }} />}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(breadcrumbLd(URL_SITE, passos)) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>{titulo.replace(/ \(\d{4}\)$/, "")}</h1>

        {!s ? (
          <p style={estiloTexto}>
            Esta página usa o <a href="/barometro" style={estiloLink}>Barómetro PoupeJá</a>: o mesmo cabaz em cada cadeia, todas as semanas.
            A resposta aparece aqui assim que houver o cabaz desta semana.
          </p>
        ) : (
          <>
            <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>{resposta}</p>
            <p style={estiloTexto}>
              Mas não há um vencedor fixo.{" "}
              {lider
                ? <>Nas últimas {vezes(r.semanas)}, o <strong style={forte}>{lider.nome}</strong> ficou em primeiro {lider.n === 1 ? "uma vez" : `${lider.n} vezes`}
                  {r.vitorias.length > 1 ? <>, {r.vitorias.slice(1).map((v) => `o ${v.nome} ${v.n === 1 ? "uma vez" : `${v.n} vezes`}`).join(", ")}</> : null}
                  {r.empates ? <>, e em {vezes(r.empates)} não houve uma cadeia claramente mais barata</> : null}.</>
                : <>Nas últimas {vezes(r.semanas)} as diferenças foram tão pequenas que não houve uma cadeia claramente mais barata.</>}
              {" "}Entre a mais barata e a mais cara, a distância foi de {eur(r.distancia.min, 2)} € a {eur(r.distancia.max, 2)} €.
            </p>

            <h2 className="font-display" style={estiloH2}>O cabaz desta semana, por cadeia</h2>
            <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
              {s.lojas.map((l, i) => (
                <div key={l.loja} className="flex items-center justify-between px-4 py-3" style={{ gap: 10, ...linha(i) }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)" }}>
                    {i + 1}. {l.nome}
                    {i > 0 && <span className="pj-num" style={{ fontSize: 12, fontWeight: 500, color: "var(--pj-text-faint)" }}> +{eur(l.total - barata.total, 2)} €</span>}
                  </span>
                  <Preco valor={l.total} tamanho={19} />
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
              Preços online a {dataExtenso(s.dia)}: {s.artigos.join(", ")}. O produto mais barato de cada cadeia, na mesma quantidade.
            </p>

            {r.semanas > 1 && (
              <>
                <h2 className="font-display" style={estiloH2}>Quem foi o mais barato, semana a semana</h2>
                <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
                  {[...semanas].reverse().slice(0, r.semanas).filter((x) => x.lojas?.length >= 2).map((x, i) => (
                    <div key={x.semana} className="flex items-center justify-between px-4 py-3" style={{ gap: 10, ...linha(i) }}>
                      <span style={{ fontSize: 14, color: "var(--pj-text)" }}>Semana de {dataExtenso(x.semana, { ano: false })}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: x.empate ? "var(--pj-text-muted)" : "var(--pj-brand-ink)", textAlign: "right" }}>
                        {x.empate ? "empate" : x.lojas[0].nome}
                        <span className="pj-num" style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "var(--pj-text-faint)" }}>
                          {eur(x.lojas[x.lojas.length - 1].total - x.lojas[0].total, 2)} € até à mais cara
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <h2 className="font-display" style={estiloH2}>Porque é que o primeiro lugar muda?</h2>
            <p style={{ ...estiloTexto, marginTop: 0 }}>
              <strong style={forte}>Porque um total responde a uma lista, num dia.</strong> Basta um artigo entrar em promoção numa cadeia para ela passar para a frente nessa semana.
              Com cabazes pequenos, como este, a diferença entre o primeiro e o segundo lugar é muitas vezes de cêntimos.
            </p>
            <p style={estiloTexto}>
              <strong style={forte}>Porque se paga a embalagem.</strong> Se uma cadeia vende o arroz em pacotes de 1 kg e outra em 500 g, a mesma lista sai diferente,
              mesmo com o preço ao quilo igual.
            </p>
            <p style={estiloTexto}>
              <strong style={forte}>Porque a tua lista não é este cabaz.</strong> O mais barato para os básicos pode não ser o mais barato para o que tu compras.
              A única conta que te serve é a da tua lista.
            </p>

            <h2 className="font-display" style={estiloH2}>Como encontrar o mais barato para a tua lista</h2>
            <ol style={{ ...estiloTexto, marginTop: 0, paddingLeft: 20 }}>
              <li>Fecha a lista antes de comparar, com as quantidades.</li>
              <li>Tira o que já tens em casa: o que não compras não custa nada em lado nenhum.</li>
              <li>Compara o total no mesmo dia, só nas cadeias a que consegues mesmo ir.</li>
              <li>Soma a viagem: uma segunda paragem pode comer a diferença.</li>
            </ol>
            <p style={estiloTexto}>
              A app PoupeJá faz estes quatro passos por ti, grátis e sem conta: compara a lista em {N_COMPARADAS} supermercados, diz se compensa dividir as compras e
              conta o combustível. Vê também os <a href="/folhetos" style={estiloLink}>folhetos desta semana</a>.
            </p>

            <h2 className="font-display" style={estiloH2}>Perguntas frequentes</h2>
            {faq.map((x) => (
              <div key={x.p} style={{ marginTop: 16 }}>
                <h3 style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>{x.p}</h3>
                <p style={{ ...estiloTexto, marginTop: 6 }}>{x.r}</p>
              </div>
            ))}

            <h2 className="font-display" style={estiloH2}>Como fazemos as contas</h2>
            <p style={{ ...estiloTexto, marginTop: 0 }}>
              Os números são do <a href="/barometro" style={estiloLink}>Barómetro PoupeJá</a>: todos os dias pesquisamos os mesmos artigos nas lojas online de cada cadeia
              e ficamos com o mais barato de cada uma, na mesma quantidade. Só se somam os artigos que todas as cadeias têm nesse dia. Uma semana conta como empate quando
              a diferença é pequena ou depende de um só artigo. São preços online, sem entrega, cartões nem cupões, e o cabaz é pequeno: mostra a tendência, não a conta
              de uma família.
            </p>
          </>
        )}

        <CtaApp texto="Descobre o mais barato para a tua lista, grátis e sem conta" href="/?atalho=lista" />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  const props = await lerBarometro();
  const atual = !!props && barometroServe(props);
  // Basta o último trimestre; a página só lê uma linha.
  return { props: { semanas: props ? props.semanas.slice(-12) : [], atual }, revalidate: atual ? 12 * 3600 : 3600 };
}
