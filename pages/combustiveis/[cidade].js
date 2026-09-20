import Head from "next/head";
import { eur } from "../../lib/formato";
import { descreverFrescura } from "../../lib/frescura";
import { Preco, LinhaPreco } from "../../Preco";
import LayoutPublico, { CtaApp } from "../../LayoutPublico";
import { dadosMunicipio } from "../../lib/municipios";
import { URL_SITE } from "../../lib/site";

/*
 * Página pública SEO — combustíveis mais baratos num concelho.
 *
 * O concelho e as suas coordenadas vêm dos próprios dados da DGEG (ver
 * lib/municipios.js), não de uma lista à mão. Alvo: "gasóleo mais barato
 * em X", "gasolina barata X", que é procura local e recorrente.
 *
 * Cada página tem de dizer algo que só ela pode dizer — nº de postos,
 * amplitude de preços no concelho, diferença para a média do país, os
 * postos concretos — senão são centenas de páginas iguais e o Google
 * trata-as como tal.
 */
export default function CombustiveisConcelho({ dados }) {
  const { municipio, destaques, amplitude, noConcelho, proximos, vizinhos, frescura } = dados;
  const idade = descreverFrescura(frescura);

  /*
   * A lista vinha com gasóleo e gasolina MISTURADOS e ordenada por preço,
   * o que punha €1,494 de gasóleo por cima de €1,679 de gasolina como se
   * fossem comparáveis. Não são: são dois produtos diferentes. Agrupados
   * por combustível, a ordenação passa a querer dizer alguma coisa — e a
   * amplitude de cada lista também.
   */
  const porCombustivel = [];
  for (const p of noConcelho) {
    let grupo = porCombustivel.find(g => g.tipo === p.tipoLabel);
    if (!grupo) { grupo = { tipo: p.tipoLabel, postos: [] }; porCombustivel.push(grupo); }
    grupo.postos.push(p);
  }
  for (const g of porCombustivel) {
    const precos = g.postos.map(p => p.preco);
    g.min = Math.min(...precos);
    g.max = Math.max(...precos);
  }

  const precosProximos = proximos.map(p => p.preco);
  const minProximos = precosProximos.length ? Math.min(...precosProximos) : null;
  const maxProximos = precosProximos.length ? Math.max(...precosProximos) : null;

  const gasoleo  = destaques.find(d => d.tipoLabel === "Gasóleo");
  const gasolina = destaques.find(d => d.tipoLabel === "Gasolina 95");
  const descricao =
    `Preços de hoje no concelho de ${municipio.nome} (dados oficiais DGEG)` +
    `${gasoleo ? `: gasóleo desde €${eur(gasoleo.preco, 3)}` : ""}` +
    `${gasolina ? `${gasoleo ? "," : ":"} gasolina 95 desde €${eur(gasolina.preco, 3)}` : ""}` +
    `. ${municipio.nPostos} postos comparados, grátis.`;

  const titulo = `Preço dos Combustíveis em ${municipio.nome} Hoje — gasóleo e gasolina mais baratos | PoupeJá`;
  const canonical = `${URL_SITE}/combustiveis/${municipio.slug}`;

  return (
    <LayoutPublico>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`Preço dos combustíveis em ${municipio.nome} hoje`} key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          Dados oficiais DGEG · {idade.rotulo}
        </p>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 10 }}>
          Preço dos combustíveis em {municipio.nome}{idade.deHoje ? " hoje" : ""}
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 12 }}>
          <strong style={{ color: "var(--pj-text)" }}>{municipio.nPostos} postos</strong> no concelho
          de {municipio.nome}{municipio.distrito ? `, distrito de ${municipio.distrito}` : ""}, com os preços
          comunicados à Direção-Geral de Energia e Geologia. Na app PoupeJá vês os postos{" "}
          <strong style={{ color: "var(--pj-text)" }}>à tua volta</strong> e crias avisos de preço.
        </p>

        {idade.aviso && (
          <div className="rounded-2xl p-4 mt-6" style={{ background: "var(--pj-warn-wash)", border: "1px solid var(--pj-warn-border)" }}>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--pj-warn)", fontWeight: 600 }}>
              {idade.aviso}
            </p>
          </div>
        )}

        {/* Mais barato por tipo, com a diferença para o país */}
        <div className="grid gap-3 mt-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {destaques.map(d => (
            <div key={d.tipoLabel} className="rounded-2xl p-4" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
              <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
                {d.tipoLabel} mais barato
              </p>
              <p style={{ marginTop: 8 }}>
                <Preco valor={d.preco} casas={3} tamanho={30} />
              </p>
              <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 2 }}>{d.nome}</p>
              {d.mediaConcelho != null && (
                <p style={{ fontSize: 12, marginTop: 6, color: "var(--pj-text-faint)" }}>
                  Média no concelho €{eur(d.mediaConcelho, 3)}
                  {d.vsPais != null && d.vsPais !== 0 && (
                    <span style={{ fontWeight: 600, color: d.vsPais < 0 ? "var(--pj-brand-ink)" : "var(--pj-text-muted)" }}>
                      {` · ${Math.abs(d.vsPais)} cênt. ${d.vsPais < 0 ? "abaixo" : "acima"} do país`}
                    </span>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* O número que interessa: quanto custa escolher mal */}
        {amplitude && (
          <div className="rounded-2xl p-5 mt-4" style={{ background: "var(--pj-brand-wash)", border: "1px solid var(--pj-border)" }}>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--pj-text)" }}>
              Em {municipio.nome} o gasóleo vai de{" "}
              <strong>€{eur(amplitude.min, 3)}</strong> a <strong>€{eur(amplitude.max, 3)}</strong> por litro.
              Num depósito de 50 litros, isso é{" "}
              <strong style={{ color: "var(--pj-brand-ink)" }}>€{eur(amplitude.porDeposito, 2)} de diferença</strong>{" "}
              entre atestar no posto mais barato e no mais caro do concelho.
            </p>
          </div>
        )}

        {/* Postos do concelho — uma lista por combustível */}
        {porCombustivel.map(grupo => (
          <section key={grupo.tipo}>
            <div className="flex items-baseline justify-between" style={{ marginTop: 36, marginBottom: 12 }}>
              <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600 }}>
                {grupo.tipo} em {municipio.nome}
              </h2>
              <span className="pj-num" style={{ fontSize: 12.5, color: "var(--pj-text-faint)" }}>
                {grupo.postos.length} posto{grupo.postos.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
              {grupo.postos.map((e, i) => (
                <LinhaPreco
                  key={`${e.id}-${e.tipoLabel}`}
                  nome={e.nome || e.marca}
                  contexto={e.marca && !(e.nome || "").toLowerCase().includes(e.marca.toLowerCase()) ? e.marca : null}
                  valor={e.preco}
                  min={grupo.min}
                  max={grupo.max}
                  destaque={i === 0}
                  primeira={i === 0}
                />
              ))}
            </div>
          </section>
        ))}
        <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 10 }}>
          Fonte: DGEG — preços comunicados pelos próprios postos. {idade.rotulo}.
          O preço no posto pode variar.
        </p>

        {/* Vale a pena sair do concelho? */}
        {proximos.length > 0 && (
          <>
            <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36, marginBottom: 6 }}>
              Gasóleo mais barato perto de {municipio.nome}
            </h2>
            <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginBottom: 14 }}>
              Postos fora do concelho, a menos de 20 km. Compensa se a diferença por litro pagar o desvio.
            </p>
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
              {proximos.map((e, i) => (
                <LinhaPreco
                  key={`${e.id}-prox`}
                  nome={e.nome || e.marca}
                  contexto={`${e.municipio} · a ${e.distancia} km`}
                  valor={e.preco}
                  min={minProximos}
                  max={maxProximos}
                  destaque={i === 0}
                  primeira={i === 0}
                />
              ))}
            </div>
          </>
        )}

        {/* Concelhos vizinhos — com o preço, para o link valer alguma coisa */}
        {vizinhos.length > 0 && (
          <>
            <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36, marginBottom: 14 }}>
              Preços nos concelhos vizinhos
            </h2>
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
              {vizinhos.map((v, i) => (
                <a
                  key={v.slug}
                  href={`/combustiveis/${v.slug}`}
                  className="flex items-center justify-between px-4 py-3 no-underline"
                  style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}
                >
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{v.nome}</p>
                    <p style={{ fontSize: 12, color: "var(--pj-text-faint)" }}>a {v.dist} km</p>
                  </div>
                  {v.gasoleo != null && (
                    <span className="flex-shrink-0"><Preco valor={v.gasoleo} casas={3} tamanho={16} /></span>
                  )}
                </a>
              ))}
            </div>
            <a href="/combustiveis" className="inline-block no-underline mt-4" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
              Ver todos os concelhos →
            </a>
          </>
        )}

        <CtaApp texto="Vê os postos mais baratos perto de ti — grátis" />
      </div>
    </LayoutPublico>
  );
}

export async function getServerSideProps({ res, params }) {
  const dados = await dadosMunicipio(params.cidade);
  // Concelho sem dados suficientes na DGEG não ganha página — melhor um 404
  // do que uma página vazia a dizer que não há preços.
  if (!dados) return { notFound: true };

  /*
   * Sem stale-while-revalidate, de propósito.
   *
   * A data impressa é agora a dos dados, por isso uma página em cache não
   * mente sobre a idade dos preços. O que fica preso no HTML é o JUÍZO
   * "isto é de hoje" — o rótulo e o H1 são decididos no servidor, no
   * momento em que a página é gerada. Com SWR a CDN pode servir a mesma
   * página até 90 minutos depois; se esse intervalo atravessar a
   * meia-noite, a página continua a dizer "hoje" sobre preços de ontem.
   * Com 30 minutos secos, o erro possível é de 30 minutos.
   */
  res.setHeader("Cache-Control", "public, s-maxage=1800");
  return { props: { dados } };
}
