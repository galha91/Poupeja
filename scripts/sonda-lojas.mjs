// TEMPORÁRIO — Aldi: consultar o índice Algolia público.
const APP = "EO5090GA91";
const KEYS = ["10266a4d1d421a7befa6fbf8fb92eb8f", "2a471c92a397d1ebd939311b20e555e0"];
const INDICES = ["an_prd_pt_pt_products2", "an_prd_pt_pt_products", "an_prd_pt_products2", "an_prd_pt_products"];
for (const key of KEYS) for (const indexName of INDICES) {
  const r = await fetch(`https://${APP}-dsn.algolia.net/1/indexes/*/queries`, {
    method: "POST",
    headers: { "x-algolia-application-id": APP, "x-algolia-api-key": key, "content-type": "application/json", Referer: "https://www.aldi.pt/", Origin: "https://www.aldi.pt" },
    body: JSON.stringify({ requests: [{ indexName, params: "query=leite&hitsPerPage=3" }] }),
  });
  const t = await r.text();
  console.log(`\n== ${key.slice(0, 6)} ${indexName} → ${r.status}`);
  if (r.ok) {
    const j = JSON.parse(t).results[0];
    console.log("nbHits", j.nbHits);
    console.log(JSON.stringify(j.hits.slice(0, 2), null, 1).slice(0, 4000));
  } else console.log(t.slice(0, 200));
}
for (const q of ["laranja", "salsa", "ovos", "papel higiénico"]) {
  const r = await fetch(`https://${APP}-dsn.algolia.net/1/indexes/*/queries`, {
    method: "POST",
    headers: { "x-algolia-application-id": APP, "x-algolia-api-key": KEYS[0], "content-type": "application/json", Referer: "https://www.aldi.pt/", Origin: "https://www.aldi.pt" },
    body: JSON.stringify({ requests: [{ indexName: "an_prd_pt_pt_products2", params: `query=${encodeURIComponent(q)}&hitsPerPage=5` }] }),
  });
  const j = r.ok ? (await r.json()).results[0] : null;
  console.log(`\n## ${q}: ${r.status} nbHits=${j?.nbHits}`);
  for (const h of j?.hits || []) console.log("  -", JSON.stringify(h).slice(0, 700));
}
