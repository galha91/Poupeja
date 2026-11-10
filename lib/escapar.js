/*
 * Escapar dados antes de os pôr em HTML feito à mão (emails, páginas
 * devolvidas pelas rotas /api) ou dentro de <script> (JSON-LD).
 *
 * O React já escapa o que vai para o JSX. Isto é para os sítios onde ele
 * não entra: template strings de HTML e `dangerouslySetInnerHTML`.
 */

const ENTIDADES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/* Texto → HTML seguro (corpo e atributos entre aspas). */
export function escaparHtml(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}

/*
 * Objeto → JSON para pôr dentro de <script type="application/ld+json">.
 *
 * JSON.stringify sozinho NÃO chega: um nome de produto vindo de um site de
 * supermercado com "</script><script>…" fechava a tag e corria código na
 * página. Trocar <, > e & pelas sequências \u00XX dá exatamente o mesmo
 * JSON para quem o lê (Google, etc.) e deixa de haver forma de sair da tag.
 * U+2028/U+2029 também, por serem quebras de linha em alguns parsers de JS.
 */
export function jsonLdSeguro(objeto) {
  return JSON.stringify(objeto)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(new RegExp("\\u2028", "g"), "\\u2028")
    .replace(new RegExp("\\u2029", "g"), "\\u2029");
}
