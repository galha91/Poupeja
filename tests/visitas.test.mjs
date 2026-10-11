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
