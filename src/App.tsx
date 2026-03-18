import { useState, useEffect } from "react"
import { db, initUser, type Quest, type User } from "./db"
import { awardXP, xpForNextLevel, incrementStat } from "./xpEngine"
import MissionsPage from "./pages/MissionsPage"
import StatsPage from "./pages/StatsPage"
import JournalPage from "./pages/JournalPage"
import ProfilePage from "./pages/ProfilePage"
import { PageTransition } from "./components/PageTransition"
import { BottomNav } from "./components/BottomNav"
import { LevelUpOverlay } from "./components/LevelUpOverlay"
import { AnimatedQuestRow } from "./components/AnimatedQuestRow.tsx"
import { AnimatePresence } from "framer-motion"
import { XPBar } from "./components/XPBar"
import { Onboarding } from "./components/Onboarding"
import { Auth } from "./components/Auth"
import { supabase } from "./supabase"
import { type Session } from "@supabase/supabase-js"
import { pullFromCloud, syncQuestToCloud } from "./sync"

export default function App() {
  const [activeTab, setActiveTab] = useState("quests")
  const [user, setUser] = useState<User | null>(null)
  const [levelUpMsg, setLevelUpMsg] = useState<string | null>(null)
  const [isRankUp, setIsRankUp] = useState(false)
  const [onboarded, setOnboarded] = useState(localStorage.getItem("lvlup-onboarded") === "true")
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
      if (session) {
        pullFromCloud().then(() => initUser().then(loadUser))
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        pullFromCloud().then(() => initUser().then(loadUser))
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    initUser().then(loadUser)
  }, [])

  async function loadUser() {
    const u = await db.users.toCollection().first()
    if (u) setUser(u)
  }

  async function handleQuestComplete(quest: Quest) {
    if (!quest.id || quest.isCompleted) return

    await db.quests.update(quest.id, {
      isCompleted: true,
      completedAt: new Date(),
    })
    const updatedQuest = await db.quests.get(quest.id!)
    if (updatedQuest) await syncQuestToCloud(updatedQuest)

    const previousUser = await db.users.toCollection().first()
    const previousRank = previousUser?.rank

    const result = await awardXP(quest.xpReward)
    await incrementStat(quest.category)
    await loadUser()

    const updatedUser = await db.users.toCollection().first()
    const newRank = updatedUser?.rank

    if (result.leveledUp) {
      const rankChanged = newRank && previousRank && newRank !== previousRank
      setIsRankUp(!!rankChanged)
      setLevelUpMsg(
        rankChanged
          ? `${previousRank} → ${newRank}`
          : `Level ${result.newLevel} · Rank ${result.newRank}`
      )
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="font-rajdhani font-bold text-2xl text-gold tracking-widest animate-pulse">
          LVL_UP
        </div>
      </div>
    )
  }

  if (!session) {
    return <Auth onAuth={() => supabase.auth.getSession().then(({ data: { session } }) => setSession(session))} />
  }


  if (!onboarded) {
    return <Onboarding onComplete={() => { setOnboarded(true); initUser().then(loadUser) }} />
  }



  return (


    <div className="min-h-screen bg-bg text-white flex flex-col max-w-sm mx-auto relative">

      {/* Level up toast */}
      <LevelUpOverlay
        message={levelUpMsg}
        isRankUp={isRankUp}
        onDone={() => { setLevelUpMsg(null); setIsRankUp(false) }} />

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
            <button
              onClick={() => supabase.auth.signOut()}
              className="font-mono text-[9px] text-muted hover:text-red transition-colors tracking-widest"
            >
              EXIT
            </button>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto pb-24 px-5 pt-5">
        <PageTransition tabKey={activeTab}>
          {activeTab === "quests" && user && (
            <QuestsPage user={user} onQuestComplete={handleQuestComplete} />
          )}
          {activeTab === "missions" && (
            <MissionsPage
              onUserUpdate={loadUser}
              onLevelUp={(msg, rankUp) => {
                setIsRankUp(rankUp)
                setLevelUpMsg(msg)
              }}
            />
          )}
          {activeTab === "stats" && user && (
            <StatsPage user={user} />
          )}
          {activeTab === "journal" && (
            <JournalPage
              onLevelUp={(msg, rankUp) => {
                setIsRankUp(rankUp)
                setLevelUpMsg(msg)
              }}
            />
          )}
          {activeTab === "profile" && user && (
            <ProfilePage user={user} onUserUpdate={loadUser} />
          )}
        </PageTransition>
      </div>

      {/* Bottom nav */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )


}

function QuestsPage({ user, onQuestComplete, }: {
  user: User
  onQuestComplete: (q: Quest) => void
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
        <XPBar currentXP={user.currentXP} xpNeeded={xpNeeded} level={user.level} />

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
            <AnimatePresence>
              {quests.map((quest) => (
                <AnimatedQuestRow
                  key={quest.id}
                  quest={quest}
                  onComplete={() => { onQuestComplete(quest); loadQuests() }}
                />
              ))}
            </AnimatePresence>
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
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
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
                className={`font-mono text-[10px] py-2 rounded-lg border transition-all tracking-wide ${category === cat
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
                className={`font-mono text-[10px] py-2 rounded-lg border transition-all tracking-wide ${frequency === freq
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
