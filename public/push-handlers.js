/* Handlers de push importados por el service worker de PWA (next-pwa) en producción. */

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_e) {
    payload = { mensaje: event.data ? event.data.text() : "" };
  }

  const titulo = payload.titulo || "SOTE";
  const cuerpo = payload.mensaje || payload.cuerpo || "";
  const ruta = payload.ruta || "/";

  const options = {
    body: cuerpo,
    icon: payload.icon || "/icons/logo.png",
    badge: payload.badge || "/icons/logo.png",
    vibrate: [120, 60, 120],
    tag: payload.tag || "sote-notificacion",
    renotify: true,
    data: { ruta },
  };

  event.waitUntil(self.registration.showNotification(titulo, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const ruta =
    (event.notification.data && event.notification.data.ruta) || "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        try {
          const url = new URL(client.url);
          if (url.pathname === ruta && "focus" in client) {
            return client.focus();
          }
        } catch (_e) {
          /* noop */
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(ruta);
      }
    })(),
  );
});
