import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import CalculadoraConsumo from "../CalculadoraConsumo";
import { BotaoAbrirPoupeja, Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import {
  APARELHOS, PRECO_KWH, TARIFA_REGULADA, IVA, PERGUNTAS_CONSUMO, FONTE_ERSE, VERIFICADO_CONSUMO,
  custoAparelho, poupancaVazio, perguntasConsumoLd, aparelhoPorId,
} from "../lib/consumoEletrico";
import { breadcrumbLd } from "../lib/seoPrecos";
import { euros } from "../lib/seoFormato";
import { dataExtenso } from "../lib/datas";
import { URL_SITE } from "../lib/site";

/*
 * Página pública SEO — quanto gasta cada eletrodoméstico, com calculadora.
 * Alvo: "quanto gasta um desumidificador", "consumo aquecedor a óleo",
 * "calcular consumo eletrodomésticos". Valores em lib/consumoEletrico.
 */
const kwh = (v) => v.toLocaleString("pt-PT", { maximumFractionDigits: 1 });
// O preço do kWh lê-se com 4 casas, como na fatura.
const precoKwh = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const TITULO = "Quanto gasta um eletrodoméstico? Calculadora | PoupeJá";
const DESCRICAO = `Calcula quanto custa por mês o desumidificador, o aquecedor ou a máquina de secar. Com o kWh a ${precoKwh(PRECO_KWH)} € (tarifa regulada, com IVA) ou o preço da tua fatura.`;

const Fonte = ({ f }) => <a href={f.href} target="_blank" rel="noopener noreferrer" style={estiloLink}>{f.texto}</a>;

export default function ConsumoEletrodomesticos() {
  const canonical = `${URL_SITE}/consumo-eletrodomesticos`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Consumo de eletrodomésticos", path: "/consumo-eletrodomesticos" }];
  const tabela = APARELHOS.map((a) => ({ ...a, c: custoAparelho(a) })).sort((x, y) => y.c.mes - x.c.mes);
  const roupa = poupancaVazio(aparelhoPorId("maquina-roupa"));
  const cilindro = poupancaVazio(aparelhoPorId("termoacumulador"));
  return (
    <LayoutPublico>
      <Head>
        <title>{TITULO}</title>
        <meta name="description" content={DESCRICAO} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Quanto gasta um eletrodoméstico?" key="og:title" />
        <meta property="og:description" content={DESCRICAO} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(perguntasConsumoLd()) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Quanto gasta um eletrodoméstico?</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
          Escolhe o aparelho, ajusta a potência e as horas de uso, e vê quanto custa por mês e por ano. O preço do kWh vem
          preenchido com a tarifa regulada ({precoKwh(PRECO_KWH)} € com IVA); troca pelo da tua fatura se for diferente.
        </p>

        <CalculadoraConsumo />

        <h2 className="font-display" style={estiloH2}>Quanto custa cada um por mês</h2>
        <p style={{ ...estiloTexto, marginTop: 0, marginBottom: 12 }}>Com uso típico e o kWh a {precoKwh(PRECO_KWH)} €. Do que gasta mais para o que gasta menos:</p>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          {tabela.map((a, i) => (
            <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3" style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{a.nome}</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--pj-text-faint)", marginTop: 1 }}>
                  {a.watts} W · {kwh(a.horasDia)} h por dia · {a.diasMes} dias · {kwh(a.c.kwhMes)} kWh
                </span>
              </span>
              <span className="pj-num font-display flex-shrink-0" style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-brand-ink)", whiteSpace: "nowrap" }}>{euros(a.c.mes)} €</span>
            </div>
          ))}
        </div>

        <h2 className="font-display" style={estiloH2}>Mudar de hora também poupa</h2>
        <p style={estiloTexto}>
          Na tarifa bi-horária regulada, o kWh custa {precoKwh(TARIFA_REGULADA.foraVazio * (1 + IVA))} € fora de vazio
          e {precoKwh(TARIFA_REGULADA.vazio * (1 + IVA))} € nas horas de vazio, com IVA. Pôr a máquina de lavar roupa a trabalhar
          em vazio poupa cerca de {euros(roupa.ano)} € por ano; o termoacumulador, cerca de {euros(cilindro.ano)} €.
          A bi-horária só compensa se conseguires passar uma boa parte do consumo para essas horas.
        </p>

        <h2 className="font-display" style={estiloH2}>Para gastar menos</h2>
        <ul style={{ ...estiloTexto, paddingLeft: 20, listStyle: "disc" }}>
          <li style={{ marginTop: 4 }}>Aquecer gasta muito mais do que tudo o resto: fecha portas, usa o termóstato e aquece só a divisão onde estás.</li>
          <li style={{ marginTop: 4 }}>Na roupa, lava a 30 ou 40 °C e seca ao ar quando der. A máquina de secar é das que mais pesam.</li>
          <li style={{ marginTop: 4 }}>Frigorífico e arca longe do forno e do sol, com as borrachas a vedar bem.</li>
          <li style={{ marginTop: 4 }}>Antes de comprar, vê a etiqueta energética: o consumo por ano diz mais do que a classe.</li>
        </ul>

        <BotaoAbrirPoupeja href="/?atalho=contas" tipo="consumo" texto="Junta a luz às contas da casa e vê quanto pagas por ano" />

        <h2 className="font-display" style={estiloH2}>Perguntas frequentes</h2>
        {PERGUNTAS_CONSUMO.map((x) => (
          <div key={x.p} style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>{x.p}</h3>
            <p style={{ ...estiloTexto, marginTop: 6 }}>{x.r}</p>
          </div>
        ))}

        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 28, lineHeight: 1.6 }}>
          Preço do kWh: <Fonte f={FONTE_ERSE} />, tarifa regulada em Baixa Tensão Normal a partir de 1 de outubro de 2026, com IVA a 23%,
          confirmado a {dataExtenso(VERIFICADO_CONSUMO)}. Se gastas pouco, parte da eletricidade pode pagar IVA reduzido e o custo
          real fica um pouco abaixo. As potências e os usos são valores típicos: vê a etiqueta do teu aparelho.
        </p>

        <h2 className="font-display" style={estiloH2}>Ver também</h2>
        <Pilulas itens={[
          { href: "/tarifa-social", texto: "Tarifa social da energia" },
          { href: "/garantias", texto: "Garantia de 3 anos" },
          { href: "/precos", texto: "Preços de supermercado", fraco: true },
        ]} />
      </div>
    </LayoutPublico>
  );
}
