import { SubNav } from "./SubNav"
import { PageTransition } from "./PageTransition"
import { AIPanel } from "./AIPanel"



const LIFE_TABS = [
  { id: "travel", icon: "🗺️", label: "Travel" },
  { id: "fitness", icon: "💪", label: "Fitness" },
  { id: "finance", icon: "💰", label: "Finance" },
  { id: "education", icon: "🎓", label: "Education" },
  { id: "books", icon: "📚", label: "Books" },
]

const AI_CONTEXTS: Record<string, { systemPrompt: string; suggestions: string[] }> = {
  travel: {
    systemPrompt: "You are helping the user plan travel goals and log places they've visited. Suggest travel missions, help them set exploration goals, and inspire them to discover new places.",
    suggestions: [
      "Create a travel mission for this year",
      "Suggest places to visit near me",
      "Help me plan my next trip as a mission",
    ],
  },
  fitness: {
    systemPrompt: "You are a fitness coach helping the user build strength, track workouts, and hit personal records. Create workout missions, suggest training habits, and help them progress safely.",
    suggestions: [
      "Create a workout plan as missions",
      "What fitness habits should I start?",
      "Help me set a realistic PR goal",
    ],
  },
  finance: {
    systemPrompt: "You are a financial coach helping the user budget, save, and build wealth. Create savings missions, suggest financial habits, and help them reach their money goals.",
    suggestions: [
      "Create a savings mission for me",
      "What financial habits should I build?",
      "Help me plan my budget as quests",
    ],
  },
  education: {
    systemPrompt: "You are a learning coach helping the user acquire new skills and knowledge. Create learning paths as missions, suggest study habits, and help them stay consistent with education goals.",
    suggestions: [
      "Create a learning path for a new skill",
      "What should I study next?",
      "Turn my education goal into missions",
    ],
  },
  books: {
    systemPrompt: "You are a reading coach helping the user read more and get more out of books. Suggest books based on their goals, create reading missions, and help them write better book reports.",
    suggestions: [
      "Recommend books based on my goals",
      "Create a reading mission for this month",
      "Help me write a book report",
    ],
  },
}

function ComingSoon({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 opacity-30">
      <span className="text-5xl">{icon}</span>
      <span className="font-rajdhani font-bold text-2xl tracking-widest uppercase text-gold">{title}</span>
      <span className="font-mono text-xs text-muted">Coming in v1.5</span>
    </div>
  )
}

export function LifeHub({ activeSubTab, onSubTabChange,  aiOpen, onAIClose }: {
  activeSubTab: string
  onSubTabChange: (tab: string) => void
  aiOpen: boolean
  onAIClose: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      <SubNav
        items={LIFE_TABS}
        activeItem={activeSubTab}
        onItemChange={(tab) => { onSubTabChange(tab) }}
      />

      {/* AI Panel — slides in under sub-nav */}
      {aiOpen && (
        <AIPanel
          context={{
            screen: activeSubTab,
            systemPrompt: AI_CONTEXTS[activeSubTab]?.systemPrompt ?? AI_CONTEXTS.travel.systemPrompt,
            suggestions: AI_CONTEXTS[activeSubTab]?.suggestions ?? AI_CONTEXTS.travel.suggestions,
            onAction: () => { },
          }}
          onClose={onAIClose}
        />
      )}


      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-24">
        <PageTransition tabKey={activeSubTab}>
          {activeSubTab === "travel" && <ComingSoon title="Travel" icon="🗺️" />}
          {activeSubTab === "fitness" && <ComingSoon title="Fitness" icon="💪" />}
          {activeSubTab === "finance" && <ComingSoon title="Finance" icon="💰" />}
          {activeSubTab === "education" && <ComingSoon title="Education" icon="🎓" />}
          {activeSubTab === "books" && <ComingSoon title="Books" icon="📚" />}
        </PageTransition>
      </div>
    </div>
  )
}
