import { useState, useEffect } from "react"
import { db, type User } from "../db"
import { xpForNextLevel, rankFromLevel } from "../xpEngine"

const RANK_COLORS: Record<string, string> = {
  F: "text-muted border-muted/40 bg-surface2",
  E: "text-muted border-muted/50 bg-surface2",
  D: "text-cyan border-cyan/40 bg-cyan/20",
  C: "text-cyan border-cyan/50 bg-cyan/25",
  B: "text-purple border-purple/50 bg-purple/20",
  A: "text-gold border-gold/50 bg-gold/20",
  S: "text-gold border-gold bg-gold/30",
}

const ACHIEVEMENTS = [
  { id: "first_quest", icon: "⚔️", title: "First Blood", desc: "Complete your first quest", check: (stats: AppStats) => stats.totalQuests >= 1 },
  { id: "first_mission", icon: "🎯", title: "On a Mission", desc: "Complete your first mission", check: (stats: AppStats) => stats.totalMissions >= 1 },
  { id: "level5", icon: "⭐", title: "Initiate", desc: "Reach level 5", check: (stats: AppStats) => stats.level >= 5 },
  { id: "level10", icon: "🌟", title: "Rising", desc: "Reach level 10", check: (stats: AppStats) => stats.level >= 10 },
  { id: "level20", icon: "💫", title: "Awakened", desc: "Reach level 20", check: (stats: AppStats) => stats.level >= 20 },
  { id: "streak7", icon: "🔥", title: "On Fire", desc: "Log 7 journal entries", check: (stats: AppStats) => stats.totalJournal >= 7 },
  { id: "quests10", icon: "💪", title: "Grinder", desc: "Complete 10 quests", check: (stats: AppStats) => stats.totalQuests >= 10 },
  { id: "quests50", icon: "🏆", title: "Veteran", desc: "Complete 50 quests", check: (stats: AppStats) => stats.totalQuests >= 50 },
  { id: "missions5", icon: "🗺️", title: "Arc Complete", desc: "Complete 5 missions", check: (stats: AppStats) => stats.totalMissions >= 5 },
  { id: "allstats", icon: "📊", title: "Balanced", desc: "Score in all 6 stat categories", check: (stats: AppStats) => stats.statsCovered >= 6 },
  { id: "journal30", icon: "📖", title: "Chronicler", desc: "Write 30 journal entries", check: (stats: AppStats) => stats.totalJournal >= 30 },
  { id: "rankA", icon: "🎖️", title: "Elite", desc: "Reach rank A", check: (stats: AppStats) => ["A", "S"].includes(stats.rank) },
]

interface AppStats {
  level: number
  rank: string
  totalQuests: number
  totalMissions: number
  totalJournal: number
  statsCovered: number
}

