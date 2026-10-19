import { test } from "node:test";
import assert from "node:assert/strict";
import { construirFicha, SECOES, RESPOSTAS } from "../lib/fichaConvidado.js";

const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";

test("ficha de Lisboa, vinda do Instagram por etiqueta", () => {
  const f = construirFicha(
    { "x-vercel-ip-country": "PT", "x-vercel-ip-country-region": "11", "user-agent": iphone },
    { ref: "", o: "ig", entrada: "/combustiveis/lisboa?x=1", modo: "browser" },
  );
  assert.deepEqual(f, { origem: "instagram", regiao: "Lisboa", pais: "PT", dispositivo: "telemóvel", modo: "browser", entrada: "/combustiveis/lisboa", fora_pt: false });
});

test("fora de Portugal fica marcado e nada de URL ou valores estranhos", () => {
  const f = construirFicha(
    { "x-vercel-ip-country": "US", "user-agent": "Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile" },
    { ref: "https://www.google.com/search?q=gasoleo", entrada: "javascript:alert(1)", modo: "hack" },
  );
  assert.equal(f.fora_pt, true);
  assert.equal(f.origem, "google");
  assert.equal(f.regiao, "Estrangeiro");
  assert.equal(f.entrada, null);
  assert.equal(f.modo, null);
});

test("sem país conhecido não é marcado como fora", () => {
  assert.equal(construirFicha({}, {}).fora_pt, false);
});

test("listas fechadas de partes e respostas", () => {
  assert.ok(SECOES.has("mobilidade") && SECOES.has("ementas") && !SECOES.has("admin"));
  assert.ok(RESPOSTAS.has("instagram") && !RESPOSTAS.has("x"));
});
