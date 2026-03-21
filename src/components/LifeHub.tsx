import { SubNav } from "./SubNav"
import { PageTransition } from "./PageTransition"

const LIFE_TABS = [
  { id: "travel",    icon: "🗺️", label: "Travel"    },
  { id: "fitness",   icon: "💪", label: "Fitness"   },
  { id: "finance",   icon: "💰", label: "Finance"   },
  { id: "education", icon: "🎓", label: "Education" },
  { id: "books",     icon: "📚", label: "Books"     },
]

function ComingSoon({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 opacity-30">
      <span className="text-5xl">{icon}</span>
      <span className="font-rajdhani font-bold text-2xl tracking-widest uppercase text-gold">{title}</span>
      <span className="font-mono text-xs text-muted">Coming in v1.5</span>
    </div>
  )
}

export function LifeHub({ activeSubTab, onSubTabChange }: {
  activeSubTab: string
  onSubTabChange: (tab: string) => void
}) {
  return (
    <div className="flex flex-col h-full">
      <SubNav
        items={LIFE_TABS}
        activeItem={activeSubTab}
        onItemChange={onSubTabChange}
      />
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-24">
        <PageTransition tabKey={activeSubTab}>
          {activeSubTab === "travel"    && <ComingSoon title="Travel"    icon="🗺️" />}
          {activeSubTab === "fitness"   && <ComingSoon title="Fitness"   icon="💪" />}
          {activeSubTab === "finance"   && <ComingSoon title="Finance"   icon="💰" />}
          {activeSubTab === "education" && <ComingSoon title="Education" icon="🎓" />}
          {activeSubTab === "books"     && <ComingSoon title="Books"     icon="📚" />}
        </PageTransition>
      </div>
    </div>
  )
}