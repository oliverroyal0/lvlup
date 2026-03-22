import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { db, type Habit } from "../db"
import { awardXP, incrementStat } from "../xpEngine"
import { updateStreak } from "../streakEngine"

const CATEGORIES = ["STRENGTH", "MIND", "WEALTH", "EXPLORER", "FOCUS", "HEALTH", "HOME"]

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  STRENGTH: { icon: "💪", color: "text-cyan", bg: "bg-cyan/10", border: "border-cyan/30" },
  MIND: { icon: "🧠", color: "text-purple", bg: "bg-purple/10", border: "border-purple/30" },
  WEALTH: { icon: "💰", color: "text-gold", bg: "bg-gold/10", border: "border-gold/30" },
  EXPLORER: { icon: "🌍", color: "text-green", bg: "bg-green/10", border: "border-green/30" },
  FOCUS: { icon: "🎯", color: "text-red", bg: "bg-red/10", border: "border-red/30" },
  HEALTH: { icon: "❤️", color: "text-orange", bg: "bg-orange/10", border: "border-orange/30" },
  HOME: { icon: "🏠", color: "text-[#a8a095]", bg: "bg-[#a8a095]/10", border: "border-[#a8a095]/30" },
}

const FREQ_OPTIONS = {
  daily: { label: "Daily", xp: 20 },
  weekly: { label: "Weekly", xp: 75 },
  "bi-weekly": { label: "Bi-Weekly", xp: 50 },
  monthly: { label: "Monthly", xp: 150 },
}

