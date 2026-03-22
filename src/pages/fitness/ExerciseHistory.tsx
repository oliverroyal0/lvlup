import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { db, type WorkoutSet, type FitnessProfile } from "../../db"

interface ExerciseGroup {
  exerciseName: string
  exerciseId: number
  sets: (WorkoutSet & { workoutDate?: string })[]
}

export default function ExerciseHistory({ profile }: { profile: FitnessProfile }) {
  const [groups, setGroups] = useState<ExerciseGroup[]>([])
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => { loadHistory() }, [])

  async function loadHistory() {
    const sets = await db.workoutSets.toArray()
    const logs = await db.workoutLogs.toArray()
    const logMap = Object.fromEntries(logs.map(l => [l.id, l.date]))

    // Enrich sets with date
    const enriched = sets.map(s => ({
      ...s,
      workoutDate: logMap[s.workoutLogId] ?? "Unknown",
    }))

    // Group by exercise
    const map = new Map<number, ExerciseGroup>()
    for (const set of enriched) {
      if (!map.has(set.exerciseId)) {
        map.set(set.exerciseId, {
          exerciseId: set.exerciseId,
          exerciseName: set.exerciseName,
          sets: [],
        })
      }
      map.get(set.exerciseId)!.sets.push(set)
    }

    // Sort sets by date desc within each group
    const result = Array.from(map.values()).map(g => ({
      ...g,
      sets: g.sets.sort((a, b) =>
        (b.workoutDate ?? "").localeCompare(a.workoutDate ?? "")
      ),
    }))

    // Sort groups by most recent activity
    result.sort((a, b) =>
      (b.sets[0]?.workoutDate ?? "").localeCompare(a.sets[0]?.workoutDate ?? "")
    )

    setGroups(result)
  }

  const filtered = groups.filter(g =>
    g.exerciseName.toLowerCase().includes(search.toLowerCase())
  )

  const weightUnit = profile.units === "imperial" ? "lbs" : "kg"

  return (
    <div className="space-y-4">
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search exercise history..."
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted"
      />

      {filtered.length === 0 ? (
        <div className="text-center py-10 opacity-30">
          <div className="text-4xl mb-2">📋</div>
          <div className="font-mono text-xs text-muted">
            No workout history yet.<br />Log a workout to see it here.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(group => {
            const isExpanded = expanded === group.exerciseId
            const latestSet = group.sets[0]
            const latestWeight = profile.units === "imperial"
              ? latestSet?.weightLbs
              : latestSet?.weightKg
            const maxWeight = Math.max(...group.sets.map(s =>
              profile.units === "imperial" ? s.weightLbs ?? 0 : s.weightKg ?? 0
            ))

            // Group sets by workout date
            const byDate = group.sets.reduce<Record<string, typeof group.sets>>((acc, set) => {
              const date = set.workoutDate ?? "Unknown"
              if (!acc[date]) acc[date] = []
              acc[date].push(set)
              return acc
            }, {})

            return (
              <motion.div
                key={group.exerciseId}
                layout
                className="bg-surface border border-border rounded-xl overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : group.exerciseId)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-rajdhani font-bold text-base text-white">{group.exerciseName}</div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="font-mono text-[9px] text-muted">
                        {group.sets.length} sets logged
                      </span>
                      <span className="font-mono text-[9px] text-gold">
                        Best: {maxWeight} {weightUnit}
                      </span>
                      <span className="font-mono text-[9px] text-muted">
                        Last: {latestSet?.workoutDate}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-muted flex-shrink-0">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </button>

                {/* Expanded history */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border overflow-hidden"
                    >
                      <div className="p-3 space-y-3">
                        {Object.entries(byDate).map(([date, sets]) => (
                          <div key={date}>
                            {/* Date header */}
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-3 h-px bg-border"></div>
                              <span className="font-mono text-[9px] text-muted tracking-widest">{date}</span>
                            </div>

                            {/* Sets table */}
                            <div className="bg-surface2 border border-border rounded-lg overflow-hidden">
                              <div className="grid grid-cols-4 gap-2 px-3 py-1.5 border-b border-border">
                                <span className="font-mono text-[8px] text-muted">SET</span>
                                <span className="font-mono text-[8px] text-muted">REPS</span>
                                <span className="font-mono text-[8px] text-muted">{weightUnit.toUpperCase()}</span>
                                <span className="font-mono text-[8px] text-muted">VOL</span>
                              </div>
                              {sets.map((set, i) => {
                                const w = profile.units === "imperial" ? set.weightLbs ?? 0 : set.weightKg ?? 0
                                const vol = (set.reps ?? 0) * w
                                const isPR = set.isPersonalRecord
                                return (
                                  <div
                                    key={i}
                                    className={`grid grid-cols-4 gap-2 px-3 py-2 ${
                                      i < sets.length - 1 ? "border-b border-border" : ""
                                    } ${isPR ? "bg-gold/5" : ""}`}
                                  >
                                    <span className="font-mono text-[10px] text-muted">{set.setNumber}</span>
                                    <span className="font-mono text-[10px] text-white">{set.reps ?? "—"}</span>
                                    <span className={`font-mono text-[10px] ${isPR ? "text-gold font-bold" : "text-white"}`}>
                                      {w || "—"}{isPR && " 🏆"}
                                    </span>
                                    <span className="font-mono text-[10px] text-muted">{vol || "—"}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}