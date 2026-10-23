// Utilitários partilhados pelos testes. Os testes correm contra uma base de
// dados REAL (frutabol_test) — é a única forma honesta de testar transações
// serializáveis e corridas de licitações.

import { prisma } from "../src/db.js";
import request from "supertest";
import { criarApp } from "../src/app.js";

export const app = criarApp();

export async function limparBd() {
  // ordem respeita as foreign keys
  for (const tabela of [
    "certificate", "purchase", "bid", "auction", "edition", "favorite",
    "referral", "coinTransaction", "webhookEvent", "coinPack", "character",
    "user", "config",
  ]) {
    await prisma[tabela].deleteMany();
  }
}

let contador = 0;
export async function registarUtilizador(extra = {}) {
  contador++;
  const agente = request.agent(app);
  const resposta = await agente.post("/api/auth/registo").send({
    email: `u${contador}-${Date.now()}@teste.pt`,
    nome: `tester${contador}${Date.now() % 100000}`,
    password: "password123",
    ...extra,
  });
  if (resposta.status !== 201) throw new Error(`Registo falhou: ${JSON.stringify(resposta.body)}`);
  return { agente, user: resposta.body.user };
}

export async function criarLeilaoDeTeste({ precoInicial = 100, incremento = 10, minutos = 10, compraImediata = null } = {}) {
  const personagem = await prisma.character.create({
    data: {
      nome: `Testildo${contador}-${Date.now()}`,
      clube: "FC Teste",
      descricao: "personagem de teste",
      estilo: "teste",
      raridade: "COMUM",
      tiragem: 10,
      imagem: "inexistente.svg",
    },
  });
  const edicao = await prisma.edition.create({ data: { characterId: personagem.id, numero: 1 } });
  return prisma.auction.create({
    data: {
      editionId: edicao.id,
      characterId: personagem.id,
      precoInicial,
      incrementoMinimo: incremento,
      compraImediata,
      inicio: new Date(Date.now() - 1000),
      fim: new Date(Date.now() + minutos * 60000),
      estado: "ATIVO",
    },
  });
}
