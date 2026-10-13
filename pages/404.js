import Head from "next/head";
import LayoutPublico from "../LayoutPublico";

/*
 * Página não encontrada — em português e com saída.
 *
 * A do Next dizia "404: This page could not be found", em inglês e sem
 * links: quem chegava por um link antigo (um concelho que saiu, uma
 * receita renomeada) ficava num beco. Aqui aponta para as três páginas
 * que mais trazem gente.
 */
const SAIDAS = [
  { href: "/combustiveis", titulo: "Combustíveis", desc: "Gasóleo e gasolina mais baratos hoje" },
  { href: "/folhetos",     titulo: "Folhetos",     desc: "Os folhetos dos supermercados desta semana" },
  { href: "/receitas",     titulo: "Receitas baratas", desc: "Refeições económicas para 4 pessoas" },
];

export default function NaoEncontrada() {
  return (
    <LayoutPublico>
      <Head>
        <title>Página não encontrada | PoupeJá</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{ paddingTop: 32, paddingBottom: 48 }}>
        <h1 className="font-display" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>
          Esta página não existe
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.5 }}>
          O link pode estar desatualizado. Talvez procures uma destas:
        </p>
        <div className="flex flex-col" style={{ marginTop: 20 }}>
          {SAIDAS.map((s, i) => (
            <a key={s.href} href={s.href} className="pj-tap no-underline"
              style={{ padding: "14px 0", borderTop: i ? "1px solid var(--pj-subtle)" : "none", color: "var(--pj-text)" }}>
              <span style={{ display: "block", fontSize: 15, fontWeight: 600 }}>{s.titulo}</span>
              <span style={{ display: "block", fontSize: 13, color: "var(--pj-text-muted)", marginTop: 2 }}>{s.desc}</span>
            </a>
          ))}
        </div>
      </div>
    </LayoutPublico>
  );
}
