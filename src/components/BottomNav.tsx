import { motion } from "framer-motion"

const tabs = [
  { id: "quests", icon: "⚔️", label: "Quests" },
  { id: "missions", icon: "🎯", label: "Missions" },
  { id: "stats", icon: "📊", label: "Stats" },
  { id: "journal", icon: "📖", label: "Journal" },
  { id: "profile", icon: "👤", label: "Profile" },
]

export function BottomNav({ activeTab, onTabChange }: {
  activeTab: string
  onTabChange: (tab: string) => void
}) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-bg border-t border-border flex z-10">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex flex-col items-center gap-1 py-3 relative"
          >
            {/* Active indicator dot */}
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute top-0 w-6 h-0.5 bg-gold rounded-full"
                style={{ left: "50%", transform: "translateX(-50%)" }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}

            {/* Icon with scale animation */}
            <motion.span
              className="text-xl"
              animate={{ scale: isActive ? 1.15 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {tab.icon}
            </motion.span>

            {/* Label */}
            <motion.span
              className="font-mono text-[9px] tracking-widest uppercase"
              animate={{ color: isActive ? "#f0c040" : "#6a6a8a" }}
              transition={{ duration: 0.15 }}
            >
              {tab.label}
            </motion.span>
          </button>
        )
      })}
    </div>
  )
}