// Cliente da API. Em dev o Vite faz proxy de /api para o backend;
// em produção define VITE_API_URL (ex.: https://api.frutabol.pt).
const BASE = import.meta.env.VITE_API_URL || "";

export async function api(caminho, opcoes = {}) {
  const resposta = await fetch(`${BASE}/api${caminho}`, {
    credentials: "include",
    headers: opcoes.body instanceof FormData ? {} : { "Content-Type": "application/json" },
    ...opcoes,
    body:
      opcoes.body instanceof FormData
        ? opcoes.body
        : opcoes.body
          ? JSON.stringify(opcoes.body)
          : undefined,
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const erro = new Error(dados.erro || "Algo correu mal.");
    erro.detalhes = dados.detalhes;
    erro.status = resposta.status;
    throw erro;
  }
  return dados;
}

export const urlImagem = (caminho) => `${BASE}${caminho}`;
