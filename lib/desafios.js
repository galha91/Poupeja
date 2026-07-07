/*
 * Desafios PoupeJá — gamificação calculada 100% no cliente
 * a partir dos talões reais (localStorage poupeja_taloes).
 *
 * Mecânicas (inspiradas em Monzo 1p Challenge, Duolingo streaks):
 *  - Desafio do mês: rotativo, automático, com meta e tema sazonal
 *  - Sequência (streak): semanas consecutivas com talões guardados
 *  - Conquistas: badges desbloqueados por marcos reais
 *  - Partilha: textos prontos para WhatsApp (viral loop)
 */

export const DESAFIOS_MENSAIS = [
  { mes: 0,  nome: "Ano Novo, Carteira Cheia", emoji: "🎯", meta: 30, cor: "#7c3aed", dica: "Aproveita os saldos de janeiro só para o que precisas mesmo." },
  { mes: 1,  nome: "Fevereiro Poupado",        emoji: "💘", meta: 25, cor: "#e11d48", dica: "Mês curto, poupança rápida — compara folhetos antes de cada compra." },
  { mes: 2,  nome: "Operação Primavera",       emoji: "🌸", meta: 25, cor: "#16a34a", dica: "Os legumes da época custam menos e rendem mais." },
  { mes: 3,  nome: "Páscoa sem Estragos",      emoji: "🐣", meta: 30, cor: "#d97706", dica: "Compra o chocolate na semana a seguir à Páscoa — desce até 50%." },
  { mes: 4,  nome: "Maio a Render",            emoji: "🌞", meta: 25, cor: "#0891b2", dica: "Faz a lista antes de sair de casa. Quem leva lista gasta menos." },
  { mes: 5,  nome: "Junho dos Campeões",       emoji: "🏖️", meta: 25, cor: "#2563eb", dica: "As marcas brancas têm a mesma fábrica e metade do preço." },
  { mes: 6,  nome: "Férias Inteligentes",      emoji: "✈️", meta: 30, cor: "#0d9488", dica: "Antes das férias, gasta primeiro o que já tens na despensa." },
  { mes: 7,  nome: "Agosto sem Aperto",        emoji: "⛱️", meta: 30, cor: "#ea580c", dica: "Compra fruta da época — agosto é o mês mais barato do ano." },
  { mes: 8,  nome: "Regresso em Grande",       emoji: "🎒", meta: 35, cor: "#4f46e5", dica: "Material escolar: compara os folhetos, as diferenças chegam a 40%." },
  { mes: 9,  nome: "Outubro dos Descontos",    emoji: "🍂", meta: 25, cor: "#b45309", dica: "Guarda o talão de TODAS as compras — o que não se mede, não se poupa." },
  { mes: 10, nome: "Black November",           emoji: "🛍️", meta: 40, cor: "#0f172a", dica: "Na Black Friday, só é desconto se já querias comprar antes." },
  { mes: 11, nome: "Natal sem Dívidas",        emoji: "🎄", meta: 40, cor: "#b91c1c", dica: "Define o orçamento de presentes ANTES de entrar nas lojas." },
];

export function desafioDoMes(data = new Date()) {
  return DESAFIOS_MENSAIS[data.getMonth()];
}

export function diasRestantesNoMes(data = new Date()) {
  const ultimo = new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate();
  return ultimo - data.getDate();
}

function lerTaloes() {
  try {
    const taloes = JSON.parse(localStorage.getItem("poupeja_taloes") || "[]");
    return taloes.filter(t => t.tipo === "compra" && t.valorPoupado != null);
  } catch {
    return [];
  }
}

function dataDoTalao(t) {
  const raw = t.dataCompra || t.criadoEm;
  if (!raw) return null;
  const d = new Date(raw.length === 7 ? raw + "-01" : raw);
  return isNaN(d) ? null : d;
}

