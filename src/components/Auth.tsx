import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "../supabase"

type AuthMode = "login" | "signup" | "forgot"

export function Auth({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<AuthMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit() {
    setError(null)
    setSuccess(null)

    if (!email.trim() || (!password.trim() && mode !== "forgot")) {
      setError("Please fill in all fields.")
      return
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords don't match.")
      return
    }

    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onAuth()
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess("Account created! Check your email to verify, then log in.")
        setMode("login")
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) throw error
        setSuccess("Password reset email sent! Check your inbox.")
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-bg z-50 flex flex-col items-center justify-center px-6 max-w-sm mx-auto">

      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 30%, rgba(240,192,64,0.06) 0%, transparent 70%)" }}
      />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 text-center"
      >
        <div className="font-rajdhani font-bold text-4xl text-gold tracking-widest uppercase mb-1">
          LVL<span className="text-white opacity-40">_</span>UP
        </div>
        <div className="font-mono text-[10px] text-muted tracking-widest">
          SECONDBRAIN STUDIOS
        </div>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full bg-surface border border-border rounded-2xl p-6 space-y-4"
      >
        {/* Mode tabs */}
        <div className="flex gap-2 mb-2">
          {(["login", "signup"] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccess(null) }}
              className={`flex-1 py-2 rounded-xl font-mono text-[10px] tracking-widest uppercase border transition-all ${
                mode === m
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border text-muted"
              }`}
            >
              {m === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            {/* Title */}
            <div>
              <div className="font-rajdhani font-bold text-xl text-white tracking-wide">
                {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Password"}
              </div>
              <div className="font-mono text-[10px] text-muted mt-1">
                {mode === "login" ? "Log in to continue your journey" :
                 mode === "signup" ? "Start your legend today" :
                 "We'll send you a reset link"}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="your@email.com"
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted"
              />
            </div>

            {/* Password */}
            {mode !== "forgot" && (
              <div>
                <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder="••••••••"
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted"
                />
              </div>
            )}

            {/* Confirm password */}
            {mode === "signup" && (
              <div>
                <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder="••••••••"
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted"
                />
              </div>
            )}

            {/* Forgot password link */}
            {mode === "login" && (
              <button
                onClick={() => { setMode("forgot"); setError(null) }}
                className="font-mono text-[9px] text-muted hover:text-gold transition-colors tracking-widest"
              >
                Forgot password?
              </button>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red/10 border border-red/30 rounded-xl px-4 py-3 font-mono text-[10px] text-red tracking-wide"
              >
                {error}
              </motion.div>
            )}

            {/* Success */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green/10 border border-green/30 rounded-xl px-4 py-3 font-mono text-[10px] text-green tracking-wide"
              >
                {success}
              </motion.div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gold text-bg font-rajdhani font-bold text-xl py-3.5 rounded-xl tracking-widest uppercase hover:opacity-90 active:opacity-70 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? "..."
                : mode === "login" ? "Log In"
                : mode === "signup" ? "Create Account"
                : "Send Reset Link"}
            </button>

            {/* Back link for forgot */}
            {mode === "forgot" && (
              <button
                onClick={() => setMode("login")}
                className="w-full font-mono text-[10px] text-muted hover:text-gold transition-colors tracking-widest text-center"
              >
                ← Back to login
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 font-mono text-[9px] text-muted tracking-widest text-center"
      >
        BY SIGNING UP YOU AGREE TO OUR TERMS
      </motion.div>
    </div>
  )
}