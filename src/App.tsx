import { useState } from "react"

const tabs = [
  { id: "quests", icon: "⚔️", label: "Quests" },
  { id: "stats", icon: "📊", label: "Stats" },
  { id: "guild", icon: "👥", label: "Guild" },
  { id: "journal", icon: "📖", label: "Journal" },
  { id: "profile", icon: "👤", label: "Profile" },
]

export default function App() {
  const [activeTab, setActiveTab] = useState("quests")

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col max-w-sm mx-auto relative">

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
        {activeTab === "quests" && <QuestsPage />}
        {activeTab === "stats" && <PlaceholderPage title="Stats" icon="📊" color="text-green" />}
        {activeTab === "guild" && <PlaceholderPage title="Guild" icon="👥" color="text-purple" />}
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

// Quests page — home screen
function QuestsPage() {
  const [quests, setQuests] = useState([
    { id: 1, title: "Morning workout", category: "STRENGTH", xp: 40, done: true },
    { id: 2, title: "Read for 30 minutes", category: "MIND", xp: 25, done: false },
    { id: 3, title: "Log today's meals", category: "HEALTH", xp: 15, done: false },
  ])

  const toggleQuest = (id: number) => {
    setQuests(quests.map(q => q.id === id ? { ...q, done: !q.done } : q))
  }

  const totalXP = 3420
  const levelXP = 5000
  const xpPct = (totalXP / levelXP) * 100

  return (
    <div className="space-y-5">

      {/* Player card */}
      <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
        {/* Avatar row */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-surface2 border-2 border-gold flex items-center justify-center font-rajdhani font-bold text-2xl text-gold">
              S
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 bg-red text-white font-mono text-[9px] px-1.5 py-0.5 rounded-sm tracking-wide">
              B+
            </div>
          </div>
          <div>
            <div className="font-rajdhani font-bold text-xl tracking-wide leading-none">SHADOW</div>
            <div className="font-mono text-[10px] text-purple tracking-widest mt-1">AWAKENED GRINDER</div>
            <div className="font-mono text-[11px] text-muted mt-1">
              Level <span className="text-gold font-bold">14</span> · {totalXP.toLocaleString()} / {levelXP.toLocaleString()} XP
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="font-mono text-[10px] text-muted tracking-wide">XP TO LEVEL 15</span>
            <span className="font-mono text-[10px] text-gold">{(levelXP - totalXP).toLocaleString()} remaining</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple to-gold transition-all duration-700"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>

        {/* Stat chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { icon: "💪", name: "Strength", val: 72, color: "text-cyan" },
            { icon: "🧠", name: "Mind", val: 58, color: "text-purple" },
            { icon: "💰", name: "Wealth", val: 41, color: "text-gold" },
            { icon: "🌍", name: "Explorer", val: 33, color: "text-green" },
            { icon: "🎯", name: "Focus", val: 65, color: "text-red" },
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
          <span className="font-mono text-[10px] text-purple cursor-pointer">+ ADD</span>
        </div>
        <div className="space-y-2">
          {quests.map((quest) => (
            <div
              key={quest.id}
              onClick={() => toggleQuest(quest.id)}
              className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3 cursor-pointer active:opacity-70 transition-opacity"
            >
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                quest.done
                  ? "bg-green border-green text-bg text-xs font-bold"
                  : "border-border"
              }`}>
                {quest.done && "✓"}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${quest.done ? "line-through text-muted" : "text-white"}`}>
                  {quest.title}
                </div>
                <div className="font-mono text-[9px] text-muted mt-0.5">{quest.category}</div>
              </div>
              <div className="font-mono text-[10px] text-gold flex-shrink-0">+{quest.xp} XP</div>
            </div>
          ))}
        </div>
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
              <div key={d} className={`w-5 h-5 rounded-md ${d === 7 ? "bg-red shadow-sm shadow-red/50" : "bg-red"} opacity-${d === 7 ? "100" : "80"}`} />
            ))}
          </div>
        </div>
        <div className="font-mono text-[10px] text-muted">Longest streak: 21 days · Don't break the chain.</div>
      </div>

    </div>
  )
}

// Placeholder for unbuilt screens
function PlaceholderPage({ title, icon, color }: { title: string; icon: string; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 opacity-30">
      <span className="text-5xl">{icon}</span>
      <span className={`font-rajdhani font-bold text-2xl tracking-widest uppercase ${color}`}>{title}</span>
      <span className="font-mono text-xs text-muted">Coming soon</span>
    </div>
  )
}