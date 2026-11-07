/*
 * Ganchos do carregador de módulos do Node para correr código de pages/api
 * e lib fora do Next (nos GitHub Actions). O Next aceita imports sem
 * extensão ("../../lib/site") e JSON sem atributos; o Node não. Aqui
 * resolve-se como o Next: tenta .js, .mjs e /index.js.
 */
import { existsSync, statSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const EXTENSOES = [".js", ".mjs", "/index.js"];
const ehFicheiro = (p) => existsSync(p) && statSync(p).isFile();

export async function resolve(especificador, contexto, seguinte) {
  const relativo = especificador.startsWith("./") || especificador.startsWith("../");
  if (relativo && contexto.parentURL?.startsWith("file:")) {
    const base = fileURLToPath(new URL(especificador, contexto.parentURL));
    if (!ehFicheiro(base)) {
      for (const ext of EXTENSOES) {
        if (ehFicheiro(base + ext)) return { url: pathToFileURL(base + ext).href, shortCircuit: true };
      }
    }
  }
  return seguinte(especificador, contexto);
}

export async function load(url, contexto, seguinte) {
  // JSON importado sem `with { type: "json" }`, como o Next permite.
  if (url.startsWith("file:") && url.endsWith(".json")) {
    const texto = readFileSync(fileURLToPath(url), "utf8");
    return { format: "module", source: `export default ${texto};`, shortCircuit: true };
  }
  return seguinte(url, contexto);
}
