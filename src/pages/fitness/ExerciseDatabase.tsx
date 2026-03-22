import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { db, type Exercise, type FitnessProfile } from "../../db"

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  strength:     { icon: "💪", color: "text-cyan",   label: "Strength"     },
  calisthenics: { icon: "🤸", color: "text-purple", label: "Calisthenics" },
  skill:        { icon: "⭐", color: "text-gold",   label: "Skills"       },
  martial_arts: { icon: "🥋", color: "text-red",    label: "Martial Arts" },
  cardio:       { icon: "🏃", color: "text-green",  label: "Cardio"       },
  hiit:         { icon: "⚡", color: "text-orange", label: "HIIT"         },
  mobility:     { icon: "🔄", color: "text-cyan",   label: "Mobility"     },
  flexibility:  { icon: "🧘", color: "text-purple", label: "Flexibility"  },
}

const DIFFICULTY_CONFIG = {
  beginner:     { color: "text-green  border-green/30  bg-green/10",  label: "Beginner"     },
  intermediate: { color: "text-gold   border-gold/30   bg-gold/10",   label: "Intermediate" },
  advanced:     { color: "text-orange border-orange/30 bg-orange/10", label: "Advanced"     },
  elite:        { color: "text-red    border-red/30    bg-red/10",    label: "Elite"        },
}

