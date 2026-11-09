// Gera o vídeo vertical (1080x1920, 30 fps, sem áudio) de um cabaz.
// Uso: node scripts/cabaz/video.mjs <cabaz.json> <saida.mp4>
// Cada fotograma é um screenshot determinístico da função desenhar(t), enviado
// para o ffmpeg. Sem áudio de propósito: o som em alta escolhe-se na própria app.
import fs from "node:fs";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
// require (não import): o Playwright resolve-se pelo NODE_PATH, que o import ESM ignora.
const { chromium } = createRequire(import.meta.url)("playwright");

const FPS = 30, L = 1080, A = 1920;
const T_GANCHO = 2.6, T_ITEM = 0.72, T_REVELA = 3.2, T_FIM = 3.6;

const [entrada, saida] = process.argv.slice(2);
const c = JSON.parse(fs.readFileSync(entrada));
const duracao = T_GANCHO + c.itens.length * T_ITEM + T_REVELA + T_FIM;
const frames = Math.round(duracao * FPS);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
:root{--verde:#0b6b4f;--escuro:#14231c;--fundo:#f6f5f0;--ambar:#c8a26a;--cinza:#636d66;--vermelho:#b4472e}
*{box-sizing:border-box;margin:0}
body{width:${L}px;height:${A}px;background:var(--fundo);font-family:Inter,sans-serif;color:var(--escuro);position:relative;overflow:hidden}
.serif{font-family:"DejaVu Serif",serif;font-weight:700}
#marca{position:absolute;left:70px;top:120px;font-size:40px;font-weight:800;color:var(--verde);letter-spacing:-.5px}
#tema{position:absolute;left:70px;top:190px;width:940px;font-size:62px;line-height:1.1}
#gancho{position:absolute;left:70px;top:520px;width:940px;font-size:92px;line-height:1.15}
#gancho div{opacity:0}
#lista{position:absolute;left:70px;top:370px;width:940px}
.item{display:flex;justify-content:space-between;align-items:baseline;font-size:38px;height:62px;border-bottom:2px solid #e4e2d8;opacity:0;white-space:nowrap}
.item b{font-weight:600}.item span{color:var(--cinza);font-size:34px}
#corrida{position:absolute;left:70px;top:1190px;width:940px}
.linha{height:110px;margin-bottom:14px;position:relative}
.nome{font-size:36px;font-weight:700;height:44px}
.fundo{position:absolute;top:50px;left:0;width:940px;height:46px;background:#e9e7dc;border-radius:23px}
.barra{position:absolute;top:50px;left:0;height:46px;border-radius:23px;background:var(--ambar);min-width:46px}
.total{position:absolute;right:0;top:0;font-size:46px;font-weight:800}
#revela{position:absolute;left:70px;top:1020px;width:940px;opacity:0;font-size:46px;line-height:1.15;color:var(--verde)}
#fim{position:absolute;inset:0;background:var(--verde);color:#fff;opacity:0;padding:70px;display:flex;flex-direction:column;justify-content:center}
#fim .g{font-size:104px;line-height:1.1}#fim .s{font-size:44px;margin-top:50px;opacity:.9}
#fim .u{margin-top:70px;background:#fff;color:var(--verde);font-size:58px;font-weight:800;padding:34px 44px;border-radius:28px;display:inline-block;align-self:flex-start}
#fim .n{position:absolute;left:70px;bottom:330px;font-size:30px;opacity:.8}
</style></head><body>
<div id="marca">PoupeJá</div>
<div id="tema" class="serif"></div>
<div id="gancho" class="serif"><div>10 artigos.</div><div>${c.lojas.length} supermercados.</div><div style="color:var(--verde)">Quem é mais barato?</div></div>
<div id="lista"></div>
<div id="revela" class="serif"></div>
<div id="corrida"></div>
<div id="fim"><div class="g serif">Compara a tua lista de graça</div><div class="s">Descobre onde fica mais barata, em segundos.</div><div class="u">PoupeJá.com</div><div class="n"></div></div>
<script>
const C=${JSON.stringify(c)}, TG=${T_GANCHO}, TI=${T_ITEM}, TR=${T_REVELA}, N=C.itens.length;
const eur=n=>n.toFixed(2).replace(".",",")+" €";
const ease=x=>1-Math.pow(1-Math.min(1,Math.max(0,x)),3);
const el=id=>document.getElementById(id);
el("tema").textContent="Cabaz "+C.titulo;
el("lista").innerHTML=C.itens.map(i=>'<div class="item"><b>'+i.nome+'</b><span>'+i.rotulo+'</span></div>').join("");
el("corrida").innerHTML=C.lojas.map(l=>'<div class="linha" data-l="'+l+'"><div class="nome">'+C.nomesLojas[l]+'</div><div class="total"></div><div class="fundo"></div><div class="barra"></div></div>').join("");
el("fim").querySelector(".n").textContent="Preço mais baixo de cada artigo, por loja. Preços de "+C.dia.split("-").reverse().join("/")+".";
const maxTot=Math.max(...C.lojas.map(l=>C.totais[l]));
function desenhar(t){
  const tI=t-TG, tR=TG+N*TI, itens=document.querySelectorAll(".item");
  [...el("gancho").children].forEach((d,k)=>{const p=ease((t-0.15-k*0.55)/0.4);d.style.opacity=t<TG-0.3?p:Math.max(0,1-(t-(TG-0.3))/0.3);d.style.transform="translateY("+(1-p)*40+"px)"});
  const mostrar=t>=TG-0.2; el("tema").style.opacity=mostrar?ease((t-(TG-0.2))/0.3):0;
  el("lista").style.opacity=mostrar?1:0; el("corrida").style.opacity=mostrar?1:0;
  itens.forEach((d,k)=>{const p=ease((tI-k*TI)/0.3);d.style.opacity=p;d.style.transform="translateX("+(1-p)*-60+"px)"});
  const acum={};C.lojas.forEach(l=>acum[l]=0);
  C.itens.forEach((i,k)=>{const p=ease((tI-k*TI-0.1)/0.45);C.lojas.forEach(l=>acum[l]+=i.custos[l]*p)});
  const fim=t>=tR;
  const venc=C.maisBarata;
  document.querySelectorAll(".linha").forEach(r=>{const l=r.dataset.l;
    r.querySelector(".barra").style.width=Math.max(46,acum[l]/maxTot*940)+"px";
    r.querySelector(".total").textContent=eur(acum[l]);
    const b=r.querySelector(".barra");
    b.style.background=fim?(l===C.maisCara?"#b4472e":(!C.empate&&l===venc)?"#0b6b4f":"#c8a26a"):"#c8a26a";
    r.style.opacity=fim&&!C.empate&&l!==venc&&l!==C.maisCara?0.55:1;});
  const pr=ease((t-tR-0.3)/0.5);
  el("revela").style.opacity=pr; el("revela").style.transform="translateY("+(1-pr)*30+"px)";
  el("revela").innerHTML=C.empate?"As 3 grandes quase empatam. "+C.nomesLojas[C.maisCara]+": <span style='color:#b4472e'>+"+C.extraMaisCaraPct+"%</span>":"Mesmo cabaz: <span style='color:#b4472e'>"+eur(C.poupanca)+"</span> de diferença";
  const tF=tR+${T_REVELA};
  el("fim").style.opacity=ease((t-tF)/0.4);
}
window.desenhar=desenhar;
</script></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: L, height: A }, deviceScaleFactor: 1 });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium", "-movflags", "+faststart", saida], { stdio: ["pipe", "inherit", "inherit"] });
const fim = new Promise((r, e) => { ff.on("close", (code) => (code === 0 ? r() : e(new Error("ffmpeg " + code)))); });
for (let f = 0; f < frames; f++) {
  await page.evaluate((t) => window.desenhar(t), f / FPS);
  const png = await page.screenshot({ type: "jpeg", quality: 92 });
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
}
ff.stdin.end();
await fim;
await browser.close();
console.log(`${saida}: ${duracao.toFixed(1)} s, ${frames} fotogramas`);
