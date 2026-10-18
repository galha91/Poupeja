import { test } from "node:test";
import assert from "node:assert/strict";
import { subscricaoPushValida } from "../lib/pushSubscricao.js";

const keys = { p256dh: "B".repeat(87), auth: "a".repeat(22) };

test("aceita os serviços de push dos browsers", () => {
  assert.ok(subscricaoPushValida({ endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys }));
  assert.ok(subscricaoPushValida({ endpoint: "https://web.push.apple.com/QW1", keys }));
  assert.ok(subscricaoPushValida({ endpoint: "https://updates.push.services.mozilla.com/wpush/v2/x", keys }));
});

test("recusa endpoints que fariam o servidor chamar outros endereços", () => {
  assert.equal(subscricaoPushValida({ endpoint: "https://exemplo.pt/x", keys }), false);
  assert.equal(subscricaoPushValida({ endpoint: "http://fcm.googleapis.com/x", keys }), false);
  assert.equal(subscricaoPushValida({ endpoint: "https://fcm.googleapis.com.mau.pt/x", keys }), false);
  assert.equal(subscricaoPushValida({ endpoint: "https://fcm.googleapis.com:8443/x", keys }), false);
  assert.equal(subscricaoPushValida({ endpoint: "https://169.254.169.254/x", keys }), false);
});

test("recusa sem chaves ou demasiado grande", () => {
  assert.equal(subscricaoPushValida({ endpoint: "https://fcm.googleapis.com/x" }), false);
  assert.equal(subscricaoPushValida({ endpoint: "https://fcm.googleapis.com/x", keys: { p256dh: "x", auth: "y" } }), false);
  assert.equal(subscricaoPushValida({ endpoint: "https://fcm.googleapis.com/" + "a".repeat(3000), keys }), false);
  assert.equal(subscricaoPushValida(null), false);
});
