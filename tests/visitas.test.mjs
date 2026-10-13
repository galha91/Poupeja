import { test } from "node:test";
import assert from "node:assert/strict";
import { caminhoValido, eBot, classificarOrigem } from "../lib/visitas.js";

test("caminhos: tira query, barra final e maiúsculas", () => {
  assert.equal(caminhoValido("/Combustiveis/Braga/?x=1#a"), "/combustiveis/braga");
  assert.equal(caminhoValido("/"), "/");
});
test("caminhos: recusa admin, api e lixo", () => {
  assert.equal(caminhoValido("/admin"), null);
  assert.equal(caminhoValido("/api/x"), null);
  assert.equal(caminhoValido("//evil.com"), null);
  assert.equal(caminhoValido("/a b"), null);
  assert.equal(caminhoValido("/" + "a".repeat(100)), null);
  assert.equal(caminhoValido(5), null);
});
test("bots", () => {
  assert.equal(eBot("Googlebot/2.1"), true);
  assert.equal(eBot(""), true);
  assert.equal(eBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari"), false);
});
test("origens", () => {
  const eu = "xn--poupej-uta.com";
  assert.equal(classificarOrigem("", eu), "direto");
  assert.equal(classificarOrigem("interno", eu), "interno");
  assert.equal(classificarOrigem("https://www.google.com/", eu), "google");
  assert.equal(classificarOrigem("https://l.facebook.com/l.php?u=1", eu), "facebook");
  assert.equal(classificarOrigem("https://www.instagram.com/", eu), "instagram");
  assert.equal(classificarOrigem("https://xn--poupej-uta.com/x", eu), "interno");
  assert.equal(classificarOrigem("https://exemplo.pt/", eu), "outro");
  assert.equal(classificarOrigem("android-app://com.google.android.googlequicksearchbox", eu), "google");
});

test("etiquetas nos links", async () => {
  const { origemEtiqueta } = await import("../lib/visitas.js");
  assert.equal(origemEtiqueta("fb"), "facebook");
  assert.equal(origemEtiqueta("IG"), "instagram");
  assert.equal(origemEtiqueta("xpto"), null);
  assert.equal(origemEtiqueta(undefined), null);
});

import { regiaoDe, tipoDispositivo, modoValido, recorrenciaValida } from "../lib/visitas.js";
test("região: distrito, estrangeiro, desconhecida", () => {
  assert.equal(regiaoDe("PT", "11"), "Lisboa");
  assert.equal(regiaoDe("PT", "PT-13"), "Porto");
  assert.equal(regiaoDe("PT", "99"), "Portugal (outra)");
  assert.equal(regiaoDe("ES", "M"), "Estrangeiro");
  assert.equal(regiaoDe(undefined, undefined), "Desconhecida");
});
test("aparelho", () => {
  assert.equal(tipoDispositivo("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari"), "telemóvel");
  assert.equal(tipoDispositivo("Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari"), "telemóvel");
  assert.equal(tipoDispositivo("Mozilla/5.0 (Linux; Android 14; SM-X900) Safari"), "tablet");
  assert.equal(tipoDispositivo("Mozilla/5.0 (iPad; CPU OS 17_0) Safari"), "tablet");
  assert.equal(tipoDispositivo("Mozilla/5.0 (Windows NT 10.0) Chrome"), "computador");
});
test("modo e recorrência: só valores conhecidos", () => {
  assert.equal(modoValido("pwa"), "pwa");
  assert.equal(modoValido("x"), null);
  assert.equal(recorrenciaValida("novo"), "novo");
  assert.equal(recorrenciaValida("<script>"), null);
});
