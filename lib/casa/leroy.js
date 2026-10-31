import { buscar, absoluto, capitalizar } from "../supermercados/comum.js";

/*
 * Leroy Merlin. A página de pesquisa traz, para cada lista de produtos, um
 * bloco JSON de medição ("dataTms", lista cdl_products_list) com o nome, a
 * marca e o preço com IVA (unitprice_ati) — o mesmo preço que aparece no
 * cartão. Lê-se esse JSON em vez do HTML do cartão, que muda mais vezes.
 *
 * Só conta o que a própria Leroy Merlin vende (seller_type "1P"). O
 * marketplace (vendedores de fora, "3P") tem portes e condições de cada
 * vendedor: não é o preço da Leroy.
 */

const BASE = "https://www.leroymerlin.pt";

/* "Pack de 3 Lâmpadas…" · "Conjunto de 4…" · "3 unidades" → 3. */
export function unidadesNoPack(nome) {
  const t = String(nome || "").toLowerCase();
  const m = t.match(/\b(?:pack|conjunto|kit|caixa)\s+(?:de\s+)?(\d{1,3})\b/) || t.match(/\b(\d{1,3})\s*(?:unidades|unid\.?|un\.)(?!\w)/);
  const n = m ? parseInt(m[1], 10) : 1;
  return n > 1 ? n : 1;
}

export function lerLeroy(html) {
  const blocos = [...String(html).matchAll(/<script type="application\/json" class="dataTms">\s*([\s\S]*?)\s*<\/script>/g)].map((m) => m[1]);
  // Sem nenhum bloco é porque a página mudou de formato — isso é uma
  // avaria, não "zero produtos" (e a verificação diária tem de a ver).
  if (!blocos.length) throw new Error("resposta da Leroy Merlin sem lista de produtos");

  // A imagem não vem no JSON: está no cartão do produto (data-reflm = sku).
  const imagens = new Map();
  for (const parte of String(html).split('data-reflm="').slice(1)) {
    const sku = parte.slice(0, parte.indexOf('"'));
    const img = parte.match(/<img src="([^"]+)"[^>]*class="a-illustration__img"/);
    if (sku && img && !imagens.has(sku)) imagens.set(sku, img[1]);
  }

  const vistos = new Map();
  for (const bloco of blocos) {
    let eventos;
    try { eventos = JSON.parse(bloco); } catch { continue; }
    for (const ev of Array.isArray(eventos) ? eventos : []) {
      if (ev?.name !== "cdl_products_list" || !Array.isArray(ev.value)) continue;
      for (const p of ev.value) {
        const o = p?.offer || {};
        if (o.seller_type !== "1P" || !(o.unitprice_ati > 0) || !p.name) continue;
        const id = String(p.sku || p.identifier || "");
        if (vistos.has(id)) continue;
        const n = unidadesNoPack(p.name);
        vistos.set(id, {
          id,
          nome: p.name,
          marca: p.brand ? capitalizar(p.brand) : null,
          quantidade: n > 1 ? `${n} un` : null,
          preco: o.unitprice_ati,
          precoAntigo: o.initial_price > o.unitprice_ati ? o.initial_price : null,
          url: absoluto(BASE, p.url),
          imagem: imagens.get(id) || null,
          categoria: null,
        });
      }
    }
  }
  return [...vistos.values()];
}

export const leroy = {
  id: "leroy-merlin",
  nome: "Leroy Merlin",
  async pesquisar(q) {
    const html = await buscar(`${BASE}/search?q=${encodeURIComponent(q)}`);
    return lerLeroy(html);
  },
};
