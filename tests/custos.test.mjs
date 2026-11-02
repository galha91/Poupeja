import { test } from "node:test";
import assert from "node:assert/strict";
import { custoUsd, precoDe } from "../lib/custos.js";

test("custo da Anthropic a partir do usage", () => {
  assert.equal(precoDe("claude-haiku-4-5-20251001").entrada, 1);
  assert.equal(custoUsd("claude-haiku-4-5-20251001", { input_tokens: 1_000_000, output_tokens: 100_000 }), 1.5);
  assert.equal(custoUsd("claude-opus-5-5", { input_tokens: 0, output_tokens: 0, server_tool_use: { web_search_requests: 4 } }), 0.04);
  assert.equal(custoUsd("x", null), 0);
  assert.equal(precoDe("modelo-novo").saida, 25);
});