export default function HabitsPage({ onUserUpdate, onLevelUp }: {
  onUserUpdate: () => void
  onLevelUp: (msg: string, isRankUp: boolean) => void
}) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [expandedHabit, setExpandedHabit] = useState<number | null>(null)

  useEffect(() => { loadHabits() }, [])

  async function loadHabits() {
    const all = await db.habits
      .filter(h => !h.isArchived)
      .toArray()
    setHabits(all)
  }

  async function completeHabit(habit: Habit) {
    if (!habit.id) return
    const today = new Date().toDateString()
    if (habit.lastCompletedDate === today) return

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const newStreak = habit.lastCompletedDate === yesterday.toDateString()
      ? habit.currentStreak + 1
      : 1
    const newLongest = Math.max(newStreak, habit.longestStreak)
    const newDates = [...new Set([...habit.completedDates, today])]

    await db.habits.update(habit.id, {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastCompletedDate: today,
      completedDates: newDates,
    })

    const previousUser = await db.users.toCollection().first()
    const previousRank = previousUser?.rank
    const result = await awardXP(habit.xpReward)
    await incrementStat(habit.category)
    await updateStreak()
    const updatedUser = await db.users.toCollection().first()
    const newRank = updatedUser?.rank
    onUserUpdate()

    if (result.leveledUp) {
      const rankChanged = newRank && previousRank && newRank !== previousRank
      onLevelUp(
        rankChanged
          ? `${previousRank} → ${newRank}`
          : `Level ${result.newLevel} · Rank ${result.newRank}`,
        !!rankChanged
      )
    }

    loadHabits()
  }

  async function archiveHabit(id: number) {
    await db.habits.update(id, { isArchived: true })
    loadHabits()
  }

  const today = new Date().toDateString()
  const completedToday = habits.filter(h => h.lastCompletedDate === today).length
  const totalHabits = habits.length
  const completionPct = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0

  // Build calendar data for selected month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth, year, month }
  }

  const { firstDay, daysInMonth, year, month } = getDaysInMonth(selectedMonth)

  // Get all completed dates across all habits for heatmap
  const allCompletedDates = habits.reduce<Record<string, number>>((acc, habit) => {
    habit.completedDates.forEach(date => {
      const d = new Date(date)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        acc[day] = (acc[day] || 0) + 1
      }
    })
    return acc
  }, {})

  const maxCompletions = Math.max(...Object.values(allCompletedDates), 1)

  function getHeatColor(count: number): string {
    if (count === 0) return "bg-border"
    const intensity = count / maxCompletions
    if (intensity >= 0.75) return "bg-gold"
    if (intensity >= 0.5) return "bg-gold/60"
    if (intensity >= 0.25) return "bg-gold/30"
    return "bg-gold/15"
  }

  const monthName = selectedMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  return (
    <div className="space-y-5">

      {/* Daily progress header */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-rajdhani font-bold text-xl text-white tracking-wide leading-none">
              TODAY'S HABITS
            </div>
            <div className="font-mono text-[10px] text-muted tracking-widest mt-1">
              {completedToday} / {totalHabits} COMPLETE
            </div>
          </div>
          <div className="relative w-14 h-14">
            <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2a2a3e" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke="#f0c040"
                strokeWidth="3"
                strokeDasharray={`${completionPct} ${100 - completionPct}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-rajdhani font-bold text-sm text-gold">{completionPct}%</span>
            </div>
          </div>
        </div>

        {/* Today's progress bar */}
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-purple to-gold"
            initial={{ width: 0 }}
            animate={{ width: `${completionPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Habit list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-gold"></div>
            <span className="font-mono text-[10px] text-muted tracking-widest uppercase">
              Habits · {totalHabits}
            </span>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="font-mono text-[10px] text-purple hover:text-gold transition-colors"
          >
            + ADD
          </button>
        </div>

        {habits.length === 0 ? (
          <div className="text-center py-10 opacity-30">
            <div className="text-4xl mb-2">🔄</div>
            <div className="font-mono text-xs text-muted">No habits yet. Add your first one.</div>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {habits.map(habit => {
                const isCompletedToday = habit.lastCompletedDate === today
                const cfg = CATEGORY_CONFIG[habit.category] ?? CATEGORY_CONFIG.FOCUS
                return (
                  <motion.div
                    key={habit.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`bg-surface border rounded-xl overflow-hidden transition-all ${isCompletedToday ? "border-green/30" : "border-border"
                      }`}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      {/* Complete button */}
                      <motion.button
                        onClick={() => completeHabit(habit)}
                        disabled={isCompletedToday}
                        whileTap={{ scale: 0.85 }}
                        className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${isCompletedToday
                          ? "bg-green border-green text-bg font-bold"
                          : `${cfg.border} ${cfg.bg} hover:scale-105`
                          }`}
                      >
                        {isCompletedToday ? "✓" : cfg.icon}
                      </motion.button>

                      {/* Info */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setExpandedHabit(expandedHabit === habit.id ? null : habit.id!)}
                      >
                        <div className={`text-sm font-medium ${isCompletedToday ? "text-muted line-through" : "text-white"}`}>
                          {habit.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`font-mono text-[9px] ${cfg.color} tracking-wide`}>
                            {habit.category}
                          </span>
                          <span className="font-mono text-[9px] text-muted">
                            {FREQ_OPTIONS[habit.frequency as keyof typeof FREQ_OPTIONS]?.label ?? "Daily"}
                          </span>
                          {habit.currentStreak > 0 && (
                            <span className="font-mono text-[9px] text-red">
                              🔥 {habit.currentStreak}d
                            </span>
                          )}
                        </div>
                      </div>

                      {/* XP + archive */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-mono text-[9px] text-gold">+{habit.xpReward}</span>
                        <button
                          onClick={() => habit.id && archiveHabit(habit.id)}
                          className="text-muted hover:text-red transition-colors text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Expanded streak info */}
                    <AnimatePresence>
                      {expandedHabit === habit.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-border px-4 py-3 bg-surface2"
                        >
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                              <div className={`font-rajdhani font-bold text-xl ${cfg.color}`}>
                                {habit.currentStreak}
                              </div>
                              <div className="font-mono text-[9px] text-muted tracking-wide">CURRENT</div>
                            </div>
                            <div>
                              <div className="font-rajdhani font-bold text-xl text-gold">
                                {habit.longestStreak}
                              </div>
                              <div className="font-mono text-[9px] text-muted tracking-wide">LONGEST</div>
                            </div>
                            <div>
                              <div className="font-rajdhani font-bold text-xl text-purple">
                                {habit.completedDates.length}
                              </div>
                              <div className="font-mono text-[9px] text-muted tracking-wide">TOTAL DAYS</div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Monthly heatmap */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-gold"></div>
            <span className="font-mono text-[10px] text-muted tracking-widest uppercase">
              {monthName}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const d = new Date(selectedMonth)
                d.setMonth(d.getMonth() - 1)
                setSelectedMonth(d)
              }}
              className="font-mono text-[10px] text-muted hover:text-gold transition-colors px-2"
            >
              ←
            </button>
            <button
              onClick={() => {
                const d = new Date(selectedMonth)
                d.setMonth(d.getMonth() + 1)
                setSelectedMonth(d)
              }}
              className="font-mono text-[10px] text-muted hover:text-gold transition-colors px-2"
            >
              →
            </button>
          </div>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-center font-mono text-[9px] text-muted">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for first day offset */}
          {[...Array(firstDay)].map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Day cells */}
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1
            const count = allCompletedDates[day] || 0
            const isToday =
              new Date().getDate() === day &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year
            return (
              <motion.div
                key={day}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.01 }}
                className={`aspect-square rounded-md flex items-center justify-center font-mono text-[9px] transition-all ${getHeatColor(count)} ${isToday ? "ring-1 ring-gold" : ""
                  } ${count > 0 ? "text-bg font-bold" : "text-muted"}`}
              >
                {day}
              </motion.div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-3">
          <span className="font-mono text-[9px] text-muted">Less</span>
          {["bg-border", "bg-gold/15", "bg-gold/30", "bg-gold/60", "bg-gold"].map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span className="font-mono text-[9px] text-muted">More</span>
        </div>
      </div>

      {/* Add Habit Sheet */}
      {showAdd && (
        <AddHabitSheet
          onClose={() => setShowAdd(false)}
          onSave={() => { setShowAdd(false); loadHabits() }}
        />
      )}
    </div>
  )
}

function AddHabitSheet({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("HEALTH")
  const [xp, setXp] = useState(20)
  const [frequency, setFrequency] = useState<keyof typeof FREQ_OPTIONS>("daily")

  async function save() {
    if (!title.trim()) return
    await db.habits.add({
      title: title.trim(),
      category,
      frequency,
      xpReward: xp,
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: "",
      completedDates: [],
      createdAt: new Date(),
    })
    onSave()
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end left-0 right-0 max-w-sm mx-auto">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-surface border-t border-border rounded-t-2xl p-5 space-y-5 z-50 w-full">

        <div className="flex items-center justify-between">
          <span className="font-rajdhani font-bold text-lg text-gold tracking-wide">NEW HABIT</span>
          <button onClick={onClose} className="text-muted text-xl leading-none">✕</button>
        </div>

        {/* Title */}
        <div>
          <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-2">
            Habit Name
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && save()}
            placeholder="e.g. Brush teeth, Do the dishes..."
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted"
            autoFocus
          />
        </div>

        {/* Category */}
        <div>
          <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-2">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map(cat => {
              const cfg = CATEGORY_CONFIG[cat]
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg border transition-all ${category === cat
                    ? `${cfg.border} ${cfg.bg} ${cfg.color}`
                    : "border-border text-muted"
                    }`}
                >
                  <span className="text-base">{cfg.icon}</span>
                  <span className="font-mono text-[8px] tracking-wide">{cat}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-2">Frequency</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(FREQ_OPTIONS) as [keyof typeof FREQ_OPTIONS, typeof FREQ_OPTIONS[keyof typeof FREQ_OPTIONS]][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => { setFrequency(key); setXp(cfg.xp) }}
                className={`font-mono text-[10px] py-2 rounded-lg border transition-all tracking-wide ${frequency === key
                  ? "border-purple bg-purple/10 text-purple"
                  : "border-border text-muted"
                  }`}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* XP */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] text-muted tracking-widest uppercase block">XP Per Completion</span>
            <span className="font-mono text-[9px] text-muted">Awarded every time you complete this habit</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setXp(Math.max(5, xp - 5))}
              className="w-7 h-7 border border-border rounded-lg text-muted hover:text-gold hover:border-gold transition-all font-bold"
            >−</button>
            <span className="font-rajdhani font-bold text-xl text-gold min-w-[48px] text-center">+{xp}</span>
            <button
              onClick={() => setXp(xp + 5)}
              className="w-7 h-7 border border-border rounded-lg text-muted hover:text-gold hover:border-gold transition-all font-bold"
            >+</button>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={save}
          className="w-full bg-gold text-bg font-rajdhani font-bold text-lg py-3 rounded-xl tracking-widest uppercase hover:opacity-90 active:opacity-70 transition-opacity"
        >
          Add Habit
        </button>
      </div>
    </div>
  )
}