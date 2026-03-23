const CACHE_NAME = "lvlup-v" + Date.now()
const ASSETS = ["/", "/index.html"]

self.addEventListener("install", event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  )
})

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url)

  // Skip external requests — Mapbox, APIs, fonts, Supabase, Groq
  if (url.origin !== self.location.origin) return

  // Skip Vite dev server requests
  if (url.pathname.startsWith("/@") || url.pathname.startsWith("/src")) return

  // Skip API calls
  if (url.pathname.startsWith("/api")) return

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request)
    )
  )
})