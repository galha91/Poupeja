import Head from "next/head";
import LayoutPublico, { CtaApp } from "../LayoutPublico";
import dadosFolhetos from "../public/folhetos.json";

const SITE_URL = "https://xn--poupej-uta.com";

const LOGO = {
  "Continente": "continente", "Pingo Doce": "pingodoce", "Lidl": "lidl",
  "Aldi": "aldi", "Auchan": "auchan", "Intermarché": "intermarche",
  "Froiz": "froiz", "E.Leclerc": "eleclerc", "El Corte Inglés": "elcorteingles",
};

/*
 * Página pública SEO — folhetos dos supermercados desta semana.
 * Estática (revalida de hora a hora); alvo: "folheto continente",
 * "folheto lidl esta semana", etc.
 */
export default function Folhetos({ folhetos, atualizadoEm }) {
  const lojas = folhetos.map(f => f.loja).join(", ");
  return (
    <LayoutPublico>
      <Head>
        <title>Folhetos dos Supermercados desta Semana — {folhetos.slice(0, 4).map(f => f.loja).join(", ")} e mais | PoupeJá</title>
        <meta name="description" content={`Todos os folhetos e promoções da semana num só sítio: ${lojas}. Links diretos e grátis, com aviso semanal na app PoupeJá.`} />
        <link rel="canonical" href={`${SITE_URL}/folhetos`} />
        <meta property="og:title" content="Folhetos dos supermercados desta semana" />
        <meta property="og:description" content={`${lojas} — links diretos para os folhetos oficiais.`} />
        <meta property="og:url" content={`${SITE_URL}/folhetos`} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <p style={{ fontSize: 11, color: "#8a978e", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          Atualizado a {new Date(atualizadoEm).toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}
        </p>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 10 }}>
          Folhetos dos supermercados desta semana
        </h1>
        <p style={{ fontSize: 14.5, color: "#5c6b62", lineHeight: 1.6, marginTop: 12 }}>
          Links diretos para os folhetos oficiais de {folhetos.length} supermercados em Portugal.
          Na app PoupeJá recebes um <strong style={{ color: "#14231c" }}>aviso todas as semanas</strong> quando
          saem folhetos novos.
        </p>

        <div className="mt-8 rounded-2xl overflow-hidden" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
          {folhetos.map((f, i) => (
            <a
              key={f.id}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3.5 px-4 py-3.5 no-underline"
              style={i > 0 ? { borderTop: "1px solid #eeece4" } : {}}
            >
              <span className="flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, borderRadius: 12, background: "#eeece4" }}>
                {LOGO[f.loja]
                  ? <img src={`/logos/${LOGO[f.loja]}.svg`} alt={f.loja} width={26} height={26} style={{ objectFit: "contain" }} />
                  : <span style={{ fontSize: 15, fontWeight: 700, color: "#2c3b33" }}>{f.loja[0]}</span>}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "#14231c" }}>Folheto {f.loja}</span>
                <span style={{ display: "block", fontSize: 12.5, color: "#5c6b62", marginTop: 1 }}>{f.titulo}{f.validade ? ` · ${f.validade}` : ""}</span>
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0b6b4f", flexShrink: 0 }}>Ver →</span>
            </a>
          ))}
        </div>

        <CtaApp texto="Recebe os folhetos novos toda a semana — grátis" />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  return {
    props: {
      folhetos: dadosFolhetos.folhetos || [],
      atualizadoEm: dadosFolhetos.atualizadoEm || null,
    },
    revalidate: 3600,
  };
}
