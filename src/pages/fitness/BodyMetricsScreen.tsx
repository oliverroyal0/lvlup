import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { db, type BodyMetric, type FitnessProfile } from "../../db"

const MEASUREMENTS = [
  { key: "chest",  labelImperial: "Chest (in)",  labelMetric: "Chest (cm)",  fieldImperial: "chestIn"  as const, fieldMetric: "chestCm"  as const },
  { key: "waist",  labelImperial: "Waist (in)",  labelMetric: "Waist (cm)",  fieldImperial: "waistIn"  as const, fieldMetric: "waistCm"  as const },
  { key: "hips",   labelImperial: "Hips (in)",   labelMetric: "Hips (cm)",   fieldImperial: "hipsIn"   as const, fieldMetric: "hipsCm"   as const },
  { key: "arm",    labelImperial: "Arm (in)",     labelMetric: "Arm (cm)",    fieldImperial: "armIn"    as const, fieldMetric: "armCm"    as const },
  { key: "thigh",  labelImperial: "Thigh (in)",   labelMetric: "Thigh (cm)",  fieldImperial: "thighIn"  as const, fieldMetric: "thighCm"  as const },
]

export default function BodyMetricsScreen({ profile, onUpdate }: {
  profile: FitnessProfile
  onUpdate: () => void
}) {
  const [metrics, setMetrics] = useState<BodyMetric[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [activeSection, setActiveSection] = useState<"weight" | "measurements">("weight")
  const [weight, setWeight] = useState("")
  const [bodyFat, setBodyFat] = useState("")
  const [notes, setNotes] = useState("")
  const [measurements, setMeasurements] = useState<Record<string, string>>({})

  useEffect(() => { loadMetrics() }, [])

  async function loadMetrics() {
    const all = await db.bodyMetrics.orderBy("createdAt").reverse().toArray()
    setMetrics(all)
  }

  async function saveMetric() {
    const isImperial = profile.units === "imperial"

    await db.bodyMetrics.add({
      date: new Date().toISOString().split("T")[0],
      weightLbs: isImperial && weight ? Number(weight) : undefined,
      weightKg: !isImperial && weight ? Number(weight) : undefined,
      bodyFatPct: bodyFat ? Number(bodyFat) : undefined,
      chestIn:  isImperial && measurements.chest  ? Number(measurements.chest)  : undefined,
      waistIn:  isImperial && measurements.waist  ? Number(measurements.waist)  : undefined,
      hipsIn:   isImperial && measurements.hips   ? Number(measurements.hips)   : undefined,
      armIn:    isImperial && measurements.arm    ? Number(measurements.arm)    : undefined,
      thighIn:  isImperial && measurements.thigh  ? Number(measurements.thigh)  : undefined,
      chestCm:  !isImperial && measurements.chest ? Number(measurements.chest)  : undefined,
      waistCm:  !isImperial && measurements.waist ? Number(measurements.waist)  : undefined,
      hipsCm:   !isImperial && measurements.hips  ? Number(measurements.hips)   : undefined,
      armCm:    !isImperial && measurements.arm   ? Number(measurements.arm)    : undefined,
      thighCm:  !isImperial && measurements.thigh ? Number(measurements.thigh)  : undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date(),
    })

    setWeight(""); setBodyFat(""); setNotes("")
    setMeasurements({})
    setShowAdd(false)
    loadMetrics()
    onUpdate()
  }

  const weightUnit = profile.units === "imperial" ? "lbs" : "kg"
  const measureUnit = profile.units === "imperial" ? "in" : "cm"
  const latest = metrics[0]
  const previous = metrics[1]

  const weightDiff = latest && previous
    ? profile.units === "imperial"
      ? (latest.weightLbs ?? 0) - (previous.weightLbs ?? 0)
      : (latest.weightKg ?? 0) - (previous.weightKg ?? 0)
    : null

  function getLatestMeasurement(metric: BodyMetric, key: string) {
    const isImperial = profile.units === "imperial"
    const map: Record<string, keyof BodyMetric> = {
      chest: isImperial ? "chestIn" : "chestCm",
      waist: isImperial ? "waistIn" : "waistCm",
      hips:  isImperial ? "hipsIn"  : "hipsCm",
      arm:   isImperial ? "armIn"   : "armCm",
      thigh: isImperial ? "thighIn" : "thighCm",
    }
    return metric[map[key]] as number | undefined
  }

  return (
    <div className="space-y-4">

      {/* Current stats */}
      {latest && (
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-px bg-gold"></div>
            <span className="font-mono text-[10px] text-muted tracking-widest uppercase">Latest — {latest.date}</span>
          </div>

          {/* Weight + body fat */}
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

          {/* Measurements grid */}
          {MEASUREMENTS.some(m => getLatestMeasurement(latest, m.key) !== undefined) && (
            <div className="grid grid-cols-3 gap-2">
              {MEASUREMENTS.map(m => {
                const val = getLatestMeasurement(latest, m.key)
                if (!val) return null
                return (
                  <div key={m.key} className="bg-surface2 border border-border rounded-lg p-2 text-center">
                    <div className="font-rajdhani font-bold text-base text-purple leading-none">{val}</div>
                    <div className="font-mono text-[8px] text-muted mt-0.5 capitalize">{m.key} {measureUnit}</div>
                  </div>
                )
              })}
            </div>
          )}

          {latest.notes && (
            <div className="font-mono text-[10px] text-muted italic">{latest.notes}</div>
          )}
        </div>
      )}

      {/* Log button */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="w-full border border-dashed border-border rounded-xl py-3 font-mono text-[10px] text-muted hover:border-gold hover:text-gold transition-all tracking-widest"
      >
        + LOG TODAY'S METRICS
      </button>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-surface border border-border rounded-xl p-4 space-y-4"
          >
            {/* Section toggle */}
            <div className="flex gap-2">
              {(["weight", "measurements"] as const).map(section => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`flex-1 py-2 rounded-xl border font-mono text-[10px] tracking-widest transition-all capitalize ${
                    activeSection === section
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border text-muted"
                  }`}
                >
                  {section}
                </button>
              ))}
            </div>

            {activeSection === "weight" && (
              <div className="space-y-3">
                <div>
                  <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-1.5">
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
                  <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-1.5">
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
                  <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-1.5">
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
              </div>
            )}

            {activeSection === "measurements" && (
              <div className="space-y-3">
                <div className="font-mono text-[9px] text-muted tracking-wide">
                  All measurements in {measureUnit} — fill in what you have
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {MEASUREMENTS.map(m => (
                    <div key={m.key}>
                      <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-1.5">
                        {profile.units === "imperial" ? m.labelImperial : m.labelMetric}
                      </label>
                      <input
                        type="number"
                        value={measurements[m.key] ?? ""}
                        onChange={e => setMeasurements(prev => ({ ...prev, [m.key]: e.target.value }))}
                        placeholder="0"
                        className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-purple transition-colors placeholder:text-muted"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={saveMetric}
              className="w-full bg-gold text-bg font-rajdhani font-bold text-lg py-3 rounded-xl tracking-widest uppercase"
            >
              Save Metrics
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {metrics.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-px bg-gold"></div>
            <span className="font-mono text-[10px] text-muted tracking-widest uppercase">History</span>
          </div>
          <div className="space-y-2">
            {metrics.map((metric, i) => (
              <div key={metric.id} className="bg-surface border border-border rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-mono text-[10px] text-muted">{metric.date}</div>
                  {i === 0 && (
                    <span className="font-mono text-[9px] px-2 py-0.5 rounded border border-gold/30 bg-gold/10 text-gold">
                      LATEST
                    </span>
                  )}
                </div>
                <div className="font-rajdhani font-bold text-base text-white">
                  {profile.units === "imperial"
                    ? `${metric.weightLbs ?? "—"} lbs`
                    : `${metric.weightKg ?? "—"} kg`
                  }
                  {metric.bodyFatPct && (
                    <span className="font-mono text-[10px] text-cyan ml-2">{metric.bodyFatPct}% BF</span>
                  )}
                </div>
                {/* Show measurements if any logged */}
                {MEASUREMENTS.some(m => getLatestMeasurement(metric, m.key) !== undefined) && (
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {MEASUREMENTS.map(m => {
                      const val = getLatestMeasurement(metric, m.key)
                      if (!val) return null
                      return (
                        <span key={m.key} className="font-mono text-[9px] text-muted capitalize">
                          {m.key}: <span className="text-purple">{val}{measureUnit}</span>
                        </span>
                      )
                    })}
                  </div>
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