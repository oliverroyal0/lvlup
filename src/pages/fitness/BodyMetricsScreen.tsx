import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { db, type BodyMetric, type FitnessProfile } from "../../db"

export default function BodyMetricsScreen({ profile, onUpdate }: {
  profile: FitnessProfile
  onUpdate: () => void
}) {
  const [metrics, setMetrics] = useState<BodyMetric[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [weight, setWeight] = useState("")
  const [bodyFat, setBodyFat] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => { loadMetrics() }, [])

  async function loadMetrics() {
    const all = await db.bodyMetrics.orderBy("createdAt").reverse().toArray()
    setMetrics(all)
  }

  async function saveMetric() {
    await db.bodyMetrics.add({
      date: new Date().toISOString().split("T")[0],
      weightLbs: profile.units === "imperial" && weight ? Number(weight) : undefined,
      weightKg: profile.units === "metric" && weight ? Number(weight) : undefined,
      bodyFatPct: bodyFat ? Number(bodyFat) : undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date(),
    })
    setWeight(""); setBodyFat(""); setNotes("")
    setShowAdd(false)
    loadMetrics()
    onUpdate()
  }

  const weightUnit = profile.units === "imperial" ? "lbs" : "kg"
  const latest = metrics[0]
  const previous = metrics[1]

  const weightDiff = latest && previous
    ? profile.units === "imperial"
      ? (latest.weightLbs ?? 0) - (previous.weightLbs ?? 0)
      : (latest.weightKg ?? 0) - (previous.weightKg ?? 0)
    : null

  return (
    <div className="space-y-4">
      {/* Current stats */}
      {latest && (
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-px bg-gold"></div>
            <span className="font-mono text-[10px] text-muted tracking-widests uppercase">Current Stats</span>
            <span className="font-mono text-[9px] text-muted ml-auto">{latest.date}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface2 border border-border rounded-xl p-3 text-center">
              <div className="font-rajdhani font-bold text-2xl text-gold leading-none">
                {profile.units === "imperial" ? latest.weightLbs ?? "—" : latest.weightKg ?? "—"}
              </div>
              <div className="font-mono text-[9px] text-muted mt-1">{weightUnit.toUpperCase()}</div>
              {weightDiff !== null && (
                <div className={`font-mono text-[9px] mt-1 ${weightDiff < 0 ? "text-green" : weightDiff > 0 ? "text-red" : "text-muted"}`}>
                  {weightDiff > 0 ? "+" : ""}{weightDiff.toFixed(1)} {weightUnit}
                </div>
              )}
            </div>
            {latest.bodyFatPct && (
              <div className="bg-surface2 border border-border rounded-xl p-3 text-center">
                <div className="font-rajdhani font-bold text-2xl text-cyan leading-none">{latest.bodyFatPct}%</div>
                <div className="font-mono text-[9px] text-muted mt-1">BODY FAT</div>
              </div>
            )}
          </div>
          {latest.notes && (
            <div className="font-mono text-[10px] text-muted">{latest.notes}</div>
          )}
        </div>
      )}

      {/* Log new metric */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="w-full border border-dashed border-border rounded-xl py-3 font-mono text-[10px] text-muted hover:border-gold hover:text-gold transition-all tracking-widests"
      >
        + LOG TODAY'S METRICS
      </button>

      {showAdd && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-xl p-4 space-y-3"
        >
          <div>
            <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">
              Weight ({weightUnit})
            </label>
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder={`e.g. ${profile.units === "imperial" ? "175" : "80"}`}
              className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted"
              autoFocus
            />
          </div>
          <div>
            <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">
              Body Fat % (optional)
            </label>
            <input
              type="number"
              value={bodyFat}
              onChange={e => setBodyFat(e.target.value)}
              placeholder="e.g. 15"
              className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted"
            />
          </div>
          <div>
            <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How are you feeling?"
              className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted"
            />
          </div>
          <button
            onClick={saveMetric}
            className="w-full bg-gold text-bg font-rajdhani font-bold text-lg py-3 rounded-xl tracking-widests uppercase"
          >
            Save
          </button>
        </motion.div>
      )}

      {/* History */}
      {metrics.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-px bg-gold"></div>
            <span className="font-mono text-[10px] text-muted tracking-widests uppercase">History</span>
          </div>
          <div className="space-y-2">
            {metrics.map((metric, i) => (
              <div key={metric.id} className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-mono text-[10px] text-muted">{metric.date}</div>
                  <div className="font-rajdhani font-bold text-base text-white mt-0.5">
                    {profile.units === "imperial"
                      ? `${metric.weightLbs ?? "—"} lbs`
                      : `${metric.weightKg ?? "—"} kg`
                    }
                    {metric.bodyFatPct && (
                      <span className="font-mono text-[10px] text-cyan ml-2">{metric.bodyFatPct}% BF</span>
                    )}
                  </div>
                </div>
                {i === 0 && (
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded border border-gold/30 bg-gold/10 text-gold">
                    LATEST
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {metrics.length === 0 && !showAdd && (
        <div className="text-center py-10 opacity-30">
          <div className="text-4xl mb-2">📏</div>
          <div className="font-mono text-xs text-muted">No metrics logged yet.</div>
        </div>
      )}
    </div>
  )
}