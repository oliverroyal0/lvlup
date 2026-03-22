import { useRef } from "react"
import { motion } from "framer-motion"
import { AIToggleButton } from "./AIToggleButton"

export function SubNav({ items, activeItem, onItemChange, showAI, aiOpen, onAIToggle }: {
  items: { id: string; label: string; icon: string }[]
  activeItem: string
  onItemChange: (id: string) => void
  showAI?: boolean
  aiOpen?: boolean
  onAIToggle?: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="border-b border-border bg-bg">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-4 pt-3 pb-3 scrollbar-none items-center"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map(item => {
          const isActive = activeItem === item.id
          return (
            <button
              key={item.id}
              onClick={() => onItemChange(item.id)}
              className="flex-shrink-0 relative"
            >
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] tracking-widest transition-all ${
                isActive
                  ? "bg-gold/10 text-gold border border-gold/40"
                  : "text-muted border border-border hover:border-muted/60"
              }`}>
                <span className="text-sm">{item.icon}</span>
                <span>{item.label.toUpperCase()}</span>
              </div>
              {isActive && (
                <motion.div
                  layoutId="subnav-indicator"
                  className="absolute -bottom-3 left-1/2 w-1 h-1 bg-gold rounded-full"
                  style={{ transform: "translateX(-50%)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          )
        })}

        {/* AI toggle — right side */}
        {showAI && onAIToggle && (
          <div className="ml-auto flex-shrink-0">
            <AIToggleButton isOpen={aiOpen ?? false} onToggle={onAIToggle} />
          </div>
        )}
      </div>
    </div>
  )
}