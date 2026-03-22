import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { db, type TravelPin } from "../db"
import { incrementStat } from "../xpEngine"

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const MOOD_OPTIONS = ["amazing", "great", "good", "okay", "tough"]
const MOOD_EMOJIS: Record<string, string> = {
  amazing: "🤩", great: "😄", good: "🙂", okay: "😐", tough: "😤"
}

export default function TravelPage({ onUserUpdate }: {
  onUserUpdate: () => void
}) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [pins, setPins] = useState<TravelPin[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedPin, setSelectedPin] = useState<TravelPin | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [view, setView] = useState<"map" | "list">("map")

  useEffect(() => {
    loadPins()
  }, [])

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [0, 20],
      zoom: 1.5,
      projection: "globe" as any,
    })

    map.current.on("load", () => {
      setMapReady(true)

      // Custom atmosphere for RPG feel
      map.current!.setFog({
        color: "rgb(10, 10, 15)",
        "high-color": "rgb(20, 20, 40)",
        "horizon-blend": 0.05,
        "space-color": "rgb(5, 5, 20)",
        "star-intensity": 0.8,
      })

      // Custom map style overrides
      map.current!.setPaintProperty("water", "fill-color", "#0d1a2e")
      map.current!.setPaintProperty("land", "background-color", "#1a1a26")
    })

    // Click to drop pin
    map.current.on("click", (e) => {
      setPendingCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng })
      setShowAdd(true)
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Add markers when pins load and map is ready
  useEffect(() => {
    if (!map.current || !mapReady) return

    // Clear existing markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    pins.forEach(pin => {
      // Create custom marker element
      const el = document.createElement("div")
      el.className = "travel-marker"
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background: #0a0a0f;
        border: 2px solid #f0c040;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        cursor: pointer;
        box-shadow: 0 0 12px rgba(240,192,64,0.4);
        transition: transform 0.2s, box-shadow 0.2s;
      `

      const inner = document.createElement("div")
      inner.style.cssText = `
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(45deg);
        font-size: 14px;
      `
      inner.textContent = MOOD_EMOJIS[pin.mood ?? "good"] ?? "📍"
      el.appendChild(inner)

      el.addEventListener("mouseenter", () => {
        el.style.transform = "rotate(-45deg) scale(1.2)"
        el.style.boxShadow = "0 0 20px rgba(240,192,64,0.7)"
      })
      el.addEventListener("mouseleave", () => {
        el.style.transform = "rotate(-45deg) scale(1)"
        el.style.boxShadow = "0 0 12px rgba(240,192,64,0.4)"
      })
      el.addEventListener("click", (e) => {
        e.stopPropagation()
        setSelectedPin(pin)
      })

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([pin.longitude, pin.latitude])
        .addTo(map.current!)

      markersRef.current.push(marker)
    })
  }, [pins, mapReady])

  async function loadPins() {
    const all = await db.travelPins.orderBy("createdAt").reverse().toArray()
    setPins(all)
  }

  async function deletePin(id: number) {
    await db.travelPins.delete(id)
    setSelectedPin(null)
    loadPins()
  }

  const uniqueCountries = [...new Set(pins.map(p => p.country))].length
  const totalPlaces = pins.length

  return (
    <div className="space-y-4">

      {/* Header stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <div className="font-rajdhani font-bold text-2xl text-gold leading-none">{totalPlaces}</div>
          <div className="font-mono text-[9px] text-muted mt-1 tracking-wide">PLACES</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <div className="font-rajdhani font-bold text-2xl text-cyan leading-none">{uniqueCountries}</div>
          <div className="font-mono text-[9px] text-muted mt-1 tracking-wide">COUNTRIES</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <div className="font-rajdhani font-bold text-2xl text-purple leading-none">
            {(totalPlaces * 0.5).toFixed(1)}
          </div>
          <div className="font-mono text-[9px] text-muted mt-1 tracking-wide">EXPLORER XP</div>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView("map")}
          className={`flex-1 py-2 rounded-xl border font-mono text-[10px] tracking-widest transition-all ${
            view === "map"
              ? "border-gold bg-gold/10 text-gold"
              : "border-border text-muted"
          }`}
        >
          🗺️ MAP
        </button>
        <button
          onClick={() => setView("list")}
          className={`flex-1 py-2 rounded-xl border font-mono text-[10px] tracking-widest transition-all ${
            view === "list"
              ? "border-gold bg-gold/10 text-gold"
              : "border-border text-muted"
          }`}
        >
          📋 LIST
        </button>
      </div>

      {/* Map view */}
      {view === "map" && (
        <div className="relative">
          <div
            ref={mapContainer}
            className="w-full rounded-xl overflow-hidden border border-border"
            style={{ height: "380px" }}
          />

          {/* Map hint */}
          {pins.length === 0 && mapReady && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-bg/80 border border-border rounded-xl px-4 py-3 text-center backdrop-blur-sm">
                <div className="text-2xl mb-1">🗺️</div>
                <div className="font-mono text-[10px] text-muted tracking-wide">
                  Tap anywhere on the map<br />to drop your first pin
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface rounded-xl">
              <div className="font-mono text-[10px] text-muted animate-pulse tracking-widest">
                LOADING MAP...
              </div>
            </div>
          )}
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="space-y-2">
          {pins.length === 0 ? (
            <div className="text-center py-10 opacity-30">
              <div className="text-4xl mb-2">🌍</div>
              <div className="font-mono text-xs text-muted">No places yet. Drop a pin on the map.</div>
            </div>
          ) : (
            pins.map(pin => (
              <motion.div
                key={pin.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedPin(pin)}
                className="bg-surface border border-border rounded-xl px-4 py-3 cursor-pointer hover:border-gold/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl flex-shrink-0">
                    {MOOD_EMOJIS[pin.mood ?? "good"] ?? "📍"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-rajdhani font-bold text-base text-white">{pin.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-gold">{pin.country}</span>
                      <span className="font-mono text-[9px] text-muted">{pin.visitedDate}</span>
                    </div>
                    {pin.notes && (
                      <div className="font-mono text-[10px] text-muted mt-1 truncate">{pin.notes}</div>
                    )}
                  </div>
                  <span className="text-muted text-sm flex-shrink-0">→</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Selected pin detail */}
      <AnimatePresence>
        {selectedPin && (
          <div className="fixed inset-0 z-40 flex flex-col justify-end left-0 right-0 max-w-sm mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70"
              onClick={() => setSelectedPin(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-surface border-t border-border rounded-t-2xl p-5 z-50 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{MOOD_EMOJIS[selectedPin.mood ?? "good"] ?? "📍"}</span>
                  <div>
                    <div className="font-rajdhani font-bold text-xl text-white">{selectedPin.name}</div>
                    <div className="font-mono text-[10px] text-gold mt-0.5">{selectedPin.country}</div>
                    <div className="font-mono text-[9px] text-muted mt-0.5">{selectedPin.visitedDate}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPin(null)}
                  className="text-muted hover:text-white transition-colors"
                >✕</button>
              </div>

              {selectedPin.notes && (
                <div className="bg-surface2 border border-border rounded-xl px-4 py-3">
                  <div className="font-mono text-[9px] text-muted tracking-widest uppercase mb-1">Memory</div>
                  <div className="text-sm text-muted leading-relaxed">{selectedPin.notes}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-surface2 border border-border rounded-xl p-3 text-center">
                  <div className="font-mono text-[9px] text-muted tracking-wide uppercase mb-1">Coords</div>
                  <div className="font-mono text-[10px] text-cyan">
                    {selectedPin.latitude.toFixed(2)}, {selectedPin.longitude.toFixed(2)}
                  </div>
                </div>
                <div className="bg-surface2 border border-border rounded-xl p-3 text-center">
                  <div className="font-mono text-[9px] text-muted tracking-wide uppercase mb-1">Mood</div>
                  <div className="font-mono text-[10px] text-gold capitalize">{selectedPin.mood ?? "good"}</div>
                </div>
              </div>

              <button
                onClick={() => selectedPin.id && deletePin(selectedPin.id)}
                className="w-full py-2.5 border border-red/30 bg-red/5 rounded-xl font-mono text-[10px] text-red hover:bg-red/10 transition-all tracking-widest"
              >
                REMOVE PIN
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Pin Sheet */}
      <AnimatePresence>
        {showAdd && pendingCoords && (
          <AddPinSheet
            coords={pendingCoords}
            onClose={() => { setShowAdd(false); setPendingCoords(null) }}
            onSave={async (pin) => {
              await db.travelPins.add(pin)
              await incrementStat("EXPLORER", 0.5)
              onUserUpdate()
              loadPins()
              setShowAdd(false)
              setPendingCoords(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function AddPinSheet({ coords, onClose, onSave }: {
  coords: { lat: number; lng: number }
  onClose: () => void
  onSave: (pin: TravelPin) => void
}) {
  const [name, setName] = useState("")
  const [country, setCountry] = useState("")
  const [notes, setNotes] = useState("")
  const [mood, setMood] = useState("good")
  const [visitedDate, setVisitedDate] = useState(
    new Date().toISOString().split("T")[0]
  )

  function save() {
    if (!name.trim() || !country.trim()) return
    onSave({
      name: name.trim(),
      country: country.trim(),
      latitude: coords.lat,
      longitude: coords.lng,
      notes: notes.trim() || undefined,
      mood,
      visitedDate,
      createdAt: new Date(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end left-0 right-0 max-w-sm mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative bg-surface border-t border-border rounded-t-2xl p-5 z-50 space-y-4 max-h-[85vh] overflow-y-auto w-full"
      >
        <div className="flex items-center justify-between">
          <span className="font-rajdhani font-bold text-lg text-gold tracking-wide">📍 NEW PIN</span>
          <button onClick={onClose} className="text-muted text-xl">✕</button>
        </div>

        {/* Coords display */}
        <div className="bg-surface2 border border-border rounded-lg px-3 py-2 font-mono text-[10px] text-muted">
          📍 {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
        </div>

        {/* Place name */}
        <div>
          <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Place Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Eiffel Tower, Tokyo Station..."
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted"
            autoFocus
          />
        </div>

        {/* Country */}
        <div>
          <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Country</label>
          <input
            value={country}
            onChange={e => setCountry(e.target.value)}
            placeholder="e.g. France, Japan..."
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted"
          />
        </div>

        {/* Date */}
        <div>
          <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Date Visited</label>
          <input
            type="date"
            value={visitedDate}
            onChange={e => setVisitedDate(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors"
          />
        </div>

        {/* Mood */}
        <div>
          <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">How was it?</label>
          <div className="flex gap-2">
            {MOOD_OPTIONS.map(m => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border transition-all ${
                  mood === m
                    ? "border-gold bg-gold/10"
                    : "border-border"
                }`}
              >
                <span className="text-lg">{MOOD_EMOJIS[m]}</span>
                <span className={`font-mono text-[8px] tracking-wide capitalize ${mood === m ? "text-gold" : "text-muted"}`}>
                  {m}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Memory (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="What made this place special?"
            rows={3}
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted resize-none"
          />
        </div>

        <button
          onClick={save}
          disabled={!name.trim() || !country.trim()}
          className="w-full bg-gold text-bg font-rajdhani font-bold text-lg py-3 rounded-xl tracking-widests uppercase hover:opacity-90 transition-opacity disabled:opacity-30"
        >
          Drop Pin
        </button>
      </motion.div>
    </div>
  )
}