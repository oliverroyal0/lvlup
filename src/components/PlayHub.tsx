import { SubNav } from "./SubNav"
import QuestsPage from "../pages/QuestsPage"
import MissionsPage from "../pages/MissionsPage"
import JournalPage from "../pages/JournalPage"
import { type User, type Quest } from "../db"
import { PageTransition } from "./PageTransition"

const PLAY_TABS = [
  { id: "quests",   icon: "⚔️", label: "Quests"   },
  { id: "missions", icon: "🎯", label: "Missions"  },
  { id: "habits",   icon: "🔄", label: "Habits"    },
  { id: "journal",  icon: "📖", label: "Journal"   },
]

export function PlayHub({ activeSubTab, onSubTabChange, user, onQuestComplete, streak, longestStreak, onUserUpdate, onLevelUp }: {
  activeSubTab: string
  onSubTabChange: (tab: string) => void
  user: User
  onQuestComplete: (q: Quest) => void
  streak: number
  longestStreak: number
  onUserUpdate: () => void
  onLevelUp: (msg: string, isRankUp: boolean) => void
}) {
  return (
    <div className="flex flex-col h-full">
      <SubNav
        items={PLAY_TABS}
        activeItem={activeSubTab}
        onItemChange={onSubTabChange}
      />
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-24">
        <PageTransition tabKey={activeSubTab}>
          {activeSubTab === "quests" && (
            <QuestsPage
              user={user}
              onQuestComplete={onQuestComplete}
              streak={streak}
              longestStreak={longestStreak}
            />
          )}
          {activeSubTab === "missions" && (
            <MissionsPage
              onUserUpdate={onUserUpdate}
              onLevelUp={onLevelUp}
            />
          )}
          {activeSubTab === "habits" && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 opacity-30">
              <span className="text-5xl">🔄</span>
              <span className="font-rajdhani font-bold text-2xl tracking-widest uppercase text-gold">Habits</span>
              <span className="font-mono text-xs text-muted">Coming next</span>
            </div>
          )}
          {activeSubTab === "journal" && (
            <JournalPage onLevelUp={onLevelUp} />
          )}
        </PageTransition>
      </div>
    </div>
  )
}