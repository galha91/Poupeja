import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import EscalaoIRS from "../EscalaoIRS";
import { BotaoAbrirPoupeja, Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import { ESCALOES_IRS, DEDUCAO_ESPECIFICA, ANO_IRS, VERIFICADO_IRS, FONTE_IRS, coletaDe, taxaMediaNoLimite } from "../lib/irs";
import { breadcrumbLd } from "../lib/seoPrecos";
import { dataExtenso } from "../lib/datas";
import { URL_SITE } from "../lib/site";

/*
 * Página pública SEO — escalões de IRS do ano, com "em que escalão fico?".
 * Alvo: "escalões irs 2026", "tabela irs 2026", "simulador irs". O valor
 * a pagar ou a receber fica de propósito para o simulador da app
 * (/?atalho=irs): a página dá a tabela e o escalão, a app dá a conta.
 */
const MINIMO_EXISTENCIA = 12880; // Despacho n.º 233-A/2026
const FONTE_MINIMO = "https://diariodarepublica.pt/dr/detalhe/despacho/233-a-2026-998488151";

const eur = (v) => v.toLocaleString("pt-PT", { maximumFractionDigits: 0 });
const pct = (t, casas = 1) => `${(t * 100).toLocaleString("pt-PT", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;

/* Exemplos fixos, calculados com a mesma tabela (solteiro, sem deduções à coleta). */
const EXEMPLOS = [15000, 21000, 30000, 45000].map((bruto) => {
  const coletavel = Math.max(0, bruto - DEDUCAO_ESPECIFICA);
  const coleta = coletaDe(coletavel);
  return { bruto, coletavel, coleta, media: coleta / bruto };
});

export default function Irs() {
  const titulo = `Escalões de IRS ${ANO_IRS}: tabela e em qual ficas | PoupeJá`;
  const descricao = `Tabela dos escalões de IRS ${ANO_IRS} (taxas de 12,5% a 48%), como funcionam e em que escalão ficas. Vê quanto vais pagar ou receber no simulador grátis.`;
  const canonical = `${URL_SITE}/irs`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: `Escalões de IRS ${ANO_IRS}`, path: "/irs" }];
  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Simulador de IRS PoupeJá",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web, Android, iOS",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    url: `${URL_SITE}/?atalho=irs`,
  };
  const forte = { color: "var(--pj-text)" };
  return (
    <LayoutPublico>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`Escalões de IRS ${ANO_IRS}: tabela e em qual ficas`} key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Escalões de IRS {ANO_IRS}</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
          São 9 escalões, de 12,5% a 48%, para os rendimentos de {ANO_IRS} (declarados em {ANO_IRS + 1}). Escreve o teu
          salário e vê em qual ficas.
        </p>

        <EscalaoIRS />

        <h2 className="font-display" style={estiloH2}>Tabela dos escalões de IRS {ANO_IRS}</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ color: "var(--pj-text-faint)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <th scope="col" style={{ textAlign: "left", padding: "10px 12px" }}>Escalão</th>
                <th scope="col" style={{ textAlign: "left", padding: "10px 6px" }}>Rendimento coletável</th>
                <th scope="col" style={{ textAlign: "right", padding: "10px 6px" }}>Taxa</th>
                <th scope="col" style={{ textAlign: "right", padding: "10px 12px" }}>Média</th>
              </tr>
            </thead>
            <tbody>
              {ESCALOES_IRS.map((e, i) => {
                const media = taxaMediaNoLimite(e);
                return (
                  <tr key={i} style={{ borderTop: "1px solid var(--pj-subtle)", color: "var(--pj-text)" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{i + 1}.º</td>
                    <td className="pj-num" style={{ padding: "10px 6px" }}>
                      {i === 0 ? `até ${eur(e.ate)} €` : Number.isFinite(e.ate) ? `${eur(e.de)} € a ${eur(e.ate)} €` : `mais de ${eur(e.de)} €`}
                    </td>
                    <td className="pj-num" style={{ padding: "10px 6px", textAlign: "right", fontWeight: 600, color: "var(--pj-brand-ink)" }}>{pct(e.taxa)}</td>
                    <td className="pj-num" style={{ padding: "10px 12px", textAlign: "right", color: "var(--pj-text-muted)" }}>{media == null ? "—" : pct(media, 3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
          Continente. Taxa média no limite de cada escalão. Art. 68.º do Código do IRS na redação da Lei n.º 73-A/2025 (Orçamento do Estado para {ANO_IRS}).
        </p>

        <h2 className="font-display" style={estiloH2}>Como funcionam os escalões</h2>
        <p style={{ ...estiloTexto, marginTop: 0 }}>
          A taxa do teu escalão <strong style={forte}>não se aplica a todo o rendimento</strong>, só à parte que cai nesse escalão.
          Os primeiros {eur(ESCALOES_IRS[0].ate)} € pagam sempre 12,5%, os seguintes 15,7%, e assim por diante. Por isso, passar para o
          escalão seguinte nunca faz ganhar menos: só a parte de cima paga a taxa mais alta.
        </p>
        <p style={estiloTexto}>
          O escalão vê-se pelo <strong style={forte}>rendimento coletável</strong>, não pelo bruto. Nos salários, é o bruto anual menos a
          dedução específica de {eur(DEDUCAO_ESPECIFICA)} € (ou as contribuições para a Segurança Social, se forem maiores).
          Depois, ao imposto calculado tiram-se as deduções: dependentes, despesas gerais, saúde, educação, casa e lares.
        </p>
        <p style={estiloTexto}>
          Quem ganha pouco está protegido pelo <strong style={forte}>mínimo de existência</strong>: em {ANO_IRS}, os rendimentos de trabalho
          até {eur(MINIMO_EXISTENCIA)} € por ano ficam, em regra, livres de IRS (<a href={FONTE_MINIMO} target="_blank" rel="noopener noreferrer" style={estiloLink}>Despacho n.º 233-A/2026</a>).
        </p>

        <h2 className="font-display" style={estiloH2}>Exemplos: quanto pesa o IRS</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          {EXEMPLOS.map((x, i) => (
            <div key={x.bruto} className="flex justify-between px-4 py-3" style={{ gap: 10, ...(i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}) }}>
              <span style={{ fontSize: 14, color: "var(--pj-text)" }}>{eur(x.bruto)} € brutos por ano</span>
              <span className="pj-num" style={{ fontSize: 14, color: "var(--pj-text-muted)", textAlign: "right" }}>
                coleta de {eur(x.coleta)} € · <strong style={forte}>{pct(x.media)}</strong> do bruto
              </span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
          Solteiro, só trabalho por conta de outrem, antes das deduções à coleta e sem contar com o mínimo de existência. Com
          dependentes e despesas o imposto final desce: faz a tua conta no simulador.
        </p>

        <BotaoAbrirPoupeja href="/?atalho=irs" tipo="irs" texto="Simular o meu IRS: vou pagar ou receber?" />

        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 28, lineHeight: 1.6 }}>
          Fonte: <a href={FONTE_IRS} target="_blank" rel="noopener noreferrer" style={estiloLink}>Portal das Finanças, art. 68.º do CIRS</a>,
          confirmado a {dataExtenso(VERIFICADO_IRS)}. Valores para o Continente; nos Açores e na Madeira as taxas são mais baixas.
          Os escalões de {ANO_IRS + 1} dependem do próximo Orçamento do Estado.
        </p>

        <h2 className="font-display" style={estiloH2}>Ver também</h2>
        <Pilulas itens={[
          { href: "/prazos/entrega-irs", texto: `Prazo de entrega do IRS` },
          { href: "/apoios/irs-jovem", texto: "IRS Jovem" },
          { href: "/credito-habitacao", texto: "Simulador de crédito habitação" },
          { href: "/apoios", texto: "Apoios do Estado", fraco: true },
        ]} />
      </div>
    </LayoutPublico>
  );
}
