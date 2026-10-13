import { test } from "node:test";
import assert from "node:assert/strict";
import { montarPedido, CHAVE_INDEXNOW } from "../lib/indexnow.js";
import { readFileSync } from "node:fs";

test("corpo do pedido com host em punycode, chave e URLs absolutos sem repetidos", () => {
  const p = montarPedido("https://xn--poupej-uta.com", ["/combustiveis", "/combustiveis", "/combustiveis/distrito/braga"]);
  assert.equal(p.host, "xn--poupej-uta.com");
  assert.equal(p.key, CHAVE_INDEXNOW);
  assert.equal(p.keyLocation, `https://xn--poupej-uta.com/${CHAVE_INDEXNOW}.txt`);
  assert.deepEqual(p.urlList, ["https://xn--poupej-uta.com/combustiveis", "https://xn--poupej-uta.com/combustiveis/distrito/braga"]);
});

test("o ficheiro da chave existe em public/ e tem só a chave", () => {
  assert.equal(readFileSync(new URL(`../public/${CHAVE_INDEXNOW}.txt`, import.meta.url), "utf8"), CHAVE_INDEXNOW);
});
