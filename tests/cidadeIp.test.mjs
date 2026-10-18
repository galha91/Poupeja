import { test } from "node:test";
import assert from "node:assert/strict";
import { cidadePortuguesa } from "../lib/cidadeIp.js";

test("nomes da Vercel em português", () => {
  assert.equal(cidadePortuguesa("Lisbon"), "Lisboa");
  assert.equal(cidadePortuguesa("Setubal"), "Setúbal");
  assert.equal(cidadePortuguesa("Braga"), "Braga");
  assert.equal(cidadePortuguesa(""), null);
});
