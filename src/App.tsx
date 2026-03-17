import { useState, useEffect } from "react"
import { db, initUser, type Quest, type User } from "./db"
import { awardXP, xpForNextLevel, incrementStat} from "./xpEngine"
import MissionsPage from "./pages/MissionsPage"
import StatsPage from "./pages/StatsPage"

const tabs = [
  { id: "quests", icon: "⚔️", label: "Quests" },
  { id: "stats", icon: "📊", label: "Stats" },
  { id: "missions", icon: "🎯", label: "Missions" },
  { id: "journal", icon: "📖", label: "Journal" },
  { id: "profile", icon: "👤", label: "Profile" },
]

export default function App() {
  const [activeTab, setActiveTab] = useState("quests")
  const [user, setUser] = useState<User | null>(null)
  const [levelUpMsg, setLevelUpMsg] = useState<string | null>(null)

  useEffect(() => {
    initUser().then(loadUser)
  }, [])

  async function loadUser() {
    const u = await db.users.toCollection().first()
    if (u) setUser(u)
  }

  async function handleQuestComplete(quest: Quest) {
    if (!quest.id || quest.isCompleted) return

    // Mark complete in DB
    await db.quests.update(quest.id, {
      isCompleted: true,
      completedAt: new Date(),
    })

    // Award XP
    const result = await awardXP(quest.xpReward)

    await incrementStat(quest.category)
    await loadUser()

    if (result.leveledUp) {
      setLevelUpMsg(`LEVEL UP! You are now Level ${result.newLevel} · Rank ${result.newRank}`)
      setTimeout(() => setLevelUpMsg(null), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col max-w-sm mx-auto relative">

      {/* Level up toast */}
      {levelUpMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gold text-bg font-rajdhani font-bold text-sm px-5 py-3 rounded-xl shadow-lg tracking-wide animate-bounce">
          ⭐ {levelUpMsg}
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg sticky top-0 z-10">
        <div className="font-rajdhani font-bold text-2xl tracking-widest text-gold uppercase">
          LVL<span className="text-white opacity-40">_</span>UP
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-gold">🔥 7</span>
          <div className="w-8 h-8 border border-border rounded-md flex items-center justify-center text-sm relative">
            🔔
            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto pb-24 px-5 pt-5">
        {activeTab === "quests" && user && (
          <QuestsPage user={user} onQuestComplete={handleQuestComplete} onUserUpdate={loadUser} />
        )}
        {activeTab === "stats" && user && ( <StatsPage user={user} /> )}
        {activeTab === "missions" && ( <MissionsPage onUserUpdate={loadUser} /> )}
        {activeTab === "journal" && <PlaceholderPage title="Journal" icon="📖" color="text-orange" />}
        {activeTab === "profile" && <PlaceholderPage title="Profile" icon="👤" color="text-gold" />}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-bg border-t border-border flex z-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-opacity ${
              activeTab === tab.id ? "opacity-100" : "opacity-30"
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className={`font-mono text-[9px] tracking-widest uppercase ${
              activeTab === tab.id ? "text-gold" : "text-muted"
            }`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function QuestsPage({ user, onQuestComplete, onUserUpdate }: {
  user: User
  onQuestComplete: (q: Quest) => void
  onUserUpdate: () => void
}) {
  const [quests, setQuests] = useState<Quest[]>([])
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => { loadQuests() }, [])

  async function loadQuests() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const all = await db.quests
      .filter(q => q.frequency === "daily" || !q.isCompleted)
      .toArray()
    setQuests(all)
  }

  const xpNeeded = xpForNextLevel(user.level)
  const xpPct = Math.min((user.currentXP / xpNeeded) * 100, 100)

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

        {/* XP bar */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="font-mono text-[10px] text-muted tracking-wide">XP TO LEVEL {user.level + 1}</span>
            <span className="font-mono text-[10px] text-gold">{(xpNeeded - user.currentXP).toLocaleString()} remaining</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple to-gold transition-all duration-700"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>

        {/* Stat chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { icon: "💪", name: "Strength", val: 0, color: "text-cyan" },
            { icon: "🧠", name: "Mind", val: 0, color: "text-purple" },
            { icon: "💰", name: "Wealth", val: 0, color: "text-gold" },
            { icon: "🌍", name: "Explorer", val: 0, color: "text-green" },
            { icon: "🎯", name: "Focus", val: 0, color: "text-red" },
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
          <div className="space-y-2">
            {quests.map((quest) => (
              <div
                key={quest.id}
                onClick={() => { onQuestComplete(quest); loadQuests() }}
                className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3 cursor-pointer active:opacity-70 transition-opacity"
              >
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                  quest.isCompleted
                    ? "bg-green border-green text-bg text-xs font-bold"
                    : "border-border"
                }`}>
                  {quest.isCompleted && "✓"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${quest.isCompleted ? "line-through text-muted" : "text-white"}`}>
                    {quest.title}
                  </div>
                  <div className="font-mono text-[9px] text-muted mt-0.5 uppercase">{quest.category}</div>
                </div>
                <div className="font-mono text-[10px] text-gold flex-shrink-0">+{quest.xpReward} XP</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Streak */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-rajdhani font-bold text-3xl text-red leading-none">7</div>
            <div className="font-mono text-[9px] text-muted tracking-widest mt-1">DAY STREAK 🔥</div>
          </div>
          <div className="flex gap-1.5">
            {[1,2,3,4,5,6,7].map((d) => (
              <div key={d} className="w-5 h-5 rounded-md bg-red opacity-80" />
            ))}
          </div>
        </div>
        <div className="font-mono text-[10px] text-muted">Longest streak: 7 days · Don't break the chain.</div>
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
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "bi-weekly" | "monthly" | "semi-annually" | "bi-annually" | "annually" | "oneTime">("daily")
  const [xp, setXp] = useState(25)

  const categories = ["STRENGTH", "MIND", "WEALTH", "EXPLORER", "FOCUS", "HEALTH"]
  
  const freqXP = {
  daily: 25,
  weekly: 100,
  "bi-weekly": 75,
  monthly: 150,
  "semi-annually": 300,
  "bi-annually": 200,
  annually: 500,
  oneTime: 50,
  }

  const freqLabels = {
  daily: "Daily",
  weekly: "Weekly",
  "bi-weekly": "Bi-Weekly",
  monthly: "Monthly",
  "semi-annually": "Semi-Annual",
  "bi-annually": "Bi-Annual",
  annually: "Annually",
  oneTime: "One-Time",
  }

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
    <div className="fixed inset-0 z-40 flex flex-col justify-end max-w-sm mx-auto left-1/2 -translate-x-1/2">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-surface border-t border-border rounded-t-2xl p-5 space-y-5 z-50">
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
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm font-sans outline-none focus:border-gold transition-colors placeholder:text-muted"
          />
        </div>

        {/* Category */}
        <div>
          <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-2">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`font-mono text-[10px] py-2 rounded-lg border transition-all tracking-wide ${
                  category === cat
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border text-muted hover:border-muted"
                }`}
              >
                {cat}
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
                  className={`font-mono text-[10px] py-2 rounded-lg border transition-all tracking-wide ${
                    frequency === freq
                      ? "border-purple bg-purple/10 text-purple"
                        : "border-border text-muted hover:border-muted"
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
          className="w-full bg-gold text-bg font-rajdhani font-bold text-lg py-3 rounded-xl tracking-widest uppercase transition-opacity hover:opacity-90 active:opacity-70"
        >
          Add Quest
        </button>
      </div>
    </div>
  )
}

function PlaceholderPage({ title, icon, color }: { title: string; icon: string; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 opacity-30">
      <span className="text-5xl">{icon}</span>
      <span className={`font-rajdhani font-bold text-2xl tracking-widest uppercase ${color}`}>{title}</span>
      <span className="font-mono text-xs text-muted">Coming soon</span>
    </div>
  )
}
