import { motion, AnimatePresence } from "framer-motion"

export function StreakPopup({ streak, activeDays, show, onDone }: {
  streak: number
  activeDays: string[]
  show: boolean
  onDone: () => void
}) {
  const today = new Date()
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

  // Build last 7 days
  const last7 = [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setDate(today.getDate() - (6 - i))
    return {
      label: days[d.getDay()],
      dateStr: d.toDateString(),
      isToday: i === 6,
    }
  })

  return (
    <AnimatePresence>
      {show && (
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
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(circle at center, rgba(232,64,64,0.15) 0%, transparent 65%)",
            }}
          />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.1 }}
            className="relative z-10 flex flex-col items-center gap-6 px-8 text-center"
          >
            {/* Fire emoji with pulse */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [-5, 5, -5, 0] }}
              transition={{ duration: 0.6, delay: 0.3, repeat: 2 }}
              className="text-8xl"
            >
              🔥
            </motion.div>

            {/* Streak counter */}
            <div className="flex flex-col items-center gap-1">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="font-mono text-[11px] text-red tracking-widest uppercase"
              >
                Streak Extended
              </motion.div>

              {/* Animated number */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.4 }}
                className="font-rajdhani font-bold text-white leading-none"
                style={{ fontSize: "88px", letterSpacing: "2px" }}
              >
                {streak}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="font-rajdhani font-bold text-2xl text-red tracking-widest uppercase"
              >
                {streak === 1 ? "Day Streak" : "Day Streak"}
              </motion.div>

              {streak >= 7 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                  className="font-mono text-[10px] text-gold tracking-widest mt-1"
                >
                  {streak >= 30 ? "🏆 LEGENDARY STREAK" :
                   streak >= 14 ? "⭐ UNSTOPPABLE" :
                   "🔥 ONE WEEK STRONG"}
                </motion.div>
              )}
            </div>

            {/* Divider */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 200 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="h-px bg-red/40 rounded-full"
            />

            {/* Weekly activity dots */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col items-center gap-3 w-full"
            >
              <div className="font-mono text-[9px] text-muted tracking-widest uppercase">
                This Week
              </div>
              <div className="flex gap-2 justify-center">
                {last7.map((day, i) => {
                  const isActive = activeDays.includes(day.dateStr)
                  const isToday = day.isToday
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.75 + i * 0.06 }}
                      className="flex flex-col items-center gap-1.5"
                    >
                      {/* Day dot */}
                      <motion.div
                        animate={isToday && isActive ? {
                          boxShadow: ["0 0 0px #e84040", "0 0 12px #e84040", "0 0 0px #e84040"],
                        } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                          isActive && isToday
                            ? "bg-red border-2 border-red text-white"
                            : isActive
                            ? "bg-red/80 border border-red/60 text-white"
                            : "bg-surface2 border border-border text-muted"
                        }`}
                      >
                        {isActive ? "✓" : ""}
                      </motion.div>
                      {/* Day label */}
                      <span className={`font-mono text-[8px] tracking-wide ${
                        isToday ? "text-red" : "text-muted"
                      }`}>
                        {day.label}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* Particles */}
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: i % 2 === 0 ? 6 : 4,
                  height: i % 2 === 0 ? 6 : 4,
                  background: i % 3 === 0 ? "#f0c040" : "#e84040",
                  top: "40%",
                  left: "50%",
                }}
                initial={{ opacity: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  x: Math.cos((i / 10) * Math.PI * 2) * (50 + (i % 3) * 25),
                  y: Math.sin((i / 10) * Math.PI * 2) * (50 + (i % 3) * 25),
                }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.9, ease: "easeOut" }}
              />
            ))}

            {/* Tap to continue */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="font-mono text-[10px] text-muted tracking-widest"
            >
              TAP TO CONTINUE
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}