// Seed: 6 personagens ORIGINAIS (nomes e clubes inventados de raiz, cores
// que não imitam equipamentos reais) + imagens placeholder SVG geradas aqui
// mesmo + um leilão ativo por personagem + packs de moedas de exemplo.
//
// Correr com: npm run db:seed

import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();
const PASTA_UPLOADS = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "uploads");

const PERSONAGENS = [
  {
    nome: "Bananildo", clube: "FC Pomar", raridade: "LENDARIO", tiragem: 20,
    estilo: "avançado veloz, remate curvo de trivela",
    descricao: "A lenda amarela do FC Pomar. Dizem que nunca escorregou na própria casca. Ídolo máximo da Curva do Pomar.",
    fruta: "🍌", corA: "#12b5a2", corB: "#083d38", pele: "#ffd93b",
  },
  {
    nome: "Mandiocudo", clube: "Sporting Quintal", raridade: "EPICO", tiragem: 40,
    estilo: "médio-defensivo raçudo, rei do carrinho limpo",
    descricao: "Raiz forte do meio-campo do Sporting Quintal. Ganha todas as segundas bolas e nunca perde a cabeça (nem a casca).",
    fruta: "🥔", corA: "#e2543e", corB: "#3c1f63", pele: "#c8a06a",
  },
  {
    nome: "Peraldo", clube: "Real Laranjal", raridade: "RARO", tiragem: 60,
    estilo: "central elegante, saída de bola de veludo",
    descricao: "O defesa mais elegante do Real Laranjal. Sai a jogar com classe e nunca amassa a fruta adversária.",
    fruta: "🍐", corA: "#f2b705", corB: "#144b7f", pele: "#b9d84b",
  },
  {
    nome: "Kiwito", clube: "Atlético Vergel", raridade: "RARO", tiragem: 60,
    estilo: "extremo pequenino, drible felpudo em curto espaço",
    descricao: "Pequeno, felpudo e impossível de agarrar. O Atlético Vergel construiu a equipa toda à volta dele.",
    fruta: "🥝", corA: "#7ac74f", corB: "#241d4f", pele: "#8bc34a",
  },
  {
    nome: "Abacatino", clube: "União do Bosque", raridade: "COMUM", tiragem: 100,
    estilo: "guarda-redes zen, reflexos de manteiga… no bom sentido",
    descricao: "O guardião mais calmo da liga. Entre os postes da União do Bosque, nada o tira do sério — tem um caroço no lugar do coração.",
    fruta: "🥑", corA: "#ff8c42", corB: "#20524f", pele: "#7a9f35",
  },
  {
    nome: "Romãzinha", clube: "Estrela da Horta", raridade: "EPICO", tiragem: 40,
    estilo: "capitã criativa, passes que rebentam em cem hipóteses",
    descricao: "Capitã da Estrela da Horta. Cada passe dela abre o jogo em cem sementes de golo. Braçadeira e coroa — literalmente.",
    fruta: "🍈", corA: "#d81e5b", corB: "#f4d35e", pele: "#e05263",
  },
];

// Placeholder SVG: mascote-fruta com camisola às riscas de um clube fictício.
// Em produção o admin substitui por arte final PNG de alta resolução.
function svgPersonagem(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <defs>
    <linearGradient id="fundo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.corB}"/><stop offset="1" stop-color="#0b0b14"/>
    </linearGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#fundo)"/>
  <circle cx="400" cy="330" r="220" fill="${p.pele}"/>
  <circle cx="330" cy="290" r="26" fill="#101014"/><circle cx="470" cy="290" r="26" fill="#101014"/>
  <circle cx="338" cy="282" r="8" fill="#fff"/><circle cx="478" cy="282" r="8" fill="#fff"/>
  <path d="M320 380 Q400 450 480 380" stroke="#101014" stroke-width="14" fill="none" stroke-linecap="round"/>
  <rect x="220" y="540" width="360" height="300" rx="40" fill="${p.corA}"/>
  <rect x="280" y="540" width="60" height="300" fill="${p.corB}" opacity="0.85"/>
  <rect x="400" y="540" width="60" height="300" fill="${p.corB}" opacity="0.85"/>
  <circle cx="400" cy="640" r="46" fill="#ffffff" opacity="0.92"/>
  <text x="400" y="656" font-family="Georgia, serif" font-size="40" font-weight="bold" text-anchor="middle" fill="${p.corB}">${p.clube.split(" ").map((w) => w[0]).join("")}</text>
  <text x="400" y="930" font-family="Georgia, serif" font-size="56" font-weight="bold" text-anchor="middle" fill="#ffffff">${p.nome}</text>
  <text x="400" y="972" font-family="Georgia, serif" font-size="28" text-anchor="middle" fill="#ffffffaa">${p.clube} · ${p.raridade}</text>
</svg>`;
}

async function main() {
  fs.mkdirSync(PASTA_UPLOADS, { recursive: true });

  for (const p of PERSONAGENS) {
    const ficheiro = `seed-${p.nome.toLowerCase()}.svg`;
    fs.writeFileSync(path.join(PASTA_UPLOADS, ficheiro), svgPersonagem(p));

    const personagem = await prisma.character.upsert({
      where: { nome: p.nome },
      update: {},
      create: {
        nome: p.nome, clube: p.clube, descricao: p.descricao, estilo: p.estilo,
        raridade: p.raridade, tiragem: p.tiragem, imagem: ficheiro,
      },
    });

    // um leilão ativo por personagem (se ainda não tiver nenhum)
    const jaTem = await prisma.auction.count({ where: { characterId: personagem.id } });
    if (!jaTem) {
      const edicao = await prisma.edition.create({
        data: { characterId: personagem.id, numero: 1 },
      });
      const base = { LENDARIO: 800, EPICO: 400, RARO: 200, COMUM: 80 }[p.raridade];
      await prisma.auction.create({
        data: {
          editionId: edicao.id,
          characterId: personagem.id,
          precoInicial: base,
          incrementoMinimo: Math.max(5, Math.round(base * 0.05)),
          compraImediata: base * 5,
          inicio: new Date(),
          fim: new Date(Date.now() + (12 + Math.random() * 36) * 3600 * 1000),
          estado: "ATIVO",
        },
      });
    }
  }

  // packs de exemplo (só aparecem com PAYMENTS_ENABLED=true)
  if ((await prisma.coinPack.count()) === 0) {
    await prisma.coinPack.createMany({
      data: [
        { nome: "Cesto Pequeno", moedas: 100, precoCents: 499 },
        { nome: "Cesto Médio", moedas: 250, precoCents: 999 },
        { nome: "Carrinho de Feira", moedas: 700, precoCents: 2499 },
      ],
    });
  }

  console.log("🌱 Seed concluído: 6 personagens, leilões ativos e packs de exemplo.");
}

main().finally(() => prisma.$disconnect());
