import { SubNav } from "./SubNav"
import QuestsPage from "../pages/QuestsPage"
import MissionsPage from "../pages/MissionsPage"
import HabitsPage from "../pages/HabitsPage"
import JournalPage from "../pages/JournalPage"
import { type User, type Quest } from "../db"
import { PageTransition } from "./PageTransition"
import { AIPanel } from "./AIPanel"

const PLAY_TABS = [
  { id: "quests", icon: "⚔️", label: "Quests" },
  { id: "missions", icon: "🎯", label: "Missions" },
  { id: "habits", icon: "🔄", label: "Habits" },
  { id: "journal", icon: "📖", label: "Journal" },
]

const AI_CONTEXTS: Record<string, { systemPrompt: string; suggestions: string[] }> = {
  quests: {
    systemPrompt: "You are helping the user plan their daily and weekly quests. Suggest specific, achievable quests based on their stats and goals. Focus on actionable tasks they can complete today or this week.",
    suggestions: [
      "What quests should I focus on today?",
      "Create 3 quests to boost my weakest stat",
      "Give me a challenging weekly quest",
    ],
  },
  missions: {
    systemPrompt: "You are helping the user define and break down big life goals into missions. Help them think big and create ambitious but realistic missions with clear steps.",
    suggestions: [
      "Help me create a main quest for this month",
      "Break down my biggest goal into mission steps",
      "What mission should I focus on next?",
    ],
  },
  habits: {
    systemPrompt: "You are helping the user build a powerful daily routine through habits. Suggest habits based on their current stats and what they want to improve. Focus on consistency over intensity.",
    suggestions: [
      "What habits should I build first?",
      "Create a morning routine for me",
      "Which of my stats needs the most habit support?",
    ],
  },
  journal: {
    systemPrompt: "You are helping the user reflect on their life and progress. Generate thoughtful journal prompts, analyze their mood patterns, and help them extract insights from their journey.",
    suggestions: [
      "Give me a journal prompt for today",
      "What patterns do you see in my progress?",
      "Help me reflect on this week",
    ],
  },
}

export function PlayHub({ activeSubTab, onSubTabChange, user, onQuestComplete, streak, longestStreak, onUserUpdate, onLevelUp, aiOpen, onAIClose }: {
  activeSubTab: string
  onSubTabChange: (tab: string) => void
  user: User
  onQuestComplete: (q: Quest) => void
  streak: number
  longestStreak: number
  onUserUpdate: () => void
  onLevelUp: (msg: string, isRankUp: boolean) => void
  aiOpen: boolean
  onAIClose: () => void
}) {

  return (
    <div className="flex flex-col h-full">
      <SubNav
        items={PLAY_TABS}
        activeItem={activeSubTab}
        onItemChange={(tab) => { onSubTabChange(tab) }}
      />

      {/* AI Panel — slides in under sub-nav */}
      {aiOpen && (
        <AIPanel
          context={{
            screen: activeSubTab,
            systemPrompt: AI_CONTEXTS[activeSubTab]?.systemPrompt ?? AI_CONTEXTS.quests.systemPrompt,
            suggestions: AI_CONTEXTS[activeSubTab]?.suggestions ?? AI_CONTEXTS.quests.suggestions,
            onAction: () => { },
          }}
          onClose={onAIClose}
        />
      )}

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
            <HabitsPage
              onUserUpdate={onUserUpdate}
              onLevelUp={onLevelUp}
            />
          )}
          {activeSubTab === "journal" && (
            <JournalPage onLevelUp={onLevelUp} />
          )}
        </PageTransition>
      </div>
    </div>
  )
}