import { motion } from "framer-motion"

export function XPBar({ currentXP, xpNeeded, level }: {
  currentXP: number
  xpNeeded: number
  level: number
}) {
  const pct = Math.min((currentXP / xpNeeded) * 100, 100)

  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="font-mono text-[10px] text-muted tracking-wide">XP TO LEVEL {level + 1}</span>
        <span className="font-mono text-[10px] text-gold">{(xpNeeded - currentXP).toLocaleString()} remaining</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-purple to-gold"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}