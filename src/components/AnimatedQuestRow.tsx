import { motion } from "framer-motion"
import { type Quest } from "../db"

export function AnimatedQuestRow({ quest, onComplete }: {
  quest: Quest
  onComplete: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={onComplete}
      className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3 cursor-pointer active:opacity-70"
    >
      <motion.div
        className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${
          quest.isCompleted
            ? "bg-green border-green text-bg text-xs font-bold"
            : "border-border"
        }`}
        animate={quest.isCompleted ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {quest.isCompleted && "✓"}
      </motion.div>

      <div className="flex-1 min-w-0">
        <motion.div
          className="text-sm"
          animate={{
            color: quest.isCompleted ? "#6a6a8a" : "#e8e8f0",
            textDecoration: quest.isCompleted ? "line-through" : "none",
          }}
          transition={{ duration: 0.2 }}
        >
          {quest.title}
        </motion.div>
        <div className="font-mono text-[9px] text-muted mt-0.5 uppercase">{quest.category}</div>
      </div>

      <motion.div
        className="font-mono text-[10px] text-gold flex-shrink-0"
        animate={{ opacity: quest.isCompleted ? 0.4 : 1 }}
      >
        +{quest.xpReward} XP
      </motion.div>
    </motion.div>
  )
}
