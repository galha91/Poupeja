import { test } from "node:test";
import assert from "node:assert/strict";
import { mostrarIRS } from "../lib/atalhos.js";

test("IRS no Início: abril a junho, ou para quem já simulou", () => {
  assert.equal(mostrarIRS(new Date(2026, 3, 1)), true);   // 1 de abril
  assert.equal(mostrarIRS(new Date(2026, 5, 30)), true);  // 30 de junho
  assert.equal(mostrarIRS(new Date(2026, 2, 31)), false); // 31 de março
  assert.equal(mostrarIRS(new Date(2026, 6, 1)), false);  // 1 de julho
  assert.equal(mostrarIRS(new Date(2026, 9, 2), true), true);
});
