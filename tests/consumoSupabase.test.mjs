import { test } from "node:test";
import assert from "node:assert/strict";
import { tabelaDoPedido, contar, _estado, avaliarConsumo, fetchContado, ORCAMENTO_DIA_BYTES } from "../lib/consumoSupabase.js";

test("consumo do Supabase: identifica a tabela de cada pedido", () => {
  assert.equal(tabelaDoPedido("https://x.supabase.co/rest/v1/produtos_marca?select=*&limit=10"), "produtos_marca");
  assert.equal(tabelaDoPedido("https://x.supabase.co/rest/v1/rpc/registar_cron"), "rpc:registar_cron");
  assert.equal(tabelaDoPedido("https://x.supabase.co/auth/v1/user"), "auth");
  assert.equal(tabelaDoPedido("não é um url"), null);
});

test("consumo do Supabase: o fetch conta os bytes e devolve a resposta intacta", async () => {
  const falso = async () => new Response("x".repeat(1000), { status: 200 });
  const f = fetchContado("https://x.supabase.co", "chave", falso);
  const r = await f("https://x.supabase.co/rest/v1/precos_dgeg?select=postos");
  assert.equal((await r.text()).length, 1000, "o corpo continua legível");
  const e = _estado().pendentes.find((p) => p.tabela === "precos_dgeg");
  assert.equal(e.bytes, 1000);
  assert.equal(e.pedidos, 1);
});

test("consumo do Supabase: avisa acima do orçamento diário e perto do limite mensal", () => {
  const ontem = "2026-11-08";
  assert.deepEqual(avaliarConsumo([{ dia: ontem, tabela: "a", bytes: 1000 }], ontem), []);
  const muito = [{ dia: ontem, tabela: "produtos_marca", bytes: ORCAMENTO_DIA_BYTES + 1 }];
  assert.match(avaliarConsumo(muito, ontem)[0], /produtos_marca/);
  const mes = Array.from({ length: 30 }, (_, i) => ({ dia: `2026-10-${String(i + 1).padStart(2, "0")}`, tabela: "a", bytes: 160 * 1024 * 1024 }));
  assert.ok(avaliarConsumo(mes, ontem).some((a) => /30 dias/.test(a)));
});
