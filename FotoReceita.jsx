import { fotosDe, AVISO_IA } from "./lib/receitas/fotos";

/*
 * Fotografia de uma receita (lib/receitas/fotos). Sem fotografia devolve
 * null e quem chama mostra o emoji, como antes.
 *
 *   tamanho "grande"  topo da página da receita, 4:3, com o aviso por baixo
 *   tamanho "mini"    miniatura quadrada das listas (lado = px)
 *   preco             "1,85 €/pessoa" por cima da fotografia, em baixo à esquerda
 *
 * <img> simples com srcset: os ficheiros já vêm no tamanho certo, sem passar
 * pela otimização de imagens da Vercel.
 */
export default function FotoReceita({ id, nome, tamanho = "grande", px = 56, preco = null, prioridade = false, aviso = true }) {
  const f = fotosDe(id);
  if (!f) return null;
  const alt = `${nome}, uma dose servida no prato`;

  if (tamanho === "mini") {
    return (
      <img src={f.pequena} alt="" aria-hidden="true" width={px} height={px} loading="lazy" decoding="async"
        style={{ width: px, height: px, objectFit: "cover", borderRadius: Math.round(px / 4), flexShrink: 0, background: "var(--pj-subtle)" }} />
    );
  }

  return (
    <figure style={{ margin: 0 }}>
      <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", background: "var(--pj-subtle)", aspectRatio: "4 / 3" }}>
        <img src={f.grande} srcSet={`${f.pequena} 480w, ${f.grande} 1200w`} sizes="(max-width: 720px) 100vw, 680px"
          alt={alt} width={1200} height={900} loading={prioridade ? "eager" : "lazy"} decoding="async"
          {...(prioridade ? { fetchpriority: "high" } : {})}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        {preco && (
          <span className="pj-num" style={{ position: "absolute", left: 12, bottom: 12, padding: "6px 12px", borderRadius: 12, background: "rgba(8,76,57,0.92)", color: "#fff", fontSize: 14, fontWeight: 700 }}>
            {preco}
          </span>
        )}
      </div>
      {aviso && <figcaption style={{ fontSize: 11.5, color: "var(--pj-text-faint)", marginTop: 6 }}>{AVISO_IA}</figcaption>}
    </figure>
  );
}
