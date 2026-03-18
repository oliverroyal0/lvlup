import { motion, AnimatePresence } from "framer-motion"
import { type ReactNode } from "react"

export function PageTransition({ children, tabKey }: { children: ReactNode; tabKey: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tabKey}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}