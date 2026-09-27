// TEMPORÁRIO — vistoria de como cada supermercado vende cada tipo de produto.
// Corre no GitHub Actions (tem acesso aos sites). Remover depois.
import { register } from "node:module";
register("data:text/javascript," + encodeURIComponent(`
export async function resolve(s, c, n) { try { return await n(s, c); } catch (e) { if (s.startsWith(".")) return n(s + ".js", c); throw e; } }
`), import.meta.url);

const { LOJAS, palavras, relevancia } = await import("../lib/supermercados/index.js");
const { completarUnidade } = await import("../lib/supermercados/comum.js");

const TERMOS_NOMES = ["frango", "esparguete", "coca-cola", "ananás", "compota", "chocolate", "queijo fatiado", "ração cão", "massa", "iogurte natural", "pão", "leite", "laranja", "salsa", "atum"];
const TERMOS = TERMOS_NOMES.length ? [] : [
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
];

const corta = (s, n) => String(s ?? "").replace(/\s+/g, " ").slice(0, n);

for (const q of TERMOS_NOMES) {
  const termos = palavras(q);
  console.log(`\n### ${q}`);
  const res = await Promise.allSettled(LOJAS.slice(0, 3).map((l) => l.pesquisar(q)));
  res.forEach((r, i) => {
    if (r.status === "rejected") return;
    console.log(`  ${LOJAS[i].nome}:`);
    for (const p of r.value.slice(0, 12)) console.log(`    ${relevancia(p.nome, termos)} ${corta(p.nome, 60)} | ${corta(p.categoria, 40)}`);
  });
}

for (const q of TERMOS) {
  const termos = palavras(q);
  console.log(`\n### ${q}`);
  const res = await Promise.allSettled(LOJAS.map((l) => l.pesquisar(q)));
  res.forEach((r, i) => {
    const loja = LOJAS[i];
    if (r.status === "rejected") { console.log(`  ${loja.nome}: ERRO ${r.reason?.message}`); return; }
    const rel = r.value.filter((p) => p?.nome && p.preco > 0 && relevancia(p.nome, termos) === 2).map(completarUnidade);
    const cont = {};
    for (const p of rel) cont[p.unidade] = (cont[p.unidade] || 0) + 1;
    console.log(`  ${loja.nome}: ${r.value.length} res, ${rel.length} rel, unidades ${JSON.stringify(cont)}`);
    for (const p of rel.slice(0, 5)) {
      console.log(`    - ${corta(p.nome, 48)} | q=${corta(p.quantidade, 18)} | ${p.preco} | ${p.precoUnidade}/${p.unidade} | rot=${corta(p.rotuloUnidade, 40)} | cat=${corta(p.categoria, 45)}`);
    }
  });
}
