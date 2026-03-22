import { useState, useEffect } from "react"
import { db, type Quest, type User } from "../db"
import { AnimatedQuestRow } from "../components/AnimatedQuestRow"
import { AnimatePresence } from "framer-motion"
import { XPBar } from "../components/XPBar"
import { xpForNextLevel } from "../xpEngine"

const CATEGORIES = ["STRENGTH", "MIND", "WEALTH", "EXPLORER", "FOCUS", "HEALTH", "HOME"]
const CATEGORY_ICONS: Record<string, string> = {
  STRENGTH: "💪", MIND: "🧠", WEALTH: "💰",
  EXPLORER: "🌍", FOCUS: "🎯", HEALTH: "❤️", HOME: "🏠"
}

const freqLabels = {
  daily: "Daily",
  weekly: "Weekly",
}

const freqXP = {
  daily: 25,
  weekly: 100,
}

export default function QuestsPage({ user, onQuestComplete, streak, longestStreak }: {
  user: User
  onQuestComplete: (q: Quest) => void
  streak: number
  longestStreak: number
}) {
  const [quests, setQuests] = useState<Quest[]>([])
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => { loadQuests() }, [])

  async function loadQuests() {
    const all = await db.quests
      .filter(q => q.frequency === "daily" || q.frequency === "weekly")
      .toArray()
    setQuests(all)
  }

  const xpNeeded = xpForNextLevel(user.level)

  return (
    <div className="space-y-5">

      {/* Player card */}
      <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-surface2 border-2 border-gold flex items-center justify-center font-rajdhani font-bold text-2xl text-gold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 bg-red text-white font-mono text-[9px] px-1.5 py-0.5 rounded-sm tracking-wide">
              {user.rank}
            </div>
          </div>
          <div>
            <div className="font-rajdhani font-bold text-xl tracking-wide leading-none uppercase">{user.username}</div>
            <div className="font-mono text-[10px] text-purple tracking-widest mt-1 uppercase">{user.title}</div>
            <div className="font-mono text-[11px] text-muted mt-1">
              Level <span className="text-gold font-bold">{user.level}</span> · {user.currentXP.toLocaleString()} / {xpNeeded.toLocaleString()} XP
            </div>
          </div>
        </div>

        <XPBar currentXP={user.currentXP} xpNeeded={xpNeeded} level={user.level} />

        {/* Stat chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { icon: "💪", name: "Strength", val: 0, color: "text-cyan" },
            { icon: "🧠", name: "Mind", val: 0, color: "text-purple" },
            { icon: "💰", name: "Wealth", val: 0, color: "text-gold" },
            { icon: "🌍", name: "Explorer", val: 0, color: "text-green" },
            { icon: "🎯", name: "Focus", val: 0, color: "text-red" },
            { icon: "❤️", name: "Health", val: 0, color: "text-orange" },

          ].map((stat) => (
            <div key={stat.name} className="flex-shrink-0 bg-surface2 border border-border rounded-lg px-2.5 py-2 flex items-center gap-2">
              <span className="text-sm">{stat.icon}</span>
              <div>
                <div className="font-mono text-[9px] text-muted uppercase tracking-wide">{stat.name}</div>
                <div className={`font-rajdhani font-bold text-base leading-none ${stat.color}`}>{stat.val}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily quests */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-gold"></div>
            <span className="font-mono text-[10px] text-muted tracking-widest uppercase">Daily Quests</span>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="font-mono text-[10px] text-purple hover:text-gold transition-colors"
          >
            + ADD
          </button>
        </div>

        {quests.length === 0 ? (
          <div className="text-center py-10 opacity-30">
            <div className="text-4xl mb-2">⚔️</div>
            <div className="font-mono text-xs text-muted">No quests yet. Add one above.</div>
          </div>
        ) : (
          <AnimatePresence>
            {quests.map((quest) => (
              <AnimatedQuestRow
                key={quest.id}
                quest={quest}
                onComplete={() => { onQuestComplete(quest); loadQuests() }}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Streak */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-rajdhani font-bold text-3xl text-red leading-none">{streak}</div>
            <div className="font-mono text-[9px] text-muted tracking-widest mt-1">DAY STREAK 🔥</div>
          </div>
          <div className="flex gap-1.5">
            {[...Array(7)].map((_, i) => (
              <div key={i} className={`w-5 h-5 rounded-md ${i < Math.min(streak, 7) ? "bg-red" : "bg-border"}`} />
            ))}
          </div>
        </div>
        <div className="font-mono text-[10px] text-muted">
          Longest streak: {longestStreak} days · Don't break the chain.
        </div>
      </div>

      {/* Add Quest Sheet */}
      {showAdd && (
        <AddQuestSheet
          onClose={() => setShowAdd(false)}
          onSave={() => { setShowAdd(false); loadQuests() }}
        />
      )}
    </div>
  )
}

function AddQuestSheet({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("STRENGTH")
  const [frequency, setFrequency] = useState<keyof typeof freqXP>("daily")
  const [xp, setXp] = useState(25)

  async function save() {
    if (!title.trim()) return
    await db.quests.add({
      title: title.trim(),
      category,
      frequency,
      xpReward: xp,
      isCompleted: false,
      createdAt: new Date(),
    })
    onSave()
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end left-0 right-0 max-w-sm mx-auto">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-surface border-t border-border rounded-t-2xl p-5 space-y-5 z-50 w-full">

        <div className="flex items-center justify-between">
          <span className="font-rajdhani font-bold text-lg text-gold tracking-wide">NEW QUEST</span>
          <button onClick={onClose} className="text-muted text-xl leading-none">✕</button>
        </div>

        {/* Title */}
        <div>
          <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-2">Quest Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What's the mission?"
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted"
          />
        </div>

        {/* Category */}
        <div>
          <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-2">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`font-mono text-[10px] py-2 rounded-lg border transition-all tracking-wide ${category === cat
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border text-muted"
                  }`}
              >
                {CATEGORY_ICONS[cat]} {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-2">Frequency</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(freqLabels) as Array<keyof typeof freqLabels>).map(freq => (
              <button
                key={freq}
                onClick={() => { setFrequency(freq); setXp(freqXP[freq]) }}
                className={`font-mono text-[10px] py-2 rounded-lg border transition-all tracking-wide ${frequency === freq
                  ? "border-purple bg-purple/10 text-purple"
                  : "border-border text-muted"
                  }`}
              >
                {freqLabels[freq]}
              </button>
            ))}
          </div>
        </div>

        {/* XP */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted tracking-widest uppercase">XP Reward</span>
          <span className="font-rajdhani font-bold text-xl text-gold">+{xp} XP</span>
        </div>

        {/* Save */}
        <button
          onClick={save}
          className="w-full bg-gold text-bg font-rajdhani font-bold text-lg py-3 rounded-xl tracking-widest uppercase hover:opacity-90 active:opacity-70 transition-opacity"
        >
          Add Quest
        </button>
      </div>
    </div>
  )
}