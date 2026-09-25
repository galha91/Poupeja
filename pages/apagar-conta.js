import { useEffect, useState } from "react";
import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import { supabase } from "../lib/supabase";
import { apagarConta } from "../lib/apagarConta";

/*
 * Página pública para apagar a conta — o "link de eliminação de conta"
 * que a Play Store pede na ficha de Segurança dos dados. Tem de funcionar
 * sem a app instalada: quem tiver sessão iniciada neste browser apaga aqui
 * mesmo; quem não tiver fica com os dois caminhos (entrar, ou pedir por
 * email).
 */
export default function PaginaApagarConta() {
  const [estado, setEstado] = useState("a-verificar"); // a-verificar | sem-sessao | com-sessao | a-apagar | apagada
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user;
      if (u && !u.is_anonymous) {
        setEmail(u.email || "");
        setEstado("com-sessao");
      } else {
        setEstado("sem-sessao");
      }
    });
  }, []);

  async function confirmar() {
    setErro("");
    setEstado("a-apagar");
    try {
      await apagarConta();
      setEstado("apagada");
    } catch (e) {
      setErro(e.message || "Não foi possível apagar a conta agora.");
      setEstado("com-sessao");
    }
  }

  const caixa = { background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 18, padding: 20, marginTop: 20 };

  return (
    <LayoutPublico>
      <Head>
        <title>Apagar a conta — PoupeJá</title>
        <meta name="description" content="Como apagar a tua conta do PoupeJá e todos os dados associados." />
        <meta name="robots" content="noindex" />
      </Head>

      <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, marginTop: 12 }}>Apagar a conta</h1>
      <p style={{ fontSize: 15, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 10 }}>
        Quando apagas a conta, apagamos também tudo o que está nela: talões, listas de compras, contas da casa,
        registo de poupança e preferências. Não fica nada guardado e não dá para recuperar depois.
      </p>

      {estado === "com-sessao" || estado === "a-apagar" ? (
        <div style={caixa}>
          <p style={{ fontSize: 14, color: "var(--pj-text-muted)" }}>Tens sessão iniciada como</p>
          <p style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{email}</p>
          {erro && <p style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-danger)", marginTop: 12 }}>{erro}</p>}
          <button
            onClick={confirmar}
            disabled={estado === "a-apagar"}
            className="pj-tap"
            style={{ marginTop: 16, width: "100%", padding: "14px 0", borderRadius: 14, border: 0, background: "#a2432a", color: "#fff", fontSize: 15, fontWeight: 600, opacity: estado === "a-apagar" ? 0.6 : 1 }}
          >
            {estado === "a-apagar" ? "A apagar…" : "Apagar a minha conta para sempre"}
          </button>
        </div>
      ) : estado === "apagada" ? (
        <div style={caixa}>
          <p style={{ fontSize: 16, fontWeight: 600 }}>A tua conta foi apagada.</p>
          <p style={{ fontSize: 14, color: "var(--pj-text-muted)", marginTop: 6, lineHeight: 1.6 }}>
            A conta e os dados associados já não existem. Obrigado por teres usado o PoupeJá.
          </p>
        </div>
      ) : estado === "sem-sessao" ? (
        <>
          <div style={caixa}>
            <p style={{ fontSize: 16, fontWeight: 600 }}>Na app ou no site</p>
            <p style={{ fontSize: 14, color: "var(--pj-text-muted)", marginTop: 6, lineHeight: 1.6 }}>
              Entra na tua conta e vai a <strong style={{ color: "var(--pj-text)" }}>Definições → Conta → Apagar conta</strong>.
              A conta é apagada na hora.
            </p>
            <a href="/" className="pj-tap inline-block no-underline" style={{ marginTop: 14, background: "var(--pj-brand)", color: "#fff", fontSize: 14, fontWeight: 600, padding: "11px 18px", borderRadius: 12 }}>
              Entrar na minha conta
            </a>
          </div>
          <div style={caixa}>
            <p style={{ fontSize: 16, fontWeight: 600 }}>Por email</p>
            <p style={{ fontSize: 14, color: "var(--pj-text-muted)", marginTop: 6, lineHeight: 1.6 }}>
              Se já não consegues entrar, escreve para{" "}
              <a href="mailto:poupeja.portugal@gmail.com?subject=Apagar%20conta" style={{ color: "var(--pj-brand-ink)", fontWeight: 600 }}>poupeja.portugal@gmail.com</a>{" "}
              a partir do email da conta, com o assunto «Apagar conta». Apagamos a conta e todos os dados no prazo máximo de 30 dias
              e respondemos a confirmar.
            </p>
          </div>
        </>
      ) : null}
    </LayoutPublico>
  );
}
