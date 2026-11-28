import { INGREDIENTES } from "./receitas/ingredientes.js";
import { formatarQtd } from "./receitas/motor.js";

/*
 * Receita a partir de um vídeo (TikTok) ou de um texto colado.
 *
 * A pessoa partilha o vídeo do TikTok para o PoupeJá (share_target do
 * manifest) ou cola o link; do Instagram, YouTube ou de um blog cola o
 * texto da descrição. O servidor lê a legenda do TikTok pelo oEmbed
 * público (um pedido pequeno, sem chave), o Haiku arruma-a numa receita
 * e os ingredientes ficam ligados ao dicionário das receitas
 * (lib/receitas/ingredientes.js): assim entram na lista de compras com o
 * nome do catálogo e a comparação de preços reconhece-os.
 *
 * Aqui só há funções puras (testadas em tests/receitaVideo.test.mjs); a
 * chamada ao modelo está em pages/api/receita-video.js.
 */

export const MAX_TEXTO = 5000;
const MAX_INGREDIENTES = 40;
const MAX_PASSOS = 15;
const UNIDADES = new Set(Object.values(INGREDIENTES).map((i) => i.u));

// Só estes anfitriões: o servidor nunca vai buscar um URL qualquer.
const HOSTS_TIKTOK = new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"]);

