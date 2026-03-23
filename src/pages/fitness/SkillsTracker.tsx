import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { db, type Exercise, type SkillProgress, type FitnessProfile } from "../../db"
import { awardXP, incrementStat } from "../../xpEngine"

const LEVEL_CONFIG = [
  { level: 1, label: "Attempting",   color: "text-muted",  bg: "bg-muted/10",   border: "border-muted/30",   xp: 50  },
  { level: 2, label: "Assisted",     color: "text-cyan",   bg: "bg-cyan/10",    border: "border-cyan/30",    xp: 100 },
  { level: 3, label: "Unassisted",   color: "text-green",  bg: "bg-green/10",   border: "border-green/30",   xp: 200 },
  { level: 4, label: "Consistent",   color: "text-gold",   bg: "bg-gold/10",    border: "border-gold/30",    xp: 350 },
  { level: 5, label: "Mastered",     color: "text-purple", bg: "bg-purple/10",  border: "border-purple/30",  xp: 500 },
]

const DIFFICULTY_STARS: Record<string, number> = {
  beginner: 1, intermediate: 2, advanced: 3, elite: 4,
}


export default function SkillsTracker({ onUserUpdate }: {
  profile: FitnessProfile
  onUserUpdate: () => void
}) {
  const [skills, setSkills] = useState<Exercise[]>([])
  const [progress, setProgress] = useState<Record<number, SkillProgress>>({})
  const [selectedSkill, setSelectedSkill] = useState<Exercise | null>(null)
  const [filterCategory, setFilterCategory] = useState("all")

  useEffect(() => { loadSkills() }, [])

  async function loadSkills() {
    const skillExercises = await db.exercises
      .filter(e => e.category === "skill" || e.category === "martial_arts")
      .toArray()
    setSkills(skillExercises)

    const progressRecords = await db.skillProgress.toArray()
    const progressMap: Record<number, SkillProgress> = {}
    progressRecords.forEach(p => {
      progressMap[p.exerciseId] = p
    })
    setProgress(progressMap)
  }

  async function updateSkillLevel(exercise: Exercise, newLevel: number) {
    if (!exercise.id) return
    const existing = progress[exercise.id]
    const oldLevel = existing?.currentLevel ?? 0

    if (newLevel <= oldLevel) return

    if (existing?.id) {
      await db.skillProgress.update(existing.id, {
        currentLevel: newLevel,
        achievedDate: newLevel === 5 ? new Date().toISOString().split("T")[0] : existing.achievedDate,
      })
    } else {
      await db.skillProgress.add({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        currentLevel: newLevel,
        maxLevel: 5,
        createdAt: new Date(),
        achievedDate: newLevel === 5 ? new Date().toISOString().split("T")[0] : undefined,
      })
    }

    // Award XP for level up
    const levelCfg = LEVEL_CONFIG[newLevel - 1]
    await awardXP(levelCfg.xp)
    await incrementStat("STRENGTH", 0.5)
    onUserUpdate()
    loadSkills()
  }

  const filtered = filterCategory === "all"
    ? skills
    : skills.filter(s => s.category === filterCategory)

  const masteredCount = Object.values(progress).filter(p => p.currentLevel === 5).length
  const inProgressCount = Object.values(progress).filter(p => p.currentLevel > 0 && p.currentLevel < 5).length

  return (
    <div className="space-y-4">

      {/* Stats header */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <div className="font-rajdhani font-bold text-2xl text-gold leading-none">{masteredCount}</div>
          <div className="font-mono text-[9px] text-muted mt-1 tracking-wide">MASTERED</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <div className="font-rajdhani font-bold text-2xl text-cyan leading-none">{inProgressCount}</div>
          <div className="font-mono text-[9px] text-muted mt-1 tracking-wide">IN PROGRESS</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <div className="font-rajdhani font-bold text-2xl text-purple leading-none">{skills.length}</div>
          <div className="font-mono text-[9px] text-muted mt-1 tracking-wide">TOTAL SKILLS</div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", "skill", "martial_arts"].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] border transition-all tracking-wide ${
              filterCategory === cat
                ? "border-gold bg-gold/10 text-gold"
                : "border-border text-muted"
            }`}
          >
            {cat === "all" ? "⭐ ALL" :
             cat === "skill" ? "🤸 CALISTHENICS" :
             "🥋 MARTIAL ARTS"}
          </button>
        ))}
      </div>

      {/* Skill cards grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(skill => {
          const skillProgress = progress[skill.id!]
          const currentLevel = skillProgress?.currentLevel ?? 0
          const isMastered = currentLevel === 5
          const isStarted = currentLevel > 0
          const levelCfg = currentLevel > 0 ? LEVEL_CONFIG[currentLevel - 1] : null
          const stars = DIFFICULTY_STARS[skill.difficulty] ?? 1
          const pct = (currentLevel / 5) * 100

          return (
            <motion.div
              key={skill.id}
              layout
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedSkill(skill)}
              className={`bg-surface border rounded-xl p-4 cursor-pointer transition-all relative overflow-hidden ${
                isMastered
                  ? "border-purple/50 bg-purple/5"
                  : isStarted
                  ? "border-gold/30 bg-gold/3"
                  : "border-border"
              }`}
            >
              {/* Mastered glow */}
              {isMastered && (
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-purple/5 rounded-xl pointer-events-none"
                />
              )}

              {/* Difficulty stars */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4].map(i => (
                    <span key={i} className={`text-[10px] ${i <= stars ? "text-gold" : "text-border"}`}>
                      ★
                    </span>
                  ))}
                </div>
                {isMastered && (
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                    className="text-base"
                  >
                    👑
                  </motion.span>
                )}
              </div>

              {/* Skill name */}
              <div className="font-rajdhani font-bold text-sm text-white leading-tight mb-2">
                {skill.name}
              </div>

              {/* Level badge */}
              {levelCfg ? (
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono text-[8px] tracking-wide mb-2 ${levelCfg.color} ${levelCfg.bg} ${levelCfg.border}`}>
                  LVL {currentLevel} · {levelCfg.label}
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border font-mono text-[8px] tracking-wide text-muted mb-2">
                  NOT STARTED
                </div>
              )}

              {/* Progress bar */}
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    isMastered ? "bg-purple" :
                    currentLevel >= 3 ? "bg-gold" :
                    currentLevel >= 1 ? "bg-cyan" :
                    "bg-border"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>

              {/* Level dots */}
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(l => (
                  <div
                    key={l}
                    className={`flex-1 h-1 rounded-full transition-all ${
                      l <= currentLevel
                        ? isMastered ? "bg-purple" : l >= 4 ? "bg-gold" : "bg-cyan"
                        : "bg-border"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Skill detail sheet */}
      <AnimatePresence>
        {selectedSkill && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end left-0 right-0 max-w-sm mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85"
              onClick={() => setSelectedSkill(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-surface border-t border-border rounded-t-2xl z-50 max-h-[88vh] overflow-y-auto"
            >
              <div className="p-5 space-y-5">

                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex gap-0.5 mb-1">
                      {[1,2,3,4].map(i => (
                        <span key={i} className={`text-sm ${i <= (DIFFICULTY_STARS[selectedSkill.difficulty] ?? 1) ? "text-gold" : "text-border"}`}>★</span>
                      ))}
                    </div>
                    <div className="font-rajdhani font-bold text-2xl text-white">{selectedSkill.name}</div>
                    <div className="font-mono text-[10px] text-muted mt-1 capitalize">
                      {selectedSkill.category.replace("_", " ")} · {selectedSkill.difficulty}
                    </div>
                  </div>
                  <button onClick={() => setSelectedSkill(null)} className="text-muted text-xl ml-4">✕</button>
                </div>

                {/* Description */}
                <div className="bg-surface2 border border-border rounded-xl p-4">
                  <div className="text-sm text-muted leading-relaxed">{selectedSkill.description}</div>
                </div>

                {/* Current level */}
                {(() => {
                  const currentLevel = progress[selectedSkill.id!]?.currentLevel ?? 0
                  return (
                    <div className="bg-surface2 border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-[9px] text-muted tracking-widest uppercase">Your Progress</span>
                        <span className="font-mono text-[10px] text-gold">Level {currentLevel} / 5</span>
                      </div>
                      <div className="flex gap-1 mb-3">
                        {[1,2,3,4,5].map(l => {
                          const cfg = LEVEL_CONFIG[l-1]
                          return (
                            <div key={l} className="flex-1 text-center">
                              <div className={`h-2 rounded-full mb-1 transition-all ${
                                l <= currentLevel
                                  ? l === 5 ? "bg-purple" : l >= 4 ? "bg-gold" : "bg-cyan"
                                  : "bg-border"
                              }`} />
                              <div className={`font-mono text-[7px] tracking-wide ${l <= currentLevel ? cfg.color : "text-muted"}`}>
                                {cfg.label.split(" ")[0]}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* Level up buttons */}
                <div>
                  <div className="font-mono text-[9px] text-muted tracking-widest uppercase mb-3">Update Your Level</div>
                  <div className="space-y-2">
                    {LEVEL_CONFIG.map((cfg, i) => {
                      const currentLevel = progress[selectedSkill.id!]?.currentLevel ?? 0
                      const isAchieved = currentLevel >= cfg.level
                      const isNext = cfg.level === currentLevel + 1
                      return (
                        <motion.button
                          key={cfg.level}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => !isAchieved && updateSkillLevel(selectedSkill, cfg.level)}
                          disabled={isAchieved || (!isNext && cfg.level > currentLevel + 1)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                            isAchieved
                              ? `${cfg.border} ${cfg.bg} opacity-60`
                              : isNext
                              ? `${cfg.border} ${cfg.bg} hover:opacity-90`
                              : "border-border opacity-30 cursor-not-allowed"
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center font-rajdhani font-bold text-sm flex-shrink-0 ${cfg.border} ${cfg.bg}`}>
                            <span className={cfg.color}>{cfg.level}</span>
                          </div>
                          <div className="flex-1 text-left">
                            <div className={`font-rajdhani font-bold text-sm ${isAchieved || isNext ? cfg.color : "text-muted"}`}>
                              {cfg.label}
                            </div>
                            <div className="font-mono text-[9px] text-muted mt-0.5">
                              {selectedSkill.instructions[i] ?? ""}
                            </div>
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-1">
                            {isAchieved ? (
                              <span className="text-sm">✓</span>
                            ) : isNext ? (
                              <span className="font-mono text-[9px] text-gold">+{cfg.xp} XP</span>
                            ) : null}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Muscles */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface2 border border-border rounded-xl p-3">
                    <div className="font-mono text-[9px] text-muted tracking-widest uppercase mb-2">Primary</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedSkill.musclesPrimary.map(m => (
                        <span key={m} className="font-mono text-[9px] px-2 py-0.5 rounded border border-gold/30 bg-gold/10 text-gold">{m}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-surface2 border border-border rounded-xl p-3">
                    <div className="font-mono text-[9px] text-muted tracking-widests uppercase mb-2">Equipment</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedSkill.equipment.map(e => (
                        <span key={e} className="font-mono text-[9px] px-2 py-0.5 rounded border border-border text-muted">{e}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
