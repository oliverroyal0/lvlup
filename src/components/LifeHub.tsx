import { SubNav } from "./SubNav"
import { PageTransition } from "./PageTransition"
import { AIPanel } from "./AIPanel"
import TravelPage from "../pages/TravelPage"
import FitnessPage from "../pages/FitnessPage"
import FinancePage from "../pages/FinancePage"


const LIFE_TABS = [
  { id: "travel", icon: "🗺️", label: "Travel" },
  { id: "fitness", icon: "💪", label: "Fitness" },
  { id: "finance", icon: "💰", label: "Finance" },
  { id: "education", icon: "🎓", label: "Education" },
  { id: "books", icon: "📚", label: "Books" },
]

const AI_CONTEXTS: Record<string, { systemPrompt: string; suggestions: string[] }> = {
  travel: {
    systemPrompt: "Help the user build an exciting travel life. Create travel missions, bucket list goals, and exploration habits. Connect travel to their Explorer stat growth.",
    suggestions: [
      "Help me build a travel bucket list as missions",
      "I want to explore more locally — what habits help?",
      "Create a mission for my next trip",
      "How do I grow my Explorer stat faster?",
      "Plan a weekend adventure mission for me",
      "I want to visit 10 countries — break it into a yearly mission",
    ],
  },
  fitness: {
    systemPrompt: "You are a serious fitness coach. Help with workout programming, PR goals, body composition, and recovery. Connect fitness to Strength stat growth and overall character power.",
    suggestions: [
      "Build me a workout plan as missions and habits",
      "Help me set realistic PR goals for the next 3 months",
      "What fitness habits give the most XP for time invested?",
      "I want to get stronger — where do I start?",
      "Create a recovery routine as daily habits",
      "Build a 30-day fitness challenge as a seasonal mission",
    ],
  },
  finance: {
    systemPrompt: "You are a sharp financial coach. Help with budgeting, saving, debt, income growth, and wealth building. Turn financial goals into trackable missions and daily habits.",
    suggestions: [
      "Help me build a budget as daily and weekly habits",
      "Create a savings mission for a specific goal",
      "What financial habits should I start immediately?",
      "I want to increase my income — turn it into missions",
      "Help me track my net worth as a yearly mission",
      "Build a debt payoff plan as a main quest",
    ],
  },
  education: {
    systemPrompt: "You are a learning strategist. Help build complete learning paths, study habits, and skill acquisition missions. Connect education to Mind stat growth and career goals.",
    suggestions: [
      "I want to learn a new skill — build me a full learning path",
      "What study habits will boost my Mind stat fastest?",
      "Create a reading and learning routine for me",
      "Turn my career development goal into missions",
      "I want to get certified in something — break it down",
      "Build a 90-day self-education mission plan",
    ],
  },
  books: {
    systemPrompt: "You are a reading coach and book advisor. Help with reading goals, book recommendations, and getting maximum value from books. Connect reading to Mind and Focus stat growth.",
    suggestions: [
      "Recommend books based on my goals and stats",
      "Help me set a reading goal for this year as a mission",
      "Build a reading habit that actually sticks",
      "I just finished a book — help me write a report",
      "What books would level up my weakest stat?",
      "Create a reading challenge mission for this month",
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

export function LifeHub({ activeSubTab, onSubTabChange, aiOpen, onAIClose, onUserUpdate }: {
  activeSubTab: string
  onSubTabChange: (tab: string) => void
  aiOpen: boolean
  onAIClose: () => void
  onUserUpdate: () => void
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
          {activeSubTab === "travel" && (
            <TravelPage onUserUpdate={() => { }} />
          )}
          {activeSubTab === "fitness" && (
            <FitnessPage onUserUpdate={onUserUpdate} />
          )}
          {activeSubTab === "finance" && (
            <FinancePage onUserUpdate={onUserUpdate} />
          )}
          {activeSubTab === "education" && <ComingSoon title="Education" icon="🎓" />}
          {activeSubTab === "books" && <ComingSoon title="Books" icon="📚" />}
        </PageTransition>
      </div>
    </div>
  )
}
