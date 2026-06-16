// Handler de push notifications — merged pelo next-pwa no sw.js gerado

// Assume o controlo de todas as páginas abertas assim que ativa,
// para que a versão nova entre em vigor sem precisar de fechar a app.
self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", event => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || "PoupeJá", {
      body: data.body || "",
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url: data.url || "/" },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(list => {
        for (const c of list) {
          if (c.url === url && "focus" in c) return c.focus();
        }
        return clients.openWindow(url);
      })
  );
});
