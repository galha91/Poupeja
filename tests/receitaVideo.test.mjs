import { test } from "node:test";
import assert from "node:assert/strict";
import { primeiroLink, fonteDoLink, linkTikTok, limparReceita, jsonDaResposta, dadosOembed, comCustos, promptReceita } from "../lib/receitaVideo.js";
import { resumosDosPrecos } from "../lib/receitasCusto.js";
import { custoReceita } from "../lib/seoPrecos.js";

test("importar receita: o link de um texto partilhado", () => {
  assert.equal(primeiroLink("Vê este vídeo! https://vm.tiktok.com/ZMabc12/ #receita"), "https://vm.tiktok.com/ZMabc12/");
  assert.equal(primeiroLink("sem link nenhum"), null);
  assert.equal(primeiroLink("(https://www.tiktok.com/@a/video/1)."), "https://www.tiktok.com/@a/video/1");
});

test("importar receita: só se abrem links do TikTok, e sem rastreio", () => {
  assert.equal(fonteDoLink("https://www.instagram.com/reel/abc/"), "instagram");
  assert.equal(fonteDoLink("https://youtu.be/x"), "youtube");
  assert.equal(fonteDoLink("https://blog.pt/receita"), "outro");
  assert.equal(fonteDoLink("javascript:alert(1)"), null);
  assert.equal(linkTikTok("https://www.tiktok.com/@chef/video/123?is_from_webapp=1&sender=x"), "https://www.tiktok.com/@chef/video/123");
  assert.equal(linkTikTok("https://tiktok.com.malicioso.pt/@a/video/1"), null);
  assert.equal(linkTikTok("https://169.254.169.254/latest"), null);
});

test("importar receita: ingredientes ligados ao dicionário, o resto pelo nome", () => {
  const r = limparReceita({
    receita: true, titulo: "Salmão no forno <script>", porcoes: 2, tempoMin: 35,
    ingredientes: [
      { key: "salmao", q: 400 }, { key: "salmao", q: 100 }, { key: "batata", q: 500 },
      { key: null, nome: "Molho de soja", q: 2, u: "c. sopa" }, { key: "inventado", nome: "", q: 1 },
      { key: null, nome: "Sésamo", q: 1, u: "punhado" },
    ],
    passos: ["Corta as batatas.", "", "Leva ao forno (30 min)."],
    trocas: [{ de: "salmao", para: "pescada" }, { de: "batata", para: "salmao" }, { de: "x", para: "y" }],
  });
  assert.equal(r.titulo, "Salmão no forno script");
  assert.equal(r.porcoes, 2);
  assert.deepEqual(r.ingredientes.map((i) => i.key), ["salmao", "batata", "livre:molho de soja", "livre:sésamo"]);
  assert.equal(r.ingredientes[0].compra, "Salmão");
  assert.equal(r.ingredientes[3].u, "q.b."); // unidade desconhecida
  assert.equal(r.passos.length, 2);
  assert.deepEqual(r.trocas.map((t) => `${t.de}>${t.para}`), ["salmao>pescada"]);
});

test("importar receita: sem receita não há nada", () => {
  assert.equal(limparReceita({ receita: false }), null);
  assert.equal(limparReceita({ receita: true, ingredientes: [] }), null);
  assert.equal(limparReceita(null), null);
  assert.deepEqual(jsonDaResposta('Aqui está: {"receita":false} fim'), { receita: false });
  assert.equal(jsonDaResposta("nada"), null);
});

test("importar receita: do oEmbed só a legenda e o autor do TikTok", () => {
  assert.deepEqual(dadosOembed({ title: "Bitoque 🥩 ingredientes…", author_name: "chef", author_url: "https://www.tiktok.com/@chef", html: "<script>" }),
    { legenda: "Bitoque 🥩 ingredientes…", autor: "chef", autorUrl: "https://www.tiktok.com/@chef" });
  assert.equal(dadosOembed({ title: "x", author_url: "https://mau.pt" }).autorUrl, null);
  assert.equal(dadosOembed({}), null);
});

test("importar receita: o prompt leva o dicionário e o texto (ou só o pedido da foto)", () => {
  const p = promptReceita("2 ovos e batata");
  assert.match(p, /salmao \| Salmão \| g/);
  assert.match(p, /2 ovos e batata/);
  assert.doesNotMatch(promptReceita(), /TEXTO:/);
});

test("importar receita: custo e trocas com os preços guardados", () => {
  const agora = Date.now();
  const resumos = resumosDosPrecos({ geradoEm: new Date(agora).toISOString(), precos: {
    salmao: { u: "kg", v: 15, l: "Continente" }, pescada: { u: "kg", v: 6, l: "Lidl" }, batatas: { u: "kg", v: 1, l: "Auchan" }, "mau slug": { u: "kg", v: 1 },
  } }, agora);
  assert.equal(resumos.size, 3);
  const r = limparReceita({ receita: true, porcoes: 4, ingredientes: [{ key: "salmao", q: 600 }, { key: "batata", q: 1000 }], trocas: [{ de: "salmao", para: "pescada" }] });
  const c = comCustos(r, resumos, custoReceita);
  assert.equal(c.custo.total, 10); // 0,6 × 15 + 1 × 1
  assert.equal(c.trocas[0].poupa, 5.4); // 0,6 × (15 − 6)
  // Sem preços: nem custo nem trocas (não se promete poupança que não se sabe).
  assert.deepEqual(comCustos(r, null, custoReceita).trocas, []);
  // Mapa velho não serve.
  assert.equal(resumosDosPrecos({ geradoEm: "2020-01-01T00:00:00Z", precos: { salmao: { u: "kg", v: 1 } } }), null);
});

test("importar receita: id do vídeo e legenda da página do TikTok", async () => {
  const { idVideoTikTok, dadosPaginaTikTok } = await import("../lib/receitaVideo.js");
  assert.equal(idVideoTikTok("https://www.tiktok.com/@chef/video/7301234567890123456"), "7301234567890123456");
  assert.equal(idVideoTikTok("https://m.tiktok.com/v/7301234567890123456.html"), "7301234567890123456");
  assert.equal(idVideoTikTok("https://vm.tiktok.com/ZN8HPryTA/"), null);
  assert.equal(idVideoTikTok("https://www.tiktok.com/@chef/photo/7301234567890123456"), "7301234567890123456");
  const html = '<script>{"itemInfo":{"itemStruct":{"desc":"Frango no forno 🍗\\n1 kg de frango, 2 cebolas \\"top\\"","author":{"uniqueId":"chef.pt"}}}}</script>';
  assert.deepEqual(dadosPaginaTikTok(html), { legenda: 'Frango no forno 🍗\n1 kg de frango, 2 cebolas "top"', autor: "chef.pt", autorUrl: "https://www.tiktok.com/@chef.pt" });
  assert.equal(dadosPaginaTikTok('<meta property="og:description" content="Massa com atum e tomate, 20 min">').legenda, "Massa com atum e tomate, 20 min");
  assert.equal(dadosPaginaTikTok("<html></html>"), null);
});