export default function ProfilePage({ user, onUserUpdate }: {
  user: User
  onUserUpdate: () => void
}) {
  const [stats, setStats] = useState<AppStats>({
    level: user.level,
    rank: user.rank,
    totalQuests: 0,
    totalMissions: 0,
    totalJournal: 0,
    statsCovered: 0,
  })
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(user.username)
  const [activeTab, setActiveTab] = useState<"achievements" | "history">("achievements")
  const [showClearData, setShowClearData] = useState(false)

  useEffect(() => { loadStats() }, [user])

  async function loadStats() {
    const totalQuests = await db.quests.filter(q => q.isCompleted).count()
    const totalMissions = await db.missions.filter(m => m.isCompleted).count()
    const totalJournal = await db.journalEntries.count()
    const statRecords = await db.statRecords.toArray()
    const statsCovered = statRecords.filter(s => s.score > 0).length

    setStats({
      level: user.level,
      rank: user.rank,
      totalQuests,
      totalMissions,
      totalJournal,
      statsCovered,
    })
  }

  async function saveName() {
    if (!nameInput.trim() || !user.id) return
    await db.users.update(user.id, { username: nameInput.trim() })
    onUserUpdate()
    setIsEditingName(false)
  }

  async function clearQuests() {
    await db.quests.clear()
    setShowClearData(false)
    loadStats()
  }

  async function clearMissions() {
    await db.missions.clear()
    setShowClearData(false)
    loadStats()
  }

  async function clearJournal() {
    await db.journalEntries.clear()
    setShowClearData(false)
    loadStats()
  }

  async function clearAllData() {
    await db.quests.clear()
    await db.missions.clear()
    await db.journalEntries.clear()
    await db.statRecords.clear()
    await db.streaks.clear()
    localStorage.removeItem("lvlup-onboarded")
    setShowClearData(false)
    window.location.reload()
  }

  const xpNeeded = xpForNextLevel(user.level)
  const xpPct = Math.min((user.currentXP / xpNeeded) * 100, 100)
  const unlockedAchievements = ACHIEVEMENTS.filter(a => a.check(stats))
  const lockedAchievements = ACHIEVEMENTS.filter(a => !a.check(stats))
  const nextRankLevel = user.rank === "F" ? 2 : user.rank === "E" ? 5 : user.rank === "D" ? 10 : user.rank === "C" ? 20 : user.rank === "B" ? 30 : user.rank === "A" ? 50 : null

  return (
    <div className="space-y-5">

      {/* Hero card */}
      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">

        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-surface2 border-2 border-gold flex items-center justify-center font-rajdhani font-bold text-3xl text-gold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-lg border-2 border-bg flex items-center justify-center font-rajdhani font-bold text-sm ${RANK_COLORS[user.rank]}`}>
              {user.rank}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex gap-2">
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveName()}
                  className="flex-1 bg-surface2 border border-gold rounded-lg px-2 py-1 text-white text-sm outline-none font-rajdhani font-bold"
                  autoFocus
                />
                <button onClick={saveName} className="font-mono text-[10px] text-gold border border-gold/40 rounded-lg px-2">SAVE</button>
                <button onClick={() => setIsEditingName(false)} className="font-mono text-[10px] text-muted border border-border rounded-lg px-2">✕</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="font-rajdhani font-bold text-2xl text-white tracking-wide leading-none uppercase truncate">
                  {user.username}
                </div>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="font-mono text-[9px] text-muted hover:text-gold transition-colors flex-shrink-0"
                >
                  ✏️
                </button>
              </div>
            )}
            <div className="font-mono text-[10px] text-purple tracking-widest mt-1 uppercase">{user.title}</div>
            <div className="font-mono text-[10px] text-muted mt-0.5">
              Level <span className="text-gold font-bold">{user.level}</span> · {user.totalXP.toLocaleString()} total XP
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="font-mono text-[10px] text-muted">LEVEL {user.level + 1} PROGRESS</span>
            <span className="font-mono text-[10px] text-gold">{user.currentXP} / {xpNeeded} XP</span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple to-gold transition-all duration-700"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Quests Done", val: stats.totalQuests, color: "text-cyan", icon: "⚔️" },
            { label: "Missions Done", val: stats.totalMissions, color: "text-purple", icon: "🎯" },
            { label: "Journal Entries", val: stats.totalJournal, color: "text-orange", icon: "📖" },
            { label: "Achievements", val: unlockedAchievements.length, color: "text-gold", icon: "🏆" },
          ].map(s => (
            <div key={s.label} className="bg-surface2 border border-border rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">{s.icon}</span>
              <div>
                <div className={`font-rajdhani font-bold text-2xl leading-none ${s.color}`}>{s.val}</div>
                <div className="font-mono text-[9px] text-muted mt-0.5 tracking-wide">{s.label.toUpperCase()}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Next rank callout */}
        {nextRankLevel && (
          <div className="border border-gold/20 bg-gold/5 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <div className="font-mono text-[9px] text-muted tracking-widest uppercase">Next Rank</div>
              <div className="font-rajdhani font-bold text-sm text-white mt-0.5">
                Reach level <span className="text-gold">{nextRankLevel}</span> to rank up to <span className="text-gold">{rankFromLevel(nextRankLevel)}</span>
              </div>
            </div>
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-rajdhani font-bold text-lg ${RANK_COLORS[rankFromLevel(nextRankLevel)]}`}>
              {rankFromLevel(nextRankLevel)}
            </div>
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {(["achievements", "history"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl border font-mono text-[10px] tracking-widest uppercase transition-all ${activeTab === tab
                ? "border-gold bg-gold/10 text-gold"
                : "border-border text-muted"
              }`}
          >
            {tab === "achievements" ? "🏆 Achievements" : "📜 History"}
          </button>
        ))}
      </div>

      {/* Achievements tab */}
      {activeTab === "achievements" && (
        <div className="space-y-3">
          {/* Unlocked */}
          {unlockedAchievements.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-px bg-gold"></div>
                <span className="font-mono text-[10px] text-muted tracking-widest">UNLOCKED · {unlockedAchievements.length}</span>
              </div>
              {unlockedAchievements.map(a => (
                <div key={a.id} className="flex items-center gap-3 bg-surface border border-gold/25 bg-gold/5 rounded-xl px-4 py-3">
                  <span className="text-2xl">{a.icon}</span>
                  <div className="flex-1">
                    <div className="font-rajdhani font-bold text-sm text-gold">{a.title}</div>
                    <div className="font-mono text-[10px] text-muted mt-0.5">{a.desc}</div>
                  </div>
                  <span className="font-mono text-[10px] text-gold">✓</span>
                </div>
              ))}
            </div>
          )}

          {/* Locked */}
          {lockedAchievements.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-px bg-muted/40"></div>
                <span className="font-mono text-[10px] text-muted tracking-widest">LOCKED · {lockedAchievements.length}</span>
              </div>
              {lockedAchievements.map(a => (
                <div key={a.id} className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3 opacity-40">
                  <span className="text-2xl grayscale">{a.icon}</span>
                  <div className="flex-1">
                    <div className="font-rajdhani font-bold text-sm text-muted">{a.title}</div>
                    <div className="font-mono text-[10px] text-muted mt-0.5">{a.desc}</div>
                  </div>
                  <span className="font-mono text-[10px] text-muted">🔒</span>
                </div>
              ))}
            </div>
          )}

          {unlockedAchievements.length === 0 && (
            <div className="text-center py-10 opacity-30">
              <div className="text-4xl mb-2">🏆</div>
              <div className="font-mono text-xs text-muted">Complete quests and missions to unlock achievements</div>
            </div>
          )}
        </div>
      )}

      {/* History tab */}
      {activeTab === "history" && (
        <HistoryTab />
      )}

      {/* Settings section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-px bg-red"></div>
          <span className="font-mono text-[10px] text-muted tracking-widest uppercase">Data Management</span>
        </div>
        <button
          onClick={() => setShowClearData(true)}
          className="w-full flex items-center justify-between px-4 py-3 bg-surface border border-border rounded-xl hover:border-red/40 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🗑️</span>
            <div className="text-left">
              <div className="font-rajdhani font-bold text-sm text-white">Clear Data</div>
              <div className="font-mono text-[9px] text-muted mt-0.5">Manage or reset your data</div>
            </div>
          </div>
          <span className="font-mono text-[10px] text-muted">→</span>
        </button>
      </div>

      {/* Clear Data Modal */}
      {showClearData && (
        <div className="fixed inset-0 z-50 flex items-end justify-center left-0 right-0 max-w-sm mx-auto">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowClearData(false)} />
          <div className="relative w-full bg-surface border-t border-border rounded-t-2xl p-5 space-y-3 z-50">

            <div className="flex items-center justify-between mb-2">
              <span className="font-rajdhani font-bold text-lg text-white tracking-wide">Clear Data</span>
              <button onClick={() => setShowClearData(false)} className="text-muted text-xl">✕</button>
            </div>

            <div className="font-mono text-[10px] text-muted tracking-wide mb-4">
              Select what you want to clear. This cannot be undone.
            </div>

            {/* Individual clear options */}
            {[
              { label: "Clear Quests", sub: "Remove all quest history", icon: "⚔️", action: clearQuests, color: "hover:border-cyan/40" },
              { label: "Clear Missions", sub: "Remove all mission history", icon: "🎯", action: clearMissions, color: "hover:border-purple/40" },
              { label: "Clear Journal", sub: "Remove all journal entries", icon: "📖", action: clearJournal, color: "hover:border-orange/40" },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                className={`w-full flex items-center gap-3 px-4 py-3 bg-surface2 border border-border rounded-xl transition-all ${item.color}`}
              >
                <span className="text-lg">{item.icon}</span>
                <div className="text-left flex-1">
                  <div className="font-rajdhani font-bold text-sm text-white">{item.label}</div>
                  <div className="font-mono text-[9px] text-muted mt-0.5">{item.sub}</div>
                </div>
              </button>
            ))}

            {/* Divider */}
            <div className="h-px bg-border my-2" />

            {/* Nuclear option */}
            <button
              onClick={clearAllData}
              className="w-full flex items-center gap-3 px-4 py-3 bg-red/10 border border-red/30 rounded-xl hover:bg-red/20 transition-all"
            >
              <span className="text-lg">💥</span>
              <div className="text-left flex-1">
                <div className="font-rajdhani font-bold text-sm text-red">Reset Everything</div>
                <div className="font-mono text-[9px] text-muted mt-0.5">Wipe all data and start fresh</div>
              </div>
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

function HistoryTab() {
  const [recentQuests, setRecentQuests] = useState<any[]>([])
  const [recentMissions, setRecentMissions] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const quests = await db.quests
        .filter(q => q.isCompleted)
        .reverse()
        .limit(10)
        .toArray()
      const missions = await db.missions
        .filter(m => m.isCompleted)
        .reverse()
        .limit(5)
        .toArray()
      setRecentQuests(quests)
      setRecentMissions(missions)
    }
    load()
  }, [])

  return (
    <div className="space-y-4">
      {/* Recent quests */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-px bg-cyan"></div>
          <span className="font-mono text-[10px] text-muted tracking-widest uppercase">Recent Quests</span>
        </div>
        {recentQuests.length === 0 ? (
          <div className="font-mono text-[10px] text-muted text-center py-4 opacity-40">No completed quests yet</div>
        ) : (
          <div className="space-y-1.5">
            {recentQuests.map(q => (
              <div key={q.id} className="flex items-center gap-3 px-3 py-2.5 bg-surface border border-border rounded-xl">
                <div className="w-4 h-4 rounded border border-green bg-green/20 flex items-center justify-center text-[10px] text-green font-bold flex-shrink-0">✓</div>
                <span className="text-sm text-muted flex-1 truncate">{q.title}</span>
                <span className="font-mono text-[9px] text-gold flex-shrink-0">+{q.xpReward} XP</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent missions */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-px bg-purple"></div>
          <span className="font-mono text-[10px] text-muted tracking-widest uppercase">Completed Missions</span>
        </div>
        {recentMissions.length === 0 ? (
          <div className="font-mono text-[10px] text-muted text-center py-4 opacity-40">No completed missions yet</div>
        ) : (
          <div className="space-y-1.5">
            {recentMissions.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 bg-surface border border-purple/20 rounded-xl">
                <span className="text-sm flex-shrink-0">🎯</span>
                <span className="text-sm text-muted flex-1 truncate">{m.title}</span>
                <span className="font-mono text-[9px] text-gold flex-shrink-0">+{m.xpReward} XP</span>
              </div>
            ))}
          </div>
        )}

      </div>


    </div>
  )
}

