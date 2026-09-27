// TEMPORÁRIO — só para diagnosticar na preview. Remover antes do merge.
import { parse } from "node-html-parser";

const UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36";

export default async function handler(req, res) {
  const out = {};
  const r = await fetch("https://www.auchan.pt/on/demandware.store/Sites-AuchanPT-Site/pt_PT/Search-UpdateGrid?q=laranja&start=0&sz=3", { headers: { "User-Agent": UA, Accept: "text/html", "Accept-Language": "pt-PT" } });
  const html = await r.text();
  const t = parse(html).querySelector(".auc-product-tile");
  t?.querySelectorAll("svg,script,style,source,picture").forEach((n) => n.remove());
  out.auchan = { status: r.status, len: html.length, tile: t ? t.outerHTML.replace(/\s+/g, " ").slice(0, 6000) : html.slice(0, 3000) };
  for (const acc of ["*/*", "application/mindshift.search+json;version=2", "application/json, text/plain, */*"]) {
    const l = await fetch("https://www.lidl.pt/q/api/search?q=laranja&assortment=PT&locale=pt_PT&version=v2.0.0&fetchsize=2", { headers: { "User-Agent": UA, Accept: acc } });
    out["lidl " + acc] = l.status;
  }
  res.status(200).json(out);
}
