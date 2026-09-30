import { ExternalLink } from "lucide-react";
import { FONTES } from "./lib/fontes";

/*
 * "Fonte: DGEG ↗" — a linha que diz de onde vem um número do Estado e leva
 * ao original. Discreta, mas legível e sempre visível (não escondida num
 * cartão fechado): quem lê o valor tem o link à frente.
 *
 * `fontes` aceita chaves de lib/fontes ("dgeg") ou { curto, href } soltos.
 */
export default function FonteOficial({ fontes, prefixo = "Fonte", className = "", style }) {
  const lista = (Array.isArray(fontes) ? fontes : [fontes])
    .map((f) => (typeof f === "string" ? FONTES[f] : f))
    .filter((f) => f?.href);
  if (!lista.length) return null;
  return (
    <p className={className} style={{ fontSize: 11, lineHeight: 1.6, color: "var(--pj-text-faint)", ...style }}>
      {prefixo}:{" "}
      {lista.map((f, i) => (
        <span key={f.href}>
          {i > 0 && " · "}
          <a
            href={f.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--pj-brand-ink)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2, whiteSpace: "nowrap" }}
          >
            {f.curto}
            <ExternalLink size={10} style={{ display: "inline", marginLeft: 3, marginBottom: 1 }} aria-hidden="true" />
          </a>
        </span>
      ))}
    </p>
  );
}
