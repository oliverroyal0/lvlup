import { useState } from "react"
import { SubNav } from "./SubNav"
import QuestsPage from "../pages/QuestsPage"
import MissionsPage from "../pages/MissionsPage"
import HabitsPage from "../pages/HabitsPage"
import JournalPage from "../pages/JournalPage"
import { type User, type Quest } from "../db"
import { PageTransition } from "./PageTransition"
import { AIPanel } from "./AIPanel"

const PLAY_TABS = [
  { id: "quests",   icon: "⚔️", label: "Quests"   },
  { id: "missions", icon: "🎯", label: "Missions"  },
  { id: "habits",   icon: "🔄", label: "Habits"    },
  { id: "journal",  icon: "📖", label: "Journal"   },
]

const AI_CONTEXTS: Record<string, { systemPrompt: string; suggestions: string[] }> = {
  quests: {
    systemPrompt: "Focus on helping the user plan powerful daily and weekly quests. Connect quests to their weakest stats. Help them build momentum with quick wins.",
    suggestions: [
      "What should I focus on today based on my stats?",
      "My weakest stat is dragging me down — fix it",
      "Build me a full week of quests across all categories",
      "I want to level up fast — what's the most XP efficient strategy?",
      "Create quests that connect my fitness and mental growth",
      "I only have 30 minutes a day — what quests fit?",
    ],
  },
  missions: {
    systemPrompt: "Help the user define bold life goals and break them into missions with clear steps. Think big, plan smart. Connect missions to their overall character arc.",
    suggestions: [
      "Help me define my main quest for this year",
      "I have a big goal but don't know where to start",
      "Break down my career goal into missions and steps",
      "What seasonal mission should I be running right now?",
      "Create a side quest for something fun I want to do",
      "Review my active missions and tell me what to prioritize",
    ],
  },
  habits: {
    systemPrompt: "Help the user build a powerful daily routine. Focus on habit stacking, consistency over intensity, and connecting habits to stat growth. Make it sustainable.",
    suggestions: [
      "Build me a complete morning routine",
      "What habits will boost my weakest stats the fastest?",
      "I keep failing at habits — what am I doing wrong?",
      "Create a night routine that sets me up for tomorrow",
      "Stack habits that cover multiple stat categories at once",
      "I want to build a home routine — what should it include?",
    ],
  },
  journal: {
    systemPrompt: "Help the user reflect deeply and extract insights from their journey. Generate powerful prompts, spot mood patterns, and help them understand their own growth.",
    suggestions: [
      "Give me a powerful journal prompt for today",
      "What patterns do you see in my progress so far?",
      "I've been feeling off lately — help me process it",
      "Help me do a weekly review and plan next week",
      "What should I be grateful for based on my progress?",
      "Help me write about a goal I'm scared to pursue",
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
  const [refreshKey, setRefreshKey] = useState(0)

  function handleAIAction() {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="flex flex-col h-full">
      <SubNav
        items={PLAY_TABS}
        activeItem={activeSubTab}
        onItemChange={(tab) => { onSubTabChange(tab) }}
      />

      {aiOpen && (
        <AIPanel
          context={{
            screen: activeSubTab,
            systemPrompt: AI_CONTEXTS[activeSubTab]?.systemPrompt ?? AI_CONTEXTS.quests.systemPrompt,
            suggestions: AI_CONTEXTS[activeSubTab]?.suggestions ?? AI_CONTEXTS.quests.suggestions,
            onAction: handleAIAction,
          }}
          onClose={onAIClose}
        />
      )}

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-24">
        <PageTransition tabKey={activeSubTab}>
          {activeSubTab === "quests" && (
            <QuestsPage
              key={refreshKey}
              user={user}
              onQuestComplete={onQuestComplete}
              streak={streak}
              longestStreak={longestStreak}
            />
          )}
          {activeSubTab === "missions" && (
            <MissionsPage
              key={refreshKey}
              onUserUpdate={onUserUpdate}
              onLevelUp={onLevelUp}
            />
          )}
          {activeSubTab === "habits" && (
            <HabitsPage
              key={refreshKey}
              onUserUpdate={onUserUpdate}
              onLevelUp={onLevelUp}
            />
          )}
          {activeSubTab === "journal" && (
            <JournalPage
              key={refreshKey}
              onLevelUp={onLevelUp}
            />
          )}
        </PageTransition>
      </div>
    </div>
  )
}