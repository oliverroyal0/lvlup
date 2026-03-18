import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { db } from "../db"

const TITLES = [
  "The Grinder",
  "Shadow Walker",
  "Rising Phoenix",
  "Iron Will",
  "Silent Hunter",
  "The Awakened",
]

const STAT_OPTIONS = [
  { key: "STRENGTH", icon: "💪", label: "Strength", desc: "Fitness, gym, physical goals" },
  { key: "MIND", icon: "🧠", label: "Mind", desc: "Learning, reading, mental growth" },
  { key: "WEALTH", icon: "💰", label: "Wealth", desc: "Finance, income, investments" },
  { key: "EXPLORER", icon: "🌍", label: "Explorer", desc: "Travel, new experiences" },
  { key: "FOCUS", icon: "🎯", label: "Focus", desc: "Productivity, deep work, habits" },
  { key: "HEALTH", icon: "❤️", label: "Health", desc: "Sleep, nutrition, wellness" },
]

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [username, setUsername] = useState("")
  const [selectedTitle, setSelectedTitle] = useState(TITLES[0])
  const [focusStats, setFocusStats] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  function toggleStat(key: string) {
    setFocusStats(prev =>
      prev.includes(key)
        ? prev.filter(s => s !== key)
        : prev.length < 3
        ? [...prev, key]
        : prev
    )
  }

  async function finish() {
    if (!username.trim()) return
    setSaving(true)

    const existingUser = await db.users.toCollection().first()
    if (existingUser?.id) {
      await db.users.update(existingUser.id, {
        username: username.trim(),
        title: selectedTitle,
      })
    } else {
      await db.users.add({
        username: username.trim(),
        title: selectedTitle,
        level: 1,
        currentXP: 0,
        totalXP: 0,
        rank: "F",
      })
    }

    // Pre-seed stat records for focused categories
    for (const stat of focusStats) {
      const existing = await db.statRecords.where("category").equals(stat).first()
      if (!existing) {
        await db.statRecords.add({ category: stat, score: 0, updatedAt: new Date() })
      }
    }

    // Mark onboarding complete
    localStorage.setItem("lvlup-onboarded", "true")
    setSaving(false)
    onComplete()
  }

  const steps = [
    <WelcomeStep key="welcome" onNext={() => setStep(1)} />,
    <IdentityStep
      key="identity"
      username={username}
      setUsername={setUsername}
      selectedTitle={selectedTitle}
      setSelectedTitle={setSelectedTitle}
      onNext={() => setStep(2)}
    />,
    <FocusStep
      key="focus"
      focusStats={focusStats}
      toggleStat={toggleStat}
      onFinish={finish}
      saving={saving}
      canFinish={username.trim().length > 0 && focusStats.length > 0}
    />,
  ]

  return (
    <div className="fixed inset-0 bg-bg z-50 flex flex-col max-w-sm mx-auto">

      {/* Progress dots */}
      {step > 0 && (
        <div className="flex justify-center gap-2 pt-12 pb-4">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="rounded-full"
              animate={{
                width: i === step - 1 ? 24 : 8,
                background: i <= step - 1 ? "#f0c040" : "#2a2a3e",
              }}
              style={{ height: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          ))}
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="h-full"
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// Step 1 — Welcome
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-6">

      {/* Animated logo */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
      >
        <div className="w-24 h-24 rounded-3xl bg-surface border-2 border-gold flex items-center justify-center mb-2">
          <span className="font-rajdhani font-bold text-4xl text-gold">LU</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <div className="font-rajdhani font-bold text-5xl text-white tracking-widest uppercase leading-none">
          LVL<span className="text-gold">_</span>UP
        </div>
        <div className="font-mono text-[11px] text-muted tracking-widest leading-relaxed">
          YOUR LIFE IS THE GAME.<br />YOU ARE THE PROTAGONIST.
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full space-y-3"
      >
        {[
          { icon: "⚔️", text: "Turn goals into quests" },
          { icon: "📊", text: "Track your real-life stats" },
          { icon: "⭐", text: "Level up as you grow" },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + i * 0.1 }}
            className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-mono text-[11px] text-muted tracking-wide">{item.text}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        onClick={onNext}
        className="w-full bg-gold text-bg font-rajdhani font-bold text-xl py-4 rounded-2xl tracking-widest uppercase hover:opacity-90 active:opacity-70 transition-opacity"
      >
        Begin Your Journey
      </motion.button>
    </div>
  )
}

// Step 2 — Identity
function IdentityStep({ username, setUsername, selectedTitle, setSelectedTitle, onNext }: {
  username: string
  setUsername: (v: string) => void
  selectedTitle: string
  setSelectedTitle: (v: string) => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col h-full px-6 pt-4 pb-8 gap-6">

      <div>
        <div className="font-rajdhani font-bold text-3xl text-white tracking-wide leading-none">
          WHO ARE YOU?
        </div>
        <div className="font-mono text-[10px] text-muted tracking-widest mt-2">
          EVERY LEGEND NEEDS A NAME
        </div>
      </div>

      {/* Username */}
      <div>
        <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-2">
          Your Name
        </label>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Enter your name..."
          maxLength={20}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-white text-lg font-rajdhani font-bold outline-none focus:border-gold transition-colors placeholder:text-muted placeholder:font-normal placeholder:text-sm tracking-wide"
          autoFocus
        />
      </div>

      {/* Title picker */}
      <div className="flex-1">
        <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-3">
          Choose Your Starting Title
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TITLES.map(title => (
            <button
              key={title}
              onClick={() => setSelectedTitle(title)}
              className={`py-3 px-3 rounded-xl border text-left transition-all ${
                selectedTitle === title
                  ? "border-gold bg-gold/10"
                  : "border-border bg-surface"
              }`}
            >
              <div className={`font-mono text-[10px] tracking-wide ${
                selectedTitle === title ? "text-gold" : "text-muted"
              }`}>
                {title}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      {username && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-gold/20 rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-surface2 border-2 border-gold flex items-center justify-center font-rajdhani font-bold text-xl text-gold">
            {username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-rajdhani font-bold text-base text-white tracking-wide uppercase">{username}</div>
            <div className="font-mono text-[10px] text-purple tracking-widest">{selectedTitle}</div>
          </div>
        </motion.div>
      )}

      <button
        onClick={onNext}
        disabled={!username.trim()}
        className="w-full bg-gold text-bg font-rajdhani font-bold text-xl py-4 rounded-2xl tracking-widest uppercase hover:opacity-90 active:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  )
}

// Step 3 — Focus stats
function FocusStep({ focusStats, toggleStat, onFinish, saving, canFinish }: {
  focusStats: string[]
  toggleStat: (key: string) => void
  onFinish: () => void
  saving: boolean
  canFinish: boolean
}) {
  return (
    <div className="flex flex-col h-full px-6 pt-4 pb-8 gap-5">

      <div>
        <div className="font-rajdhani font-bold text-3xl text-white tracking-wide leading-none">
          YOUR FOCUS
        </div>
        <div className="font-mono text-[10px] text-muted tracking-widest mt-2">
          PICK UP TO 3 STATS TO PRIORITIZE
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {STAT_OPTIONS.map(stat => {
          const isSelected = focusStats.includes(stat.key)
          const isDisabled = !isSelected && focusStats.length >= 3
          return (
            <motion.button
              key={stat.key}
              onClick={() => toggleStat(stat.key)}
              disabled={isDisabled}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all text-left ${
                isSelected
                  ? "border-gold bg-gold/8"
                  : isDisabled
                  ? "border-border opacity-30"
                  : "border-border bg-surface hover:border-border/80"
              }`}
            >
              <span className="text-2xl flex-shrink-0">{stat.icon}</span>
              <div className="flex-1">
                <div className={`font-rajdhani font-bold text-base tracking-wide ${isSelected ? "text-gold" : "text-white"}`}>
                  {stat.label}
                </div>
                <div className="font-mono text-[9px] text-muted mt-0.5">{stat.desc}</div>
              </div>
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                isSelected ? "bg-gold border-gold text-bg text-xs font-bold" : "border-border"
              }`}>
                {isSelected && "✓"}
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Selected count */}
      <div className="flex justify-center gap-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i < focusStats.length ? "bg-gold" : "bg-border"
            }`}
          />
        ))}
      </div>

      <button
        onClick={onFinish}
        disabled={!canFinish || saving}
        className="w-full bg-gold text-bg font-rajdhani font-bold text-xl py-4 rounded-2xl tracking-widest uppercase hover:opacity-90 active:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {saving ? "CREATING YOUR CHARACTER..." : "START YOUR JOURNEY"}
      </button>
    </div>
  )
}