function chaveMes(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* Segunda-feira da semana de uma data (chave de semana p/ streak) */
function chaveSemana(d) {
  const seg = new Date(d);
  const dia = seg.getDay();
  seg.setDate(seg.getDate() - (dia === 0 ? 6 : dia - 1));
  seg.setHours(0, 0, 0, 0);
  return seg.getTime();
}

export function calcularEstado() {
  const taloes = lerTaloes();
  const agora = new Date();
  const mesAtual = chaveMes(agora);

  /* Totais por mês */
  const porMes = {};
  let totalGeral = 0;
  for (const t of taloes) {
    const d = dataDoTalao(t);
    if (!d) continue;
    const k = chaveMes(d);
    porMes[k] = (porMes[k] || 0) + t.valorPoupado;
    totalGeral += t.valorPoupado;
  }
  const totalMes = porMes[mesAtual] || 0;

  /* Streak: semanas consecutivas com >=1 talão, a contar para trás.
     A semana atual ainda em curso não quebra a sequência se vazia. */
  const semanas = new Set(taloes.map(t => { const d = dataDoTalao(t); return d ? chaveSemana(d) : null; }).filter(Boolean));
  const SEMANA_MS = 7 * 24 * 3600 * 1000;
  const semanaAtual = chaveSemana(agora);
  let streak = 0;
  let cursor = semanas.has(semanaAtual) ? semanaAtual : semanaAtual - SEMANA_MS;
  while (semanas.has(cursor)) {
    streak++;
    cursor -= SEMANA_MS;
  }

  /* Desafios mensais completados (meses passados + atual) */
  let desafiosCompletos = 0;
  for (const [k, v] of Object.entries(porMes)) {
    const mesIdx = parseInt(k.slice(5), 10) - 1;
    if (v >= DESAFIOS_MENSAIS[mesIdx].meta) desafiosCompletos++;
  }

  const desafio = desafioDoMes(agora);
  const progresso = Math.min(totalMes / desafio.meta, 1);

  /* Talões no mês atual */
  const taloesMes = taloes.filter(t => { const d = dataDoTalao(t); return d && chaveMes(d) === mesAtual; }).length;

  return {
    desafio,
    totalMes,
    totalGeral,
    progresso,
    completo: progresso >= 1,
    diasRestantes: diasRestantesNoMes(agora),
    streak,
    desafiosCompletos,
    nTaloes: taloes.length,
    taloesMes,
  };
}

/* Níveis de identidade (estilo "Waste Warriors" do Too Good To Go):
   dão estatuto, orgulho e motivo para partilhar. */
export const NIVEIS = [
  { min: 0,   nome: "Aprendiz",              emoji: "🌱" },
  { min: 10,  nome: "Caçador de Descontos",  emoji: "🎯" },
  { min: 50,  nome: "Poupador Pro",          emoji: "💪" },
  { min: 100, nome: "Mestre da Poupança",    emoji: "🧠" },
  { min: 250, nome: "Lenda do Talão",        emoji: "👑" },
];

export function nivelAtual(totalGeral) {
  let nivel = NIVEIS[0];
  for (const n of NIVEIS) if (totalGeral >= n.min) nivel = n;
  const idx = NIVEIS.indexOf(nivel);
  const proximo = NIVEIS[idx + 1] || null;
  return { ...nivel, proximo, idx };
}

export function calcularConquistas(estado) {
  const e = estado;
  return [
    { id: "primeiro",  emoji: "🐷", nome: "Primeiro Passo",    desc: "Guarda o 1.º talão",          feito: e.nTaloes >= 1 },
    { id: "cinco",     emoji: "🎯", nome: "Em Marcha",         desc: "5 talões guardados",          feito: e.nTaloes >= 5 },
    { id: "dez",       emoji: "💶", nome: "Primeira Dezena",   desc: "€10 poupados no total",       feito: e.totalGeral >= 10 },
    { id: "cinquenta", emoji: "💰", nome: "Meio Caminho",      desc: "€50 poupados no total",       feito: e.totalGeral >= 50 },
    { id: "cem",       emoji: "👑", nome: "Clube dos 100",     desc: "€100 poupados no total",      feito: e.totalGeral >= 100 },
    { id: "fogo",      emoji: "🔥", nome: "Em Chamas",         desc: "4 semanas seguidas",          feito: e.streak >= 4 },
    { id: "mesforte",  emoji: "⚡", nome: "Mês Forte",         desc: "€25 poupados num só mês",     feito: e.totalMes >= 25 || e.desafiosCompletos > 0 },
    { id: "campeao",   emoji: "🏆", nome: "Campeão do Mês",    desc: "Completa um desafio mensal",  feito: e.desafiosCompletos >= 1 },
  ];
}

/* ── Desafio das 52 Semanas ──
   O desafio de poupança mais famoso de Portugal: semana 1 → €1,
   semana 2 → €2 … semana 52 → €52. Total: €1.378 no fim do ano. */

const KEY_52 = "poupeja_desafio52";

export function lerDesafio52() {
  try {
    const semanas = new Set(JSON.parse(localStorage.getItem(KEY_52) || "[]"));
    let total = 0;
    for (const s of semanas) total += s;
    return { semanas, total, ativo: semanas.size > 0 };
  } catch {
    return { semanas: new Set(), total: 0, ativo: false };
  }
}

export function alternarSemana52(n) {
  const { semanas } = lerDesafio52();
  semanas.has(n) ? semanas.delete(n) : semanas.add(n);
  try { localStorage.setItem(KEY_52, JSON.stringify([...semanas])); } catch {}
  return lerDesafio52();
}

export function semanaDoAno(data = new Date()) {
  const inicio = new Date(data.getFullYear(), 0, 1);
  return Math.min(52, Math.ceil(((data - inicio) / 86400000 + inicio.getDay() + 1) / 7));
}

export async function partilharDesafio52(estado52) {
  const texto = `💶 Estou no Desafio das 52 Semanas no PoupeJá — já guardei €${estado52.total} de €1.378! Cada semana conta. Junta-te a mim (é grátis):`;
  return partilharTexto(texto);
}

/* ── Partilha (viral loop — otimizado para WhatsApp) ── */

const URL_APP = "https://poupeja.com";

export async function partilharDesafio(estado) {
  const { desafio, totalMes } = estado;
  const texto = estado.completo
    ? `${desafio.emoji} Completei o desafio "${desafio.nome}" do PoupeJá — poupei €${totalMes.toFixed(2)} nas compras este mês! 💪 Achas que consegues? Experimenta grátis:`
    : `${desafio.emoji} Estou no desafio "${desafio.nome}" do PoupeJá: poupar €${desafio.meta} nas compras este mês. Já vou em €${totalMes.toFixed(2)}! Junta-te a mim:`;
  return partilharTexto(texto);
}

export async function desafiarAmigo(estado) {
  const { desafio } = estado;
  const texto = `${desafio.emoji} Desafio-te! 😏 Este mês o objetivo é poupar €${desafio.meta} nas compras do supermercado. Eu já comecei — vê quem aguenta no PoupeJá (é grátis):`;
  return partilharTexto(texto);
}

export async function partilharConquista(conquista) {
  const texto = `${conquista.emoji} Acabei de desbloquear "${conquista.nome}" no PoupeJá! A poupar de verdade nas compras 🐷💚 Experimenta grátis:`;
  return partilharTexto(texto);
}

async function partilharTexto(texto) {
  try { const { evento } = await import("./analytics"); evento("share", { content_type: "desafio" }); } catch (_) {}
  if (typeof navigator === "undefined") return false;
  if (navigator.share) {
    try {
      await navigator.share({ title: "PoupeJá", text: texto, url: URL_APP });
      return "partilhado";
    } catch (e) {
      if (e?.name === "AbortError") return false;
    }
  }
  try {
    await navigator.clipboard.writeText(`${texto} ${URL_APP}`);
    return "copiado";
  } catch {}
  return false;
}
