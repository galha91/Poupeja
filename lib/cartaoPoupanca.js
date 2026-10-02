import { eur } from "./formato";
import { DOMINIO_VISIVEL, linkPartilha } from "./site";
import { evento } from "./analytics";
import { TEXTO_COBERTURA } from "./cobertura";

/*
 * Cartão partilhável "Quanto poupei" — 1080×1920 (stories do Instagram,
 * TikTok, estados do WhatsApp), desenhado num canvas no próprio
 * dispositivo. Sem servidor, sem biblioteca: só é carregado quando
 * alguém toca em "Partilhar" (import dinâmico).
 *
 * Leva sempre a nota de que é uma estimativa e de que só conta os
 * supermercados comparados — a imagem circula sem a app à volta.
 */

const L = 1080;
const A = 1920;
const VERDE = "#0b6b4f";
const VERDE_ESCURO = "#08523c";
const CLARO = "#f6f5f0";
const SUAVE = "#a7cbbb";

async function fontesProntas() {
  try {
    await Promise.all([
      document.fonts.load('600 80px "Fraunces"'),
      document.fonts.load('500 40px "DM Sans"'),
      document.fonts.load('700 40px "DM Sans"'),
    ]);
  } catch {}
}

/* Quebra um texto em linhas que caibam na largura. */
function linhas(ctx, texto, largura) {
  const palavras = texto.split(" ");
  const out = [];
  let atual = "";
  for (const p of palavras) {
    const teste = atual ? `${atual} ${p}` : p;
    if (ctx.measureText(teste).width > largura && atual) { out.push(atual); atual = p; } else atual = teste;
  }
  if (atual) out.push(atual);
  return out;
}

export async function desenharCartao({ valor, periodo }) {
  await fontesProntas();
  const c = document.createElement("canvas");
  c.width = L; c.height = A;
  const ctx = c.getContext("2d");
  const serif = '"Fraunces", Georgia, serif';
  const sans = '"DM Sans", system-ui, sans-serif';

  // Fundo
  const g = ctx.createLinearGradient(0, 0, 0, A);
  g.addColorStop(0, VERDE);
  g.addColorStop(1, VERDE_ESCURO);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, L, A);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Marca
  ctx.fillStyle = CLARO;
  ctx.font = `600 64px ${serif}`;
  ctx.fillText("PoupeJá", L / 2, 220);
  ctx.fillStyle = SUAVE;
  ctx.font = `500 34px ${sans}`;
  ctx.fillText("A tua poupança nas compras", L / 2, 280);

  // Valor
  ctx.fillStyle = SUAVE;
  ctx.font = `500 46px ${sans}`;
  ctx.fillText(`Poupei ${periodo}`, L / 2, 760);

  const [inteiro, dec] = eur(valor, 2).split(",");
  ctx.font = `500 260px ${serif}`;
  const wInt = ctx.measureText(inteiro).width;
  ctx.font = `400 120px ${serif}`;
  const wEur = ctx.measureText("€").width + 18;
  const wDec = ctx.measureText(`,${dec}`).width;
  let x = L / 2 - (wEur + wInt + wDec) / 2;
  ctx.textAlign = "left";
  ctx.fillStyle = SUAVE;
  ctx.fillText("€", x, 1010);
  x += wEur;
  ctx.fillStyle = CLARO;
  ctx.font = `500 260px ${serif}`;
  ctx.fillText(inteiro, x, 1010);
  x += wInt;
  ctx.fillStyle = SUAVE;
  ctx.font = `400 120px ${serif}`;
  ctx.fillText(`,${dec}`, x, 1010);
  ctx.textAlign = "center";

  ctx.fillStyle = CLARO;
  ctx.font = `500 44px ${sans}`;
  ctx.fillText("ao escolher onde fazer as compras", L / 2, 1110);
  ctx.fillText("com a lista otimizada", L / 2, 1170);

  // Nota — pequena, mas lá
  ctx.fillStyle = SUAVE;
  ctx.font = `500 30px ${sans}`;
  const nota = `Poupança estimada face ao supermercado mais caro. ${TEXTO_COBERTURA.estimativa}`;
  linhas(ctx, nota, 860).forEach((t, i) => ctx.fillText(t, L / 2, 1600 + i * 42));

  // Endereço
  ctx.fillStyle = CLARO;
  ctx.font = `700 40px ${sans}`;
  ctx.fillText(DOMINIO_VISIVEL, L / 2, 1780);

  return new Promise((ok) => c.toBlob((b) => ok(b), "image/png"));
}

/*
 * Partilha nativa com a imagem (Android, iOS); sem suporte para
 * ficheiros, partilha o link; sem partilha nenhuma, descarrega a imagem.
 * Devolve "partilhado" | "descarregado" | "copiado" | false.
 */
export async function partilharCartao({ valor, periodo }) {
  evento("share", { content_type: "cartao_poupanca", periodo });
  const url = linkPartilha("/p", { v: "poupanca", valor: valor.toFixed(2) });
  const texto = `Poupei ${eur(valor, 2)} € ${periodo} nas compras com o PoupeJá (estimativa). Experimenta grátis:`;
  const blob = await desenharCartao({ valor, periodo });
  const ficheiro = blob ? new File([blob], "poupeja-poupanca.png", { type: "image/png" }) : null;

  if (ficheiro && navigator.canShare?.({ files: [ficheiro] })) {
    try {
      await navigator.share({ files: [ficheiro], text: `${texto} ${url}` });
      return "partilhado";
    } catch (e) {
      if (e?.name === "AbortError") return false;
    }
  }
  if (navigator.share) {
    try {
      await navigator.share({ title: "PoupeJá", text: texto, url });
      return "partilhado";
    } catch (e) {
      if (e?.name === "AbortError") return false;
    }
  }
  if (blob) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "poupeja-poupanca.png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    try { await navigator.clipboard.writeText(`${texto} ${url}`); } catch {}
    return "descarregado";
  }
  return false;
}
