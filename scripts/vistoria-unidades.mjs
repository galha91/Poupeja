// TEMPORÁRIO — vistoria de como cada supermercado vende cada tipo de produto.
// Corre no GitHub Actions (tem acesso aos sites). Remover depois.
import { register } from "node:module";
register("data:text/javascript," + encodeURIComponent(`
export async function resolve(s, c, n) { try { return await n(s, c); } catch (e) { if (s.startsWith(".")) return n(s + ".js", c); throw e; } }
`), import.meta.url);

const { pesquisarTudo } = await import("../lib/supermercados/index.js");

const TERMOS = [
  // fruta e legumes
  "laranja", "maçã", "banana", "pera", "uvas", "morangos", "limão", "abacate", "melancia", "ananás",
  "batata", "cebola", "alho", "tomate", "cenoura", "alface", "couve", "brócolos", "salsa", "coentros",
  "pimento", "curgete", "cogumelos", "espinafres", "pepino",
  // carne, peixe, charcutaria
  "frango", "peito de frango", "carne picada", "bife", "entrecosto", "fiambre", "chouriço", "salsichas",
  "bacalhau", "salmão", "pescada", "atum", "sardinha", "camarão",
  // laticínios e ovos
  "leite", "iogurte", "queijo", "queijo fatiado", "manteiga", "natas", "ovos",
  // mercearia
  "arroz", "esparguete", "feijão", "grão", "azeite", "óleo", "açúcar", "farinha", "sal", "café",
  "cápsulas café", "chá", "cereais", "bolachas", "chocolate", "pão", "pão de forma", "tostas", "mel", "compota",
  // bebidas
  "água", "sumo", "cerveja", "vinho", "coca-cola",
  // congelados
  "pizza", "gelado", "ervilhas", "douradinhos",
  // casa e higiene
  "papel higiénico", "rolo de cozinha", "guardanapos", "detergente roupa", "detergente loiça",
  "pastilhas máquina", "lixívia", "champô", "gel de banho", "pasta de dentes", "fraldas", "toalhitas",
  "sacos do lixo", "pilhas",
  // animais
  "ração cão", "areia gato",
  "hortelã", "manjericão", "ovos classe m", "leite sem lactose", "queijo fresco", "atum em azeite",
];

const corta = (s, n) => String(s ?? "").replace(/\s+/g, " ").slice(0, n);
const f = (n) => (n == null ? "—" : n.toFixed(2).replace(".", ","));

for (const q of TERMOS) {
  const r = await pesquisarTudo(q);
  const principais = r.produtos.filter((p) => p.relevancia === 2);
  const base = principais.length ? principais : r.produtos;
  const un = base[0]?.unidade;
  const comp = r.modo === "embalagem" ? base : base.filter((p) => p.unidade === un);
  const v = (p) => (r.modo === "embalagem" ? p.preco : p.precoUnidade);
  const melhores = {};
  for (const p of comp) if (!melhores[p.loja]) melhores[p.loja] = p;
  const falhas = r.lojas.filter((l) => !l.ok).map((l) => `${l.id}(${l.erro})`);
  await new Promise((ok) => setTimeout(ok, 1500));
  console.log(`\n### ${q}  [modo=${r.modo} un=${r.nomeUnidade} rel2=${principais.length}/${r.produtos.length}${falhas.length ? " FALHA:" + falhas : ""}]`);
  for (const l of r.lojas) {
    const p = melhores[l.id];
    console.log(`  ${l.nome.padEnd(10)} ${p ? `${f(v(p))} ${r.modo === "embalagem" ? "€" : "€/" + p.nomeUnidade}${p.aoPeso ? " (peso" + (p.precoPeca ? ", ≈" + f(p.precoPeca) + " cada" : "") + ")" : ""} | ${corta(p.nome, 45)} | ${corta(p.quantidade, 16)} | pago ${f(p.preco)}` : "—"}`);
  }
  const outros = r.produtos.filter((p) => p.relevancia !== 2).slice(0, 3).map((p) => corta(p.nome, 30));
  if (outros.length) console.log(`  relacionados: ${outros.join(" · ")}`);
}
