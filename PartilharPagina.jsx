import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { URL_SITE } from "./lib/site";
import { evento } from "./lib/analytics";

/*
 * Botão "Partilhar no WhatsApp" das páginas públicas. É o caminho mais curto
 * para quem encontra algo útil (o posto mais barato do concelho, os folhetos
 * da semana) o pôr num grupo de família ou de bairro, que é onde está a
 * gente que ainda não conhece o PoupeJá.
 */
export default function PartilharPagina() {
  const [href, setHref] = useState(`https://wa.me/?text=${encodeURIComponent(URL_SITE)}`);
  useEffect(() => {
    // O endereço vai em ASCII (punycode): em cru, o acento parte o link em
    // alguns clientes de mensagens (ver lib/site.js).
    const url = `${URL_SITE}${window.location.pathname}`;
    setHref(`https://wa.me/?text=${encodeURIComponent(`${document.title}\n${url}`)}`);
  }, []);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="pj-tap inline-flex items-center gap-2 no-underline mt-6"
      onClick={() => evento("partilhar", { canal: "whatsapp", pagina: typeof window !== "undefined" ? window.location.pathname : "" })}
      style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid var(--pj-border)", background: "var(--pj-card)", color: "var(--pj-text)", fontSize: 13.5, fontWeight: 600 }}>
      <Share2 size={15} /> Partilhar no WhatsApp
    </a>
  );
}
