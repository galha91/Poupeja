import Head from "next/head";
import { ExternalLink } from "lucide-react";
import LayoutPublico from "../LayoutPublico";
import { FONTES, dominioDe } from "../lib/fontes";

const SITE_URL = "https://xn--poupej-uta.com";

/*
 * De onde vem cada número do Estado que a app mostra. Uma página pública,
 * sem login, com o link para o original de cada fonte — é também para onde
 * a ficha da Google Play aponta.
 */
const GRUPOS = [
  {
    titulo: "Combustíveis",
    texto: "Preços de gasóleo, gasolina e GPL por posto, marca e concelho. São os preços que os próprios postos comunicam à DGEG; o PoupeJá mostra-os e ordena-os, sem alterar valores.",
    fontes: ["dgeg"],
  },
  {
    titulo: "Simulador de IRS",
    texto: "Escalões e taxas do IRS, dedução específica (calculada a partir do IAS), limites de deduções e regras de cálculo. É uma estimativa: o valor final é sempre o da Autoridade Tributária.",
    fontes: ["irs68", "cirs", "ias"],
  },
  {
    titulo: "Casa: crédito e renda",
    texto: "Euribor a 3, 6 e 12 meses, usada para estimar a prestação do crédito à habitação, e coeficiente anual de atualização das rendas, fixado pelo INE.",
    fontes: ["euribor", "rendas", "ine"],
  },
  {
    titulo: "Apoios do Estado",
    texto: "Cada apoio tem, no próprio cartão, o link direto para o serviço oficial que o concede e onde se pede. As entidades por trás deles:",
    fontes: ["gov", "segsocial", "erse", "habitacao", "financas", "iefp", "dges"],
  },
];

export default function Fontes() {
  return (
    <LayoutPublico>
      <Head>
        <title>Fontes oficiais | PoupeJá</title>
        <meta name="description" content="De onde vem a informação do Estado que o PoupeJá mostra: DGEG, Portal das Finanças, Banco de Portugal, Segurança Social e outras fontes oficiais, com link para cada uma." />
        <link rel="canonical" href={`${SITE_URL}/fontes`} />
        <meta property="og:title" content="Fontes oficiais | PoupeJá" key="og:title" />
        <meta property="og:url" content={`${SITE_URL}/fontes`} key="og:url" />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          Transparência
        </p>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 10 }}>
          Fontes oficiais
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 12 }}>
          O PoupeJá é uma aplicação independente. <strong style={{ color: "var(--pj-text)" }}>Não é um serviço do Estado</strong> nem
          está associada a nenhuma entidade pública. Sempre que mostra informação oficial, indica a fonte no
          próprio ecrã e leva-te ao original. Para decisões que contam, confirma sempre no site da entidade.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {GRUPOS.map((g) => (
            <section key={g.titulo} className="rounded-2xl p-5" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
              <h2 className="font-display" style={{ fontSize: 18, fontWeight: 600 }}>{g.titulo}</h2>
              <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 8 }}>{g.texto}</p>
              <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0 }} className="flex flex-col">
                {g.fontes.map((k) => {
                  const f = FONTES[k];
                  return (
                    <li key={k} style={{ padding: "10px 0", borderTop: "1px solid var(--pj-subtle)" }}>
                      <a href={f.href} target="_blank" rel="noopener noreferrer" className="no-underline" style={{ display: "block" }}>
                        <span className="inline-flex items-center gap-1.5" style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
                          {f.nome} <ExternalLink size={12} aria-hidden="true" />
                        </span>
                        <span style={{ display: "block", fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 2 }}>{f.detalhe}</span>
                        <span style={{ display: "block", fontSize: 11.5, color: "var(--pj-text-faint)", marginTop: 1 }}>{dominioDe(f.href)}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", lineHeight: 1.6, marginTop: 20 }}>
          Encontraste um valor desatualizado ou errado? Diz-nos em poupeja.portugal@gmail.com e corrigimos.
        </p>
      </div>
    </LayoutPublico>
  );
}
