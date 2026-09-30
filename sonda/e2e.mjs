import { chromium, devices } from "playwright";
const BASE = "http://localhost:3055";
const LOJAS = ["Aldi", "Pingo Doce", "Intermarché", "E.Leclerc", "Froiz"];
const agoraS = Math.floor(Date.now() / 1000);
const user = { id: "00000000-0000-4000-8000-000000000001", aud: "authenticated", role: "authenticated", email: "ana@exemplo.pt", is_anonymous: false, created_at: "2026-06-01T10:00:00Z", user_metadata: { nome: "Ana" }, app_metadata: { provider: "email" } };
const sessao = { access_token: "x.y.z", token_type: "bearer", expires_in: 86400, expires_at: agoraS + 86400, refresh_token: "x", user };

console.log("== API ==");
for (const l of [...LOJAS, "Lidl", "Continente"]) {
  const r = await fetch(`${BASE}/api/folheto-viewer?loja=${encodeURIComponent(l)}`);
  const j = await r.json().catch(() => ({}));
  console.log(l, r.status, JSON.stringify(j).slice(0, 700));
}

console.log("\n== APP (viewer no Início) ==");
const b = await chromium.launch();
for (const loja of LOJAS) {
  const ctx = await b.newContext({ ...devices["Pixel 7"], locale: "pt-PT" });
  await ctx.addInitScript(({ sessao }) => { try { localStorage.setItem("sb-projeto-dev-falso-auth-token", JSON.stringify(sessao)); localStorage.setItem("poupeja_onboarding_v1", "1"); sessionStorage.setItem("poupeja_barra_dispensada", "1"); localStorage.setItem("poupeja_ndispensas", "99"); } catch {} }, { sessao });
  await ctx.route("https://projeto-dev-falso.supabase.co/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  const p = await ctx.newPage();
  const erros = []; p.on("pageerror", (e) => erros.push(e.message));
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  const btn = p.locator("button:visible").filter({ hasText: new RegExp(`^${loja.replace(".", "\\.")}$`) }).first();
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await p.waitForSelector('[role="dialog"] iframe', { timeout: 15000 }).catch(() => console.log(`${loja}: sem iframe (fallback?)`));
  await p.waitForTimeout(9000);
  const chips = await p.locator('[role="dialog"] button').allInnerTexts();
  console.log(`\n# ${loja} | botões: ${chips.map((c) => c.trim()).filter(Boolean).join(" | ")}`);
  for (const f of p.frames().filter((f) => f !== p.mainFrame())) {
    try {
      const info = await f.evaluate(() => ({ t: document.title, n: (document.body?.innerText || "").length, img: document.images.length, canvas: document.querySelectorAll("canvas").length, sample: (document.body?.innerText || "").replace(/\s+/g, " ").slice(0, 140) }));
      console.log(`  frame ${f.url().slice(0, 100)} | título="${info.t}" texto=${info.n} img=${info.img} canvas=${info.canvas}\n    "${info.sample}"`);
    } catch (e) { console.log(`  frame ${f.url().slice(0, 100)} | erro ao ler: ${e.message.slice(0, 80)}`); }
  }
  const visivel = await p.locator('[role="dialog"] iframe').evaluate((el) => getComputedStyle(el).opacity).catch(() => "?");
  console.log(`  iframe opacity(final)=${visivel} | erros da página: ${JSON.stringify(erros)}`);
  // Voltar fecha o folheto?
  await p.goBack().catch(() => {});
  await p.waitForTimeout(600);
  console.log(`  após voltar, viewer aberto? ${await p.locator('[role="dialog"]').count()}`);
  await ctx.close();
}
await b.close();
