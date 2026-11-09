/*
 * Contador do tráfego que sai do Supabase para o servidor (egress).
 *
 * O plano grátis do Supabase dá 5 GB por mês e em novembro de 2026 passou
 * de 30 GB sem ninguém dar por isso: as páginas /produto e /marca
 * descarregavam o catálogo inteiro centenas de vezes por dia. O Supabase
 * não dá estes números por API, por isso contamos nós: cada resposta que o
 * cliente admin (lib/supabaseAdmin) recebe soma os seus bytes à tabela de
 * onde veio, por dia. O cron-resumo-admin avisa por email quando o ritmo
 * passa do orçamento (ORCAMENTO_DIA_BYTES).
 *
 * Conta o corpo já descomprimido, por isso é um teto: o Supabase pode
 * contar menos (resposta comprimida). Os pedidos feitos pelo browser (com a
 * chave anon) não passam aqui; são poucos e pequenos.
 *
 * Os totais ficam em memória e vão para a base de dados em lote
 * (registar_consumo): logo que se juntem LIMITE_BYTES ou passem
 * INTERVALO_MS. Uma instância congelada pode perder o último lote; para um
 * aviso de tendência, chega.
 */

// 5,5 GB por mês é o limite que o Supabase deu; 150 MB/dia deixa margem.
export const ORCAMENTO_DIA_BYTES = 150 * 1024 * 1024;
const LIMITE_BYTES = 256 * 1024;
const INTERVALO_MS = 5 * 60 * 1000;
const RPC = "registar_consumo";

let pendentes = new Map(); // "dia|tabela" -> { dia, tabela, bytes, pedidos }
let porEnviar = 0;
let ultimoEnvio = Date.now();
let aEnviar = null;

const diaUtc = () => new Date().toISOString().slice(0, 10);

/* "/rest/v1/produtos_marca?select=…" -> "produtos_marca"; RPC -> "rpc:nome". */
export function tabelaDoPedido(url) {
  try {
    const { pathname } = new URL(url);
    const m = pathname.match(/\/rest\/v1\/(rpc\/)?([A-Za-z0-9_]+)/);
    if (m) return m[1] ? `rpc:${m[2]}` : m[2];
    const outro = pathname.match(/\/(auth|storage|functions)\/v1\//);
    return outro ? outro[1] : null;
  } catch {
    return null;
  }
}

export function contar(tabela, bytes) {
  if (!tabela || !(bytes >= 0)) return;
  const dia = diaUtc();
  const k = `${dia}|${tabela}`;
  const a = pendentes.get(k) || { dia, tabela, bytes: 0, pedidos: 0 };
  a.bytes += bytes;
  a.pedidos += 1;
  pendentes.set(k, a);
  porEnviar += bytes;
}

/* Envia o que está pendente. Nunca lança: o contador não pode partir nada. */
export async function enviarConsumo(fetchOriginal, url, chave) {
  if (!pendentes.size || aEnviar) return aEnviar;
  const itens = [...pendentes.values()];
  pendentes = new Map();
  porEnviar = 0;
  ultimoEnvio = Date.now();
  aEnviar = fetchOriginal(`${url}/rest/v1/rpc/${RPC}`, {
    method: "POST",
    headers: { apikey: chave, authorization: `Bearer ${chave}`, "content-type": "application/json" },
    body: JSON.stringify({ p_itens: itens }),
  }).then(() => {}, () => {}).finally(() => { aEnviar = null; });
  return aEnviar;
}

/* fetch para o createClient: conta os bytes de cada resposta. */
export function fetchContado(url, chave, fetchOriginal = globalThis.fetch) {
  return async function fetchComConta(input, init) {
    const res = await fetchOriginal(input, init);
    const destino = typeof input === "string" ? input : input?.url;
    const tabela = tabelaDoPedido(destino);
    if (tabela && tabela !== `rpc:${RPC}`) {
      try {
        const corpo = await res.clone().arrayBuffer();
        contar(tabela, corpo.byteLength);
      } catch {}
      if (porEnviar >= LIMITE_BYTES || Date.now() - ultimoEnvio >= INTERVALO_MS) {
        // Espera-se pelo registo (raro: a cada 256 KB ou 5 min), para não se
        // perder numa instância que a Vercel congele logo a seguir.
        await enviarConsumo(fetchOriginal, url, chave);
      }
    }
    return res;
  };
}

/* Para scripts (GitHub Actions): enviar o que falta antes de sair. */
export async function terminarConsumo() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && chave) await enviarConsumo(globalThis.fetch, url, chave);
}

/* Só para testes. */
export function _estado() {
  return { pendentes: [...pendentes.values()], porEnviar };
}

const MB = 1024 * 1024;
const mb = (b) => `${Math.round(b / MB)} MB`;

/*
 * Avisos para o cron-resumo-admin. linhas: [{ dia, tabela, bytes }] dos
 * últimos 30 dias; ontem: "AAAA-MM-DD" (UTC). Avisa quando ontem passou do
 * orçamento diário ou quando o mês leva caminho de passar os 5 GB.
 */
export function avaliarConsumo(linhas, ontem) {
  const avisos = [];
  const deOntem = (linhas || []).filter((l) => l.dia === ontem);
  const totalOntem = deOntem.reduce((s, l) => s + Number(l.bytes || 0), 0);
  const total30 = (linhas || []).reduce((s, l) => s + Number(l.bytes || 0), 0);
  if (totalOntem > ORCAMENTO_DIA_BYTES) {
    const top = [...deOntem].sort((a, b) => b.bytes - a.bytes).slice(0, 3).map((l) => `${l.tabela} ${mb(l.bytes)}`).join(", ");
    avisos.push(`Tráfego do Supabase ontem: ${mb(totalOntem)} (orçamento ${mb(ORCAMENTO_DIA_BYTES)}/dia, para caber nos 5,5 GB/mês do plano grátis). Maiores: ${top}.`);
  }
  if (total30 > 4.5 * 1024 * MB) {
    avisos.push(`Tráfego do Supabase nos últimos 30 dias: ${mb(total30)}. O plano grátis aceita 5,5 GB; está perto do limite.`);
  }
  return avisos;
}
