import Head from "next/head";
import { ArrowRight } from "lucide-react";
import LayoutPublico from "../LayoutPublico";
import { SECOES_APP as SECOES } from "../lib/secoesApp";

/*
 * Página não encontrada — em português e com saída para TUDO.
 *
 * Quem chega aqui (link antigo, endereço mal escrito) não tem conta nem
 * precisa: a app inteira funciona como convidado. Por isso a saída
 * principal é abrir a app, e logo a seguir cada secção dela, por atalho
 * (lib/secoesApp). Antes só havia
 * três páginas públicas, e quem queria a lista, os talões ou as contas
 * ficava sem caminho.
 */

export default function NaoEncontrada() {
  return (
    <LayoutPublico>
      <Head>
        <title>Página não encontrada | PoupeJá</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{ paddingTop: 32, paddingBottom: 48 }}>
        <h1 className="font-display" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>
          Este link já não existe
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.5 }}>
          Mas está tudo na app — grátis e sem criar conta.
        </p>

        <a href="/" className="pj-tap inline-flex items-center no-underline"
          style={{ gap: 8, marginTop: 20, padding: "13px 20px", borderRadius: 14, background: "var(--pj-brand)", color: "#fff", fontSize: 15, fontWeight: 600 }}>
          Abrir o PoupeJá <ArrowRight size={16} />
        </a>

        <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", marginTop: 32 }}>
          Ou vai direto a
        </p>
        <div className="flex flex-col" style={{ marginTop: 6 }}>
          {SECOES.map((s, i) => (
            <a key={s.atalho} href={`/?atalho=${s.atalho}`} className="pj-tap no-underline flex items-center"
              style={{ gap: 12, padding: "14px 0", borderTop: i ? "1px solid var(--pj-subtle)" : "none", color: "var(--pj-text)" }}>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: 15, fontWeight: 600 }}>{s.titulo}</span>
                <span style={{ display: "block", fontSize: 13, color: "var(--pj-text-muted)", marginTop: 2 }}>{s.desc}</span>
              </span>
              <ArrowRight size={16} style={{ color: "var(--pj-text-faint)", flexShrink: 0 }} />
            </a>
          ))}
        </div>
      </div>
    </LayoutPublico>
  );
}
