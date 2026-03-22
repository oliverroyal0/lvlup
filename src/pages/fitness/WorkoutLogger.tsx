import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { db, type Exercise, type FitnessProfile } from "../../db"

interface LoggedSet {
  exerciseId: number
  exerciseName: string
  sets: { reps: number; weight: number }[]
}

export default function WorkoutLogger({ profile, onComplete }: {
  profile: FitnessProfile
  onComplete: (xp: number) => void
}) {
  const [workoutName, setWorkoutName] = useState("")
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loggedExercises, setLoggedExercises] = useState<LoggedSet[]>([])
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [startTime] = useState(new Date())
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadExercises() }, [])

  async function loadExercises() {
    const all = await db.exercises.toArray()
    setExercises(all)
  }

  function addExercise(exercise: Exercise) {
    const existing = loggedExercises.find(e => e.exerciseId === exercise.id)
    if (existing) { setShowExercisePicker(false); return }
    setLoggedExercises(prev => [...prev, {
      exerciseId: exercise.id!,
      exerciseName: exercise.name,
      sets: [{ reps: 0, weight: 0 }],
    }])
    setShowExercisePicker(false)
  }

  function addSet(exerciseIdx: number) {
    setLoggedExercises(prev => prev.map((e, i) =>
      i === exerciseIdx
        ? { ...e, sets: [...e.sets, { reps: 0, weight: 0 }] }
        : e
    ))
  }

  function updateSet(exerciseIdx: number, setIdx: number, field: "reps" | "weight", value: number) {
    setLoggedExercises(prev => prev.map((e, i) =>
      i === exerciseIdx
        ? { ...e, sets: e.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s) }
        : e
    ))
  }

  function removeExercise(idx: number) {
    setLoggedExercises(prev => prev.filter((_, i) => i !== idx))
  }

  async function finishWorkout() {
    if (loggedExercises.length === 0) return
    setSaving(true)

    const duration = Math.round((new Date().getTime() - startTime.getTime()) / 60000)
    const totalSets = loggedExercises.reduce((acc, e) => acc + e.sets.length, 0)
    const totalVolume = loggedExercises.reduce((acc, e) =>
      acc + e.sets.reduce((a, s) => a + (s.reps * s.weight), 0), 0
    )
    const xpEarned = Math.min(totalSets * 10, 300)

    const workoutId = await db.workoutLogs.add({
      date: new Date().toISOString().split("T")[0],
      name: workoutName || "Workout",
      duration,
      totalSets,
      totalVolume,
      xpEarned,
      createdAt: new Date(),
    })

    // Save sets and check PRs
    for (const exercise of loggedExercises) {
      for (let i = 0; i < exercise.sets.length; i++) {
        const set = exercise.sets[i]
        await db.workoutSets.add({
          workoutLogId: workoutId as number,
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          setNumber: i + 1,
          reps: set.reps,
          weightLbs: profile.units === "imperial" ? set.weight : undefined,
          weightKg: profile.units === "metric" ? set.weight : undefined,
        })

        // Check if this is a PR
        const existingPR = await db.personalRecords
          .where("exerciseId").equals(exercise.exerciseId).first()
        const currentWeight = set.weight
        const existingWeight = profile.units === "imperial"
          ? existingPR?.weightLbs ?? 0
          : existingPR?.weightKg ?? 0

        if (currentWeight > existingWeight) {
          if (existingPR?.id) {
            await db.personalRecords.update(existingPR.id, {
              weightLbs: profile.units === "imperial" ? currentWeight : undefined,
              weightKg: profile.units === "metric" ? currentWeight : undefined,
              reps: set.reps,
              achievedDate: new Date().toISOString().split("T")[0],
              workoutLogId: workoutId as number,
            })
          } else {
            await db.personalRecords.add({
              exerciseId: exercise.exerciseId,
              exerciseName: exercise.exerciseName,
              weightLbs: profile.units === "imperial" ? currentWeight : undefined,
              weightKg: profile.units === "metric" ? currentWeight : undefined,
              reps: set.reps,
              achievedDate: new Date().toISOString().split("T")[0],
              workoutLogId: workoutId as number,
            })
          }
        }
      }
    }

    setSaving(false)
    onComplete(xpEarned)
  }

  const filteredExercises = exercises.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = filterCategory === "all" || e.category === filterCategory
    const matchesEquipment = e.equipment.some(eq => profile.equipment.includes(eq)) || e.equipment.includes("Bodyweight")
    return matchesSearch && matchesCategory && matchesEquipment
  })

  const categories = ["all", "strength", "calisthenics", "skill", "martial_arts", "cardio", "hiit", "mobility", "flexibility"]
  const weightUnit = profile.units === "imperial" ? "lbs" : "kg"

  return (
    <div className="space-y-4">
      {/* Workout name */}
      <input
        value={workoutName}
        onChange={e => setWorkoutName(e.target.value)}
        placeholder="Workout name (e.g. Push Day, Leg Day...)"
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted font-rajdhani font-bold text-lg tracking-wide"
      />

      {/* Logged exercises */}
      {loggedExercises.map((exercise, exIdx) => (
        <motion.div
          key={exercise.exerciseId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="font-rajdhani font-bold text-base text-white">{exercise.exerciseName}</div>
            <button onClick={() => removeExercise(exIdx)} className="text-muted hover:text-red transition-colors text-sm">✕</button>
          </div>

          <div className="p-3 space-y-2">
            {/* Set headers */}
            <div className="grid grid-cols-4 gap-2 px-1">
              <span className="font-mono text-[9px] text-muted text-center">SET</span>
              <span className="font-mono text-[9px] text-muted text-center">REPS</span>
              <span className="font-mono text-[9px] text-muted text-center">{weightUnit.toUpperCase()}</span>
              <span></span>
            </div>

            {exercise.sets.map((set, setIdx) => (
              <div key={setIdx} className="grid grid-cols-4 gap-2 items-center">
                <div className="font-mono text-[10px] text-muted text-center bg-surface2 rounded-lg py-2">
                  {setIdx + 1}
                </div>
                <input
                  type="number"
                  value={set.reps || ""}
                  onChange={e => updateSet(exIdx, setIdx, "reps", Number(e.target.value))}
                  placeholder="0"
                  className="bg-surface2 border border-border rounded-lg px-2 py-2 text-white text-sm text-center outline-none focus:border-gold transition-colors"
                />
                <input
                  type="number"
                  value={set.weight || ""}
                  onChange={e => updateSet(exIdx, setIdx, "weight", Number(e.target.value))}
                  placeholder="0"
                  className="bg-surface2 border border-border rounded-lg px-2 py-2 text-white text-sm text-center outline-none focus:border-gold transition-colors"
                />
                <button
                  onClick={() => {
                    setLoggedExercises(prev => prev.map((e, i) =>
                      i === exIdx
                        ? { ...e, sets: e.sets.filter((_, j) => j !== setIdx) }
                        : e
                    ))
                  }}
                  className="text-muted hover:text-red transition-colors text-xs text-center"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              onClick={() => addSet(exIdx)}
              className="w-full py-2 border border-dashed border-border rounded-lg font-mono text-[9px] text-muted hover:border-gold hover:text-gold transition-all tracking-widests"
            >
              + ADD SET
            </button>
          </div>
        </motion.div>
      ))}

      {/* Add exercise button */}
      <button
        onClick={() => setShowExercisePicker(true)}
        className="w-full border border-dashed border-border rounded-xl py-4 flex items-center justify-center gap-2 font-mono text-[10px] text-muted hover:border-gold hover:text-gold transition-all tracking-widests"
      >
        <span className="text-lg">⚔️</span>
        ADD EXERCISE
      </button>

      {/* Finish button */}
      {loggedExercises.length > 0 && (
        <button
          onClick={finishWorkout}
          disabled={saving}
          className="w-full bg-gold text-bg font-rajdhani font-bold text-xl py-4 rounded-xl tracking-widests uppercase disabled:opacity-40"
        >
          {saving ? "SAVING..." : "FINISH WORKOUT"}
        </button>
      )}

      {/* Exercise picker */}
      <AnimatePresence>
        {showExercisePicker && (
          <div className="fixed inset-0 z-50 flex flex-col left-0 right-0 max-w-sm mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80"
              onClick={() => setShowExercisePicker(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-surface border-t border-border rounded-t-2xl z-50 flex flex-col mt-auto"
              style={{ maxHeight: "85vh" }}
            >
              <div className="p-4 border-b border-border flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-rajdhani font-bold text-lg text-gold tracking-wide">ADD EXERCISE</span>
                  <button onClick={() => setShowExercisePicker(false)} className="text-muted text-xl">✕</button>
                </div>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search exercises..."
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted"
                  autoFocus
                />
              </div>

              {/* Category filter */}
              <div className="flex gap-2 overflow-x-auto px-4 py-2 border-b border-border flex-shrink-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`flex-shrink-0 font-mono text-[9px] px-2.5 py-1.5 rounded-lg border transition-all tracking-wide capitalize ${
                      filterCategory === cat
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-border text-muted"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Exercise list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredExercises.map(exercise => (
                  <button
                    key={exercise.id}
                    onClick={() => addExercise(exercise)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-surface2 border border-border rounded-xl hover:border-gold/40 transition-all text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-rajdhani font-bold text-sm text-white">{exercise.name}</div>
                      <div className="flex gap-2 mt-0.5 flex-wrap">
                        <span className="font-mono text-[9px] text-gold capitalize">{exercise.category}</span>
                        <span className="font-mono text-[9px] text-muted">{exercise.musclesPrimary.join(", ")}</span>
                      </div>
                    </div>
                    <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded border flex-shrink-0 ${
                      exercise.difficulty === "beginner" ? "border-green/30 text-green bg-green/10" :
                      exercise.difficulty === "intermediate" ? "border-gold/30 text-gold bg-gold/10" :
                      exercise.difficulty === "advanced" ? "border-orange/30 text-orange bg-orange/10" :
                      "border-red/30 text-red bg-red/10"
                    }`}>
                      {exercise.difficulty}
                    </span>
                  </button>
                ))}

                {filteredExercises.length === 0 && (
                  <div className="text-center py-8 opacity-30">
                    <div className="font-mono text-xs text-muted">No exercises found</div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}