/* O primeiro link de um texto partilhado ("Vê este vídeo… https://vm.tiktok.com/x/"). */
export function primeiroLink(texto) {
  const m = String(texto || "").match(/https?:\/\/[^\s<>"']+/i);
  return m ? m[0].replace(/[).,;!?]+$/, "") : null;
}

/* "tiktok" | "instagram" | "youtube" | "outro" | null (não é link). */
export function fonteDoLink(link) {
  let u;
  try { u = new URL(link); } catch { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const h = u.hostname.toLowerCase();
  if (HOSTS_TIKTOK.has(h)) return "tiktok";
  if (h === "instagram.com" || h.endsWith(".instagram.com")) return "instagram";
  if (h === "youtu.be" || h === "youtube.com" || h.endsWith(".youtube.com")) return "youtube";
  return "outro";
}

/* O link do TikTok normalizado (https, sem parâmetros de rastreio), ou null. */
export function linkTikTok(link) {
  if (fonteDoLink(link) !== "tiktok") return null;
  const u = new URL(link);
  return `https://${u.hostname.toLowerCase()}${u.pathname}`;
}

/* As linhas do dicionário que o modelo pode usar: "chave | Nome | unidade". */
export function dicionarioParaPrompt() {
  return Object.entries(INGREDIENTES).map(([k, i]) => `${k} | ${i.nome} | ${i.u}`).join("\n");
}

const ABERTURA = {
  texto: "Este texto é a descrição de um vídeo, de uma publicação ou de uma página com uma receita.",
  imagem: "Esta fotografia mostra uma receita (de um livro, de uma revista, de um caderno ou de um ecrã).",
};

/* O pedido ao modelo; sem `texto`, é para a fotografia que segue na mesma mensagem. */
export function promptReceita(texto = null) {
  return `${texto == null ? ABERTURA.imagem : ABERTURA.texto} Transforma-a numa receita para uma app portuguesa de poupança.

Devolve APENAS JSON válido, sem markdown:
{"receita":true,"titulo":"Salmão no forno com batatas","porcoes":4,"tempoMin":45,"ingredientes":[{"key":"salmao","q":600},{"key":"batata","q":600},{"key":null,"nome":"Molho de soja","q":2,"u":"c. sopa"}],"passos":["Pré-aquece o forno a 200 °C.","…"],"trocas":[{"de":"salmao","para":"pescada"}]}

Regras:
- Se o texto não tiver uma receita (só ingredientes soltos sem prato, publicidade, outro tema), devolve {"receita":false}.
- titulo: o nome do prato em português de Portugal, curto (até 60 caracteres), sem emojis nem hashtags.
- porcoes: as indicadas; se não houver, estima (1 a 12).
- tempoMin: o tempo total em minutos, se der para saber; senão null.
- ingredientes: para cada um, escolhe a chave do DICIONÁRIO abaixo que é o mesmo produto e dá "q" na unidade do dicionário (converte: 1 kg = 1000 g; uma lata, um dente, um molho = 1). Usa "q":0 para "q.b.".
- Se um ingrediente não estiver no dicionário, usa "key":null com "nome" (português de Portugal) e "u" numa destas unidades: ${[...UNIDADES].join(", ")}.
- Não inventes ingredientes nem quantidades que o texto não dá: sem quantidade, estima uma quantidade normal para as porções.
- passos: curtos, por palavras tuas (não copies o texto), no imperativo e tratando por "tu"; até ${MAX_PASSOS}. Se não houver passos, escreve os passos óbvios a partir dos ingredientes e do título, no máximo 6.
- trocas: até 3 trocas que tornam o prato mais barato sem o estragar, de um ingrediente da receita ("de") para outro do DICIONÁRIO ("para") que se usa na mesma quantidade e unidade (ex.: salmão → pescada, pinhões → nozes, natas → leite). Só chaves do dicionário. Se não houver trocas sensatas, [].

DICIONÁRIO (chave | nome | unidade):
${dicionarioParaPrompt()}
${texto == null ? "" : `
TEXTO:
"""
${String(texto).slice(0, MAX_TEXTO)}
"""`}`;
}

const texto = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");
const numero = (v, min, max) => (Number.isFinite(Number(v)) && Number(v) >= min && Number(v) <= max ? Number(v) : null);

/*
 * A resposta do modelo, já verificada, no formato dos ingredientes do
 * motor das receitas (key, q, u, nome, compra, despensa, qtd): assim a
 * página usa os mesmos componentes e o mesmo caminho para a lista.
 * Devolve null se não houver receita aproveitável.
 */
export function limparReceita(dados) {
  if (!dados || typeof dados !== "object" || dados.receita === false) return null;
  const porcoes = Math.round(numero(dados.porcoes, 1, 20) || 4);
  const ingredientes = [];
  const vistos = new Set();
  for (const bruto of Array.isArray(dados.ingredientes) ? dados.ingredientes.slice(0, MAX_INGREDIENTES) : []) {
    if (!bruto || typeof bruto !== "object") continue;
    const ing = typeof bruto.key === "string" ? INGREDIENTES[bruto.key] : null;
    if (ing) {
      if (vistos.has(bruto.key)) continue;
      vistos.add(bruto.key);
      const q = ing.u === "q.b." ? 0 : numero(bruto.q, 0, 20000) ?? 0;
      const u = q > 0 ? ing.u : "q.b.";
      ingredientes.push({ key: bruto.key, q, u, nome: ing.nome, compra: ing.compra, despensa: !!ing.desp, rotulo: !!ing.rot, qtd: formatarQtd(q, u) });
      continue;
    }
    const nome = texto(bruto.nome, 60);
    if (!nome) continue;
    const chave = `livre:${nome.toLowerCase()}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    const q = numero(bruto.q, 0, 20000) ?? 0;
    const u = q > 0 && UNIDADES.has(bruto.u) ? bruto.u : "q.b.";
    ingredientes.push({ key: chave, q: u === "q.b." ? 0 : q, u, nome, compra: null, despensa: false, rotulo: false, qtd: formatarQtd(q, u) });
  }
  if (!ingredientes.length) return null;
  const passos = (Array.isArray(dados.passos) ? dados.passos : []).map((p) => texto(p, 300)).filter(Boolean).slice(0, MAX_PASSOS);
  const naReceita = new Set(ingredientes.map((i) => i.key));
  const trocas = [];
  for (const t of Array.isArray(dados.trocas) ? dados.trocas.slice(0, 3) : []) {
    const de = INGREDIENTES[t?.de], para = INGREDIENTES[t?.para];
    if (!de || !para || t.de === t.para || !naReceita.has(t.de) || naReceita.has(t.para)) continue;
    if (de.u !== para.u || !para.compra) continue; // mesma quantidade, mesma unidade
    trocas.push({ de: t.de, para: t.para, nomeDe: de.nome, nomePara: para.nome, compraPara: para.compra });
  }
  return {
    titulo: texto(dados.titulo, 80) || "Receita importada",
    porcoes,
    un: "pessoas",
    tempoMin: numero(dados.tempoMin, 1, 600),
    ingredientes,
    passos,
    trocas,
  };
}

/*
 * Custo estimado com os preços de hoje (custoReceita de lib/seoPrecos) e a
 * poupança de cada troca. `custoReceita` vem por argumento para este
 * ficheiro não puxar o catálogo inteiro para o browser.
 * Uma troca só fica se houver preço dos dois lados e poupar 0,30 € ou mais.
 */
export function comCustos(receita, resumos, custoReceita) {
  if (!receita || !resumos) return { ...receita, custo: null, trocas: [] };
  const base = custoReceita(receita.ingredientes, resumos);
  const total = base.total;
  const trocas = [];
  for (const t of receita.trocas || []) {
    if (!(total > 0)) break;
    const novo = receita.ingredientes.map((i) => (i.key === t.de ? { ...i, key: t.para, nome: INGREDIENTES[t.para].nome, compra: INGREDIENTES[t.para].compra } : i));
    const c = custoReceita(novo, resumos);
    if (c.total > 0 && c.comPreco >= base.comPreco && total - c.total >= 0.3) trocas.push({ ...t, poupa: Math.round((total - c.total) * 100) / 100 });
  }
  const custo = total > 0 ? { total, comPreco: base.comPreco, contados: base.contados } : null;
  return { ...receita, custo, trocas };
}

/* O JSON da resposta do modelo, mesmo com texto à volta; null se não houver. */
export function jsonDaResposta(resposta) {
  const m = String(resposta || "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

/* Do oEmbed do TikTok só se guarda o que se mostra: legenda, autor e link do autor. */
export function dadosOembed(json) {
  if (!json || typeof json !== "object") return null;
  const legenda = typeof json.title === "string" ? json.title.slice(0, MAX_TEXTO) : "";
  const autor = texto(json.author_name, 60);
  let autorUrl = null;
  try {
    const u = new URL(json.author_url);
    if (u.protocol === "https:" && HOSTS_TIKTOK.has(u.hostname)) autorUrl = u.href;
  } catch {}
  return legenda ? { legenda, autor, autorUrl } : null;
}
