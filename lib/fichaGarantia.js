import { dataCurta } from "./datas.js";
import { eur } from "./formato.js";
import { ROTULO_ESTADO, LINKS_RECLAMACAO } from "./garantias.js";

/*
 * Ficha da compra em imagem (PNG), para juntar a uma reclamação: dados da
 * garantia e a foto do talão, com os links do Livro de Reclamações e do
 * Portal do Consumidor. Desenhada num <canvas> — sem bibliotecas de PDF,
 * que pesariam centenas de KB para isto.
 */

const L = 1080;
const M = 64;

function linhas(ctx, texto, largura) {
  const palavras = String(texto).split(/\s+/);
  const out = [];
  let atual = "";
  for (const p of palavras) {
    const t = atual ? `${atual} ${p}` : p;
    if (ctx.measureText(t).width > largura && atual) { out.push(atual); atual = p; } else atual = t;
  }
  if (atual) out.push(atual);
  return out;
}

function carregarImagem(blob) {
  return new Promise((resolve) => {
    if (!blob) return resolve(null);
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { resolve(img); setTimeout(() => URL.revokeObjectURL(url), 1000); };
    img.onerror = () => { resolve(null); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

export async function gerarFichaPng(g, fotoBlob, estado) {
  const img = await carregarImagem(fotoBlob);
  const campos = [
    ["Produto", g.produto],
    g.loja && ["Loja", g.loja],
    ["Data de compra", dataCurta(g.dataCompra)],
    g.preco != null && ["Preço", `${eur(g.preco, 2)} €`],
    ["Estado do bem", g.estado === "usado" ? "Usado" : "Novo"],
    ["Garantia", `${g.meses} meses · até ${dataCurta(g.fim)} (${ROTULO_ESTADO[estado] || ""})`],
  ].filter(Boolean);

  const fotoAlt = img ? Math.min(1400, Math.round((img.height / img.width) * (L - 2 * M))) : 0;
  const altura = 200 + campos.length * 96 + (img ? fotoAlt + 60 : 0) + 230;

  const c = document.createElement("canvas");
  c.width = L;
  c.height = altura;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fbfaf6";
  ctx.fillRect(0, 0, L, altura);

  let y = M + 40;
  ctx.fillStyle = "#0b6b4f";
  ctx.font = "600 44px system-ui, sans-serif";
  ctx.fillText("Ficha de compra", M, y);
  y += 44;
  ctx.fillStyle = "#5c6b62";
  ctx.font = "26px system-ui, sans-serif";
  ctx.fillText("Garantia e talão — guardado com o PoupeJá", M, y);
  y += 56;

  for (const [rot, val] of campos) {
    ctx.fillStyle = "#5c6b62";
    ctx.font = "600 24px system-ui, sans-serif";
    ctx.fillText(rot.toUpperCase(), M, y);
    y += 38;
    ctx.fillStyle = "#14231c";
    ctx.font = "34px system-ui, sans-serif";
    ctx.fillText(linhas(ctx, val, L - 2 * M)[0] || "", M, y);
    y += 58;
  }

  if (img) {
    y += 10;
    const w = L - 2 * M;
    const h = fotoAlt;
    const escala = Math.min(w / img.width, h / img.height);
    const dw = img.width * escala, dh = img.height * escala;
    ctx.drawImage(img, M + (w - dw) / 2, y, dw, dh);
    y += h + 50;
  }

  ctx.fillStyle = "#5c6b62";
  ctx.font = "24px system-ui, sans-serif";
  const rodape = [
    "Para reclamar: Livro de Reclamações Eletrónico",
    LINKS_RECLAMACAO.livro,
    "Direitos do consumidor: Portal do Consumidor",
    LINKS_RECLAMACAO.portal,
  ];
  for (const l of rodape) { ctx.fillText(l, M, y); y += 36; }

  return new Promise((resolve, reject) => c.toBlob(b => (b ? resolve(b) : reject(new Error("Falha a gerar a imagem."))), "image/png"));
}
