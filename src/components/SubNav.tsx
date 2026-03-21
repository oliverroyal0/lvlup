import { useRef } from "react"
import { motion } from "framer-motion"

export function SubNav({ items, activeItem, onItemChange }: {
  items: { id: string; label: string; icon: string }[]
  activeItem: string
  onItemChange: (id: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-border bg-bg scrollbar-none"
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
    </div>
  )
}