
const CACHE = "cosmos-app-v2";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(async cache => {
      await Promise.allSettled(
        ARCHIVOS.map(url => cache.add(url))
      );
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const nombres = await caches.keys();

      await Promise.all(
        nombres
          .filter(nombre => nombre !== CACHE)
          .map(nombre => caches.delete(nombre))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Nunca interceptamos las llamadas externas a NASA o Google.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request).then(respuesta => {
      if (respuesta.ok) {
        const copia = respuesta.clone();

        caches.open(CACHE).then(cache => {
          cache.put(event.request, copia);
        });
      }

      return respuesta;
    }).catch(async () => {
      const guardada = await caches.match(event.request);

      if (guardada) return guardada;

      if (event.request.mode === "navigate") {
        const inicio = await caches.match("./index.html");
        if (inicio) return inicio;
      }

      return Response.error();
    })
  );
});
