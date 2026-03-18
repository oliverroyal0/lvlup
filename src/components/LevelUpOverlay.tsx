import { motion, AnimatePresence } from "framer-motion"

interface OverlayProps {
  message: string | null
  isRankUp?: boolean
  onDone: () => void
}

export function LevelUpOverlay({ message, isRankUp, onDone }: OverlayProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ left: 0, right: 0 }}
          onClick={onDone}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/85" />

          {/* Radial glow */}
          <div
            className="absolute inset-0"
            style={{
              background: isRankUp
                ? "radial-gradient(circle at center, rgba(155,111,240,0.15) 0%, transparent 70%)"
                : "radial-gradient(circle at center, rgba(240,192,64,0.12) 0%, transparent 70%)",
            }}
          />

          {/* Main content */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.1 }}
            className="relative z-10 flex flex-col items-center gap-5 px-10 text-center"
          >
            {/* Icon */}
            <motion.div
              animate={{ rotate: isRankUp ? 0 : 360, scale: [1, 1.2, 1] }}
              transition={{
                rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                scale: { duration: 0.6, delay: 0.3, repeat: Infinity, repeatDelay: 1.5 }
              }}
              className="text-8xl"
            >
              {isRankUp ? "🎖️" : "⭐"}
            </motion.div>

            {/* Label */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div
                className="font-mono text-[11px] tracking-widest uppercase mb-2"
                style={{ color: isRankUp ? "#9b6ff0" : "#f0c040" }}
              >
                {isRankUp ? "Rank Up" : "Level Up"}
              </div>
              <div className="font-rajdhani font-bold text-white leading-none"
                style={{ fontSize: "52px", letterSpacing: "4px" }}
              >
                {isRankUp ? "RANK UP" : "LEVEL UP"}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="font-rajdhani font-bold text-2xl mt-3 tracking-widest"
                style={{ color: isRankUp ? "#9b6ff0" : "#f0c040" }}
              >
                {message}
              </motion.div>
            </motion.div>

            {/* Divider line */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 120 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="h-px"
              style={{ background: isRankUp ? "#9b6ff0" : "#f0c040" }}
            />

            {/* Tap to continue */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="font-mono text-[10px] text-muted tracking-widest"
            >
              TAP TO CONTINUE
            </motion.div>
          </motion.div>

          {/* Particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: i % 3 === 0 ? 6 : 4,
                height: i % 3 === 0 ? 6 : 4,
                background: isRankUp ? "#9b6ff0" : "#f0c040",
                top: "50%",
                left: "50%",
              }}
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: Math.cos((i / 12) * Math.PI * 2) * (60 + (i % 3) * 30),
                y: Math.sin((i / 12) * Math.PI * 2) * (60 + (i % 3) * 30),
              }}
              transition={{ delay: 0.2 + i * 0.04, duration: 1, ease: "easeOut" }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}