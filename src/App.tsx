import { useState, useEffect } from "react"
import { db, initUser, type Quest, type User } from "./db"
import { awardXP, incrementStat } from "./xpEngine"
import MissionsPage from "./pages/MissionsPage"
import StatsPage from "./pages/StatsPage"
import JournalPage from "./pages/JournalPage"
import ProfilePage from "./pages/ProfilePage"
import { PageTransition } from "./components/PageTransition"
import { BottomNav } from "./components/BottomNav"
import { LevelUpOverlay } from "./components/LevelUpOverlay"
import { Onboarding } from "./components/Onboarding"
import { Auth } from "./components/Auth"
import { supabase } from "./supabase"
import { type Session } from "@supabase/supabase-js"
import { pullFromCloud, syncQuestToCloud } from "./sync"
import { updateStreak, getCurrentStreak } from "./streakEngine"
import { requestNotificationPermission, scheduleDailyReminder } from "./notificationEngine"
import QuestsPage from "./pages/QuestsPage"
import { StreakPopup } from "./components/StreakPopup"
import { type Streak } from "./db"

export default function App() {
  const [activeTab, setActiveTab] = useState("quests")
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

      {/* Level up pop-up */}
      <LevelUpOverlay
        message={levelUpMsg}
        isRankUp={isRankUp}
        onDone={() => { setLevelUpMsg(null); setIsRankUp(false) }} />

      {/* streak pop-up */}
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
            Logout
          </button>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto pb-24 px-5 pt-5">
        <PageTransition tabKey={activeTab}>
          {activeTab === "quests" && user && (
            <QuestsPage user={user} onQuestComplete={handleQuestComplete} streak={streak} longestStreak={longestStreak} />
          )}

          {activeTab === "missions" && (
            <MissionsPage onUserUpdate={loadUser} onLevelUp={(msg, rankUp) => {
              setIsRankUp(rankUp)
              setLevelUpMsg(msg)
            }} />
          )}

          {activeTab === "stats" && user && (
            <StatsPage user={user} />
          )}

          {activeTab === "journal" && (
            <JournalPage
              onLevelUp={(msg, rankUp) => {
                setIsRankUp(rankUp)
                setLevelUpMsg(msg)
              }} />
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

