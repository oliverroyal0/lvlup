import { useState, useEffect } from "react"
import { type Session } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import { db, type User, type Quest } from "./db"
import { initUser } from "./db"
import { awardXP, incrementStat } from "./xpEngine"
import { pullFromCloud, syncQuestToCloud } from "./sync"
import { updateStreak, getCurrentStreak } from "./streakEngine"
import { requestNotificationPermission, scheduleDailyReminder } from "./notificationEngine"
import { Auth } from "./components/Auth"
import { Onboarding } from "./components/Onboarding"
import { BottomNav } from "./components/BottomNav"
import { PageTransition } from "./components/PageTransition"
import { LevelUpOverlay } from "./components/LevelUpOverlay"
import { StreakPopup } from "./components/StreakPopup"
import { PlayHub } from "./components/PlayHub"
import { LifeHub } from "./components/LifeHub"
import StatsPage from "./pages/StatsPage"
import ProfilePage from "./pages/ProfilePage"
import { type Streak } from "./db"


export default function App() {
  const [activeTab, setActiveTab] = useState("play")
  const [playSubTab, setPlaySubTab] = useState("quests")
  const [lifeSubTab, setLifeSubTab] = useState("travel")
  const [user, setUser] = useState<User | null>(null)
  const [levelUpMsg, setLevelUpMsg] = useState<string | null>(null)
  const [isRankUp, setIsRankUp] = useState(false)
  const [onboarded, setOnboarded] = useState(localStorage.getItem("lvlup-onboarded") === "true")
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [showStreakPopup, setShowStreakPopup] = useState(false)
  const [streakData, setStreakData] = useState<Streak | null>(null)
  const [aiOpen, setAiOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
      if (session) {
        pullFromCloud().then(() => initUser().then(loadUser))
        requestNotificationPermission().then(granted => {
          if (granted) scheduleDailyReminder()
        })
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
    loadStreak()
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
    await updateStreak()
    await loadStreak()

    const updatedStreak = await updateStreak()
    await loadStreak()
    setStreakData(updatedStreak)
    setShowStreakPopup(true)
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

  async function loadStreak() {
    const s = await getCurrentStreak()
    setStreak(s.currentStreak)
    setLongestStreak(s.longestStreak)
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

      {/* Level up + rank up overlay */}
      <LevelUpOverlay
        message={levelUpMsg}
        isRankUp={isRankUp}
        onDone={() => { setLevelUpMsg(null); setIsRankUp(false) }}
      />

      {/* Streak popup */}
      <StreakPopup
        streak={streak}
        activeDays={streakData?.activeDays ?? []}
        show={showStreakPopup}
        onDone={() => setShowStreakPopup(false)}
      />

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg sticky top-0 z-10">
        <div className="font-rajdhani font-bold text-xl tracking-widest text-gold uppercase">
          LVL<span className="text-white opacity-40">_</span>UP
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-gold">🔥 {streak}</span>

          {/* AI button */}
          <button
            onClick={() => setAiOpen(!aiOpen)}
            className={`w-8 h-8 border rounded-md flex items-center justify-center text-sm transition-all ${aiOpen
              ? "border-purple/40 bg-purple/10"
              : "border-border hover:border-purple/40 hover:bg-purple/10"
              }`}
          >
            ✨
          </button>

          <div
            onClick={() => requestNotificationPermission().then(granted => {
              if (granted) scheduleDailyReminder()
            })}
            className="relative w-8 h-8 border border-border rounded-md flex items-center justify-center text-sm cursor-pointer hover:border-gold transition-colors"
          >
            🔔
            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red rounded-full"></div>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="font-mono text-[9px] text-muted hover:text-red transition-colors tracking-widest border border-border rounded-md px-2 py-1.5"
          >
            LOGOUT
          </button>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <PageTransition tabKey={activeTab}>
          {activeTab === "play" && user && (
            <PlayHub
              activeSubTab={playSubTab}
              onSubTabChange={setPlaySubTab}
              user={user}
              onQuestComplete={handleQuestComplete}
              streak={streak}
              longestStreak={longestStreak}
              onUserUpdate={loadUser}
              onLevelUp={(msg, rankUp) => {
                setIsRankUp(rankUp)
                setLevelUpMsg(msg)
              }}
              aiOpen={aiOpen}
              onAIClose={() => setAiOpen(false)}
            />
          )}

          {activeTab === "stats" && user && (
            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-24">
              <StatsPage user={user} />
            </div>
          )}

          {activeTab === "life" && (
            <LifeHub
              activeSubTab={lifeSubTab}
              onSubTabChange={setLifeSubTab}
              aiOpen={aiOpen}
              onAIClose={() => setAiOpen(false)}
            />
          )}
          {activeTab === "guild" && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 opacity-30 px-5 pt-5">
              <span className="text-5xl">👥</span>
              <span className="font-rajdhani font-bold text-2xl tracking-widest uppercase text-cyan">Guild</span>
              <span className="font-mono text-xs text-muted">Coming in v2.5</span>
            </div>
          )}
          {activeTab === "profile" && user && (
            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-24">
              <ProfilePage user={user} onUserUpdate={loadUser} />
            </div>
          )}
        </PageTransition>
      </div>

      {/* Bottom nav */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

    </div>
  )
}