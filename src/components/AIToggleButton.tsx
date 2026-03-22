import { motion } from "framer-motion"

export function AIToggleButton({ isOpen, onToggle }: {
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.9 }}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-mono text-[9px] tracking-widest transition-all ${
        isOpen
          ? "border-purple bg-purple/15 text-purple"
          : "border-border text-muted hover:border-purple/40 hover:text-purple"
      }`}
    >
      <span className="text-sm">✨</span>
      <span>AI</span>
    </motion.button>
  )
}