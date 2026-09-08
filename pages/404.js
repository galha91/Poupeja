import Head from "next/head";
import { ArrowRight } from "lucide-react";
import LayoutPublico from "../LayoutPublico";

/*
 * 404 próprio. O do Next é uma linha em inglês num ecrã branco — e o site
 * tem endereços que as pessoas adivinham à mão (/lista, /folhetos/lidl),
 * por isso vale mais apanhá-las com os destinos reais à frente.
 */
const DESTINOS = [
  { href: "/folhetos",     titulo: "Folhetos da semana",    desc: "Os folhetos dos supermercados, todos num sítio" },
  { href: "/combustiveis", titulo: "Preços dos combustíveis", desc: "Gasóleo e gasolina mais baratos, por concelho" },
  { href: "/receitas",     titulo: "Receitas baratas",      desc: "Refeições económicas para 4 pessoas" },
  { href: "/apoios",       titulo: "Apoios do Estado",      desc: "Benefícios a que podes ter direito" },
  { href: "/lista",        titulo: "Lista de compras",      desc: "Partilhada com quem vai contigo" },
];

export default function NaoEncontrado() {
  return (
    <LayoutPublico>
      <Head>
        <title>Página não encontrada | PoupeJá</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div style={{ paddingTop: 40 }}>
        <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          Erro 404
        </p>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 10 }}>
          Esta página não existe
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 12 }}>
          O endereço pode ter mudado ou ter sido escrito com um erro. Segue por aqui:
        </p>

        <div className="mt-8 rounded-2xl overflow-hidden" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
          {DESTINOS.map((d, i) => (
            <a
              key={d.href}
              href={d.href}
              className="flex items-center gap-3 px-4 py-3.5 no-underline"
              style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}
            >
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)" }}>{d.titulo}</span>
                <span style={{ display: "block", fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 1 }}>{d.desc}</span>
              </span>
              <ArrowRight size={16} style={{ color: "var(--pj-brand-ink)", flexShrink: 0 }} />
            </a>
          ))}
        </div>
      </div>
    </LayoutPublico>
  );
}
