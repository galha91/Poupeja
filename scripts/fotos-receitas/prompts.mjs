/*
 * Escreve os pedidos de imagem de todas as receitas sem fotografia em
 * scripts/fotos-receitas/prompts.json (id, nome, prompt). É o que se cola
 * no gerador de imagens, uma receita de cada vez ou em lote.
 *
 *   node scripts/fotos-receitas/prompts.mjs [--todas]
 */
import { writeFileSync } from "node:fs";
import { receitas } from "../../lib/receitas/motor.js";
import { promptDaFoto } from "../../lib/receitas/fotoPrompt.js";
import MANIFESTO from "../../data/fotos-receitas.json" with { type: "json" };

const todas = process.argv.includes("--todas");
const feitas = new Set(Object.keys(MANIFESTO.fotos || {}));
const lista = receitas().filter((r) => todas || !feitas.has(r.id)).map((r) => ({ id: r.id, nome: r.nome, prompt: promptDaFoto(r) }));
const destino = new URL("./prompts.json", import.meta.url);
writeFileSync(destino, JSON.stringify(lista, null, 2) + "\n");
console.log(`${lista.length} pedidos em scripts/fotos-receitas/prompts.json`);