export default function ExerciseDatabase({ profile }: { profile: FitnessProfile }) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterEquipment, setFilterEquipment] = useState("all")
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [showAddCustom, setShowAddCustom] = useState(false)

  useEffect(() => { loadExercises() }, [])

  async function loadExercises() {
    const all = await db.exercises.toArray()
    setExercises(all)
  }

  const filtered = exercises.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.musclesPrimary.some(m => m.toLowerCase().includes(search.toLowerCase()))
    const matchCat = filterCategory === "all" || e.category === filterCategory
    const matchEquip = filterEquipment === "all" || e.equipment.includes(filterEquipment)
    return matchSearch && matchCat && matchEquip
  })

  const categories = ["all", ...Object.keys(CATEGORY_CONFIG)]
  const equipmentOptions = ["all", "Barbell", "Dumbbell", "Cables", "Machines", "Bodyweight", "Kettlebell", "Resistance bands"]

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search exercises or muscles..."
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted"
      />

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
        {categories.map(cat => {
          const cfg = CATEGORY_CONFIG[cat]
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-mono text-[9px] border transition-all tracking-wide ${
                filterCategory === cat
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border text-muted"
              }`}
            >
              {cfg && <span>{cfg.icon}</span>}
              <span>{cat === "all" ? "ALL" : cfg?.label.toUpperCase() ?? cat.toUpperCase()}</span>
            </button>
          )
        })}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-muted">{filtered.length} exercises</span>
        <button
          onClick={() => setShowAddCustom(true)}
          className="font-mono text-[10px] text-purple hover:text-gold transition-colors"
        >
          + ADD CUSTOM
        </button>
      </div>

      {/* Exercise list */}
      <div className="space-y-2">
        {filtered.map(exercise => {
          const catCfg = CATEGORY_CONFIG[exercise.category]
          const diffCfg = DIFFICULTY_CONFIG[exercise.difficulty]
          return (
            <button
              key={exercise.id}
              onClick={() => setSelectedExercise(exercise)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-xl hover:border-gold/40 transition-all text-left"
            >
              <span className="text-xl flex-shrink-0">{catCfg?.icon ?? "💪"}</span>
              <div className="flex-1 min-w-0">
                <div className="font-rajdhani font-bold text-sm text-white">{exercise.name}</div>
                <div className="flex gap-2 mt-0.5 flex-wrap">
                  <span className={`font-mono text-[9px] ${catCfg?.color ?? "text-muted"}`}>
                    {catCfg?.label ?? exercise.category}
                  </span>
                  <span className="font-mono text-[9px] text-muted">
                    {exercise.musclesPrimary.slice(0, 2).join(", ")}
                  </span>
                </div>
              </div>
              <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded border flex-shrink-0 ${diffCfg?.color}`}>
                {diffCfg?.label ?? exercise.difficulty}
              </span>
            </button>
          )
        })}
      </div>

      {/* Exercise detail sheet */}
      <AnimatePresence>
        {selectedExercise && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end left-0 right-0 max-w-sm mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80"
              onClick={() => setSelectedExercise(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-surface border-t border-border rounded-t-2xl z-50 max-h-[85vh] overflow-y-auto"
            >
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`font-mono text-[9px] px-2 py-0.5 rounded border ${DIFFICULTY_CONFIG[selectedExercise.difficulty]?.color}`}>
                        {DIFFICULTY_CONFIG[selectedExercise.difficulty]?.label}
                      </span>
                      <span className={`font-mono text-[9px] ${CATEGORY_CONFIG[selectedExercise.category]?.color ?? "text-muted"}`}>
                        {CATEGORY_CONFIG[selectedExercise.category]?.label ?? selectedExercise.category}
                      </span>
                      {selectedExercise.isCustom && (
                        <span className="font-mono text-[9px] text-purple">CUSTOM</span>
                      )}
                    </div>
                    <div className="font-rajdhani font-bold text-2xl text-white">{selectedExercise.name}</div>
                  </div>
                  <button onClick={() => setSelectedExercise(null)} className="text-muted text-xl ml-4">✕</button>
                </div>

                {/* Description */}
                <div className="bg-surface2 border border-border rounded-xl p-4">
                  <div className="font-mono text-[9px] text-muted tracking-widests uppercase mb-2">About</div>
                  <div className="text-sm text-muted leading-relaxed">{selectedExercise.description}</div>
                </div>

                {/* Muscles */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface2 border border-border rounded-xl p-3">
                    <div className="font-mono text-[9px] text-muted tracking-widests uppercase mb-2">Primary</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedExercise.musclesPrimary.map(m => (
                        <span key={m} className="font-mono text-[9px] px-2 py-0.5 rounded border border-gold/30 bg-gold/10 text-gold">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-surface2 border border-border rounded-xl p-3">
                    <div className="font-mono text-[9px] text-muted tracking-widests uppercase mb-2">Secondary</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedExercise.musclesSecondary.map(m => (
                        <span key={m} className="font-mono text-[9px] px-2 py-0.5 rounded border border-border text-muted">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Equipment */}
                <div>
                  <div className="font-mono text-[9px] text-muted tracking-widests uppercase mb-2">Equipment</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedExercise.equipment.map(eq => (
                      <span key={eq} className="font-mono text-[9px] px-2 py-1 rounded border border-cyan/30 bg-cyan/10 text-cyan">
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <div className="font-mono text-[9px] text-muted tracking-widests uppercase mb-3">How To Do It</div>
                  <div className="space-y-2">
                    {selectedExercise.instructions.map((instruction, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="w-6 h-6 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                          <span className="font-rajdhani font-bold text-xs text-gold">{i + 1}</span>
                        </div>
                        <div className="text-sm text-muted leading-relaxed flex-1">{instruction}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add custom exercise */}
      <AnimatePresence>
        {showAddCustom && (
          <AddCustomExercise
            onClose={() => setShowAddCustom(false)}
            onSave={() => { setShowAddCustom(false); loadExercises() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function AddCustomExercise({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState<Exercise["category"]>("strength")
  const [equipment, setEquipment] = useState<string[]>(["Bodyweight"])
  const [musclesPrimary, setMusclesPrimary] = useState("")
  const [musclesSecondary, setMusclesSecondary] = useState("")
  const [description, setDescription] = useState("")
  const [difficulty, setDifficulty] = useState<Exercise["difficulty"]>("beginner")

  const equipmentOptions = ["Barbell", "Dumbbell", "Cables", "Machines", "Bodyweight", "Kettlebell", "Resistance bands"]

  function toggleEquipment(item: string) {
    setEquipment(prev => prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item])
  }

  async function save() {
    if (!name.trim()) return
    await db.exercises.add({
      name: name.trim(),
      category,
      equipment,
      musclesPrimary: musclesPrimary.split(",").map(s => s.trim()).filter(Boolean),
      musclesSecondary: musclesSecondary.split(",").map(s => s.trim()).filter(Boolean),
      description: description.trim(),
      instructions: [],
      difficulty,
      isCustom: true,
      createdAt: new Date(),
    })
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end left-0 right-0 max-w-sm mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative bg-surface border-t border-border rounded-t-2xl z-50 p-5 space-y-4 max-h-[85vh] overflow-y-auto w-full"
      >
        <div className="flex items-center justify-between">
          <span className="font-rajdhani font-bold text-lg text-gold tracking-wide">CUSTOM EXERCISE</span>
          <button onClick={onClose} className="text-muted text-xl">✕</button>
        </div>

        <div>
          <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Exercise Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jefferson Curl"
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" autoFocus />
        </div>

        <div>
          <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-2">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <button key={key} onClick={() => setCategory(key as any)}
                className={`flex items-center gap-2 py-2 px-3 rounded-lg border transition-all ${
                  category === key ? `border-gold bg-gold/10 ${cfg.color}` : "border-border text-muted"
                }`}>
                <span>{cfg.icon}</span>
                <span className="font-mono text-[9px]">{cfg.label.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-2">Equipment</label>
          <div className="flex flex-wrap gap-2">
            {equipmentOptions.map(eq => (
              <button key={eq} onClick={() => toggleEquipment(eq)}
                className={`font-mono text-[9px] px-2.5 py-1.5 rounded-lg border transition-all ${
                  equipment.includes(eq) ? "border-cyan/40 bg-cyan/10 text-cyan" : "border-border text-muted"
                }`}>
                {eq}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Primary Muscles (comma separated)</label>
          <input value={musclesPrimary} onChange={e => setMusclesPrimary(e.target.value)} placeholder="e.g. Chest, Triceps"
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" />
        </div>

        <div>
          <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Secondary Muscles (optional)</label>
          <input value={musclesSecondary} onChange={e => setMusclesSecondary(e.target.value)} placeholder="e.g. Core, Shoulders"
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" />
        </div>

        <div>
          <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Difficulty</label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(DIFFICULTY_CONFIG) as [Exercise["difficulty"], typeof DIFFICULTY_CONFIG[keyof typeof DIFFICULTY_CONFIG]][]).map(([key, cfg]) => (
              <button key={key} onClick={() => setDifficulty(key)}
                className={`font-mono text-[8px] py-2 rounded-lg border transition-all ${
                  difficulty === key ? cfg.color : "border-border text-muted"
                }`}>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-1.5">Description (optional)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe this exercise..."
            rows={2} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted resize-none" />
        </div>

        <button onClick={save} disabled={!name.trim()}
          className="w-full bg-gold text-bg font-rajdhani font-bold text-lg py-3 rounded-xl tracking-widests uppercase disabled:opacity-30">
          Save Exercise
        </button>
      </motion.div>
    </div>
  )
}