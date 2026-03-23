import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { db } from "../../db"
import { BUILT_IN_EXERCISES } from "../../data/exercises"

const GOALS = [
    { id: "lose_weight", icon: "🔥", label: "Lose Weight", desc: "Burn fat and slim down" },
    { id: "build_muscle", icon: "💪", label: "Build Muscle", desc: "Gain size and definition" },
    { id: "get_stronger", icon: "🏋️", label: "Get Stronger", desc: "Increase raw strength" },
    { id: "improve_endurance", icon: "🏃", label: "Improve Endurance", desc: "Run further, last longer" },
    { id: "learn_skills", icon: "🤸", label: "Learn Skills", desc: "Master calisthenics and techniques" },
    { id: "general_fitness", icon: "⚡", label: "General Fitness", desc: "Look and feel better overall" },
]

const EQUIPMENT_OPTIONS = [
    "Barbell", "Dumbbell", "Cables", "Machines",
    "Bodyweight", "Resistance bands", "Kettlebell", "Cardio machines",
]

export default function FitnessOnboarding({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(0)
    const [units, setUnits] = useState<"metric" | "imperial">("imperial")
    const [goals, setGoals] = useState<string[]>([])
    const [equipment, setEquipment] = useState<string[]>(["Bodyweight"])
    const [heightFt, setHeightFt] = useState("")
    const [heightIn, setHeightIn] = useState("")
    const [heightCm, setHeightCm] = useState("")
    const [weightLbs, setWeightLbs] = useState("")
    const [weightKg, setWeightKg] = useState("")
    const [age, setAge] = useState("")
    const [gender, setGender] = useState("")
    const [saving, setSaving] = useState(false)

    function toggleEquipment(item: string) {
        setEquipment(prev =>
            prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item]
        )
    }

    function toggleGoal(id: string) {
        setGoals(prev =>
            prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
        )
    }

    async function finish() {
        setSaving(true)

        // Save fitness profile
        await db.fitnessProfile.add({
            units,
            fitnessGoal: goals,
            equipment,
            heightFt: heightFt ? Number(heightFt) : undefined,
            heightIn: heightIn ? Number(heightIn) : undefined,
            heightCm: heightCm ? Number(heightCm) : undefined,
            weightLbs: weightLbs ? Number(weightLbs) : undefined,
            weightKg: weightKg ? Number(weightKg) : undefined,
            age: age ? Number(age) : undefined,
            gender: gender || undefined,
            createdAt: new Date(),
        })

        // Seed initial body metric
        if (weightLbs || weightKg) {
            await db.bodyMetrics.add({
                date: new Date().toISOString().split("T")[0],
                weightLbs: weightLbs ? Number(weightLbs) : undefined,
                weightKg: weightKg ? Number(weightKg) : undefined,
                createdAt: new Date(),
            })
        }

        // Seed exercise database
        const existing = await db.exercises.count()
        if (existing === 0) {
            await db.exercises.bulkAdd(
                BUILT_IN_EXERCISES.map(e => ({ ...e, createdAt: new Date() }))
            )
        }

        setSaving(false)
        onComplete()
    }

    const steps = [
        // Step 0 — Welcome
        <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full px-6 text-center gap-6"
        >
            <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-7xl"
            >
                💪
            </motion.div>
            <div>
                <div className="font-rajdhani font-bold text-4xl text-white tracking-widest uppercase leading-none mb-3">
                    FITNESS<span className="text-gold">_</span>SETUP
                </div>
                <div className="font-mono text-[11px] text-muted tracking-widest leading-relaxed">
                    Let's build your fitness profile.<br />
                    This takes 2 minutes and unlocks<br />
                    your personalized training system.
                </div>
            </div>
            <div className="w-full space-y-2">
                {["📊 Track workouts and PRs", "🎯 AI-powered workout plans", "🏆 Unlock fitness skills"].map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3"
                    >
                        <span className="font-mono text-[11px] text-muted">{item}</span>
                    </motion.div>
                ))}
            </div>
            <button
                onClick={() => setStep(1)}
                className="w-full bg-gold text-bg font-rajdhani font-bold text-xl py-4 rounded-2xl tracking-widest uppercase"
            >
                Let's Go
            </button>
        </motion.div>,

        // Step 1 — Units
        <motion.div key="units" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="px-6 pt-4 space-y-6">
            <div>
                <div className="font-rajdhani font-bold text-2xl text-white tracking-wide">UNITS</div>
                <div className="font-mono text-[10px] text-muted tracking-widest mt-1">How do you measure things?</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {[
                    { id: "imperial", label: "Imperial", sub: "lbs, feet, inches", icon: "🇺🇸" },
                    { id: "metric", label: "Metric", sub: "kg, cm", icon: "🌍" },
                ].map(u => (
                    <button
                        key={u.id}
                        onClick={() => setUnits(u.id as any)}
                        className={`flex flex-col items-center gap-2 py-5 rounded-2xl border transition-all ${units === u.id
                            ? "border-gold bg-gold/10"
                            : "border-border bg-surface"
                            }`}
                    >
                        <span className="text-3xl">{u.icon}</span>
                        <div className={`font-rajdhani font-bold text-lg tracking-wide ${units === u.id ? "text-gold" : "text-white"}`}>
                            {u.label}
                        </div>
                        <div className="font-mono text-[9px] text-muted">{u.sub}</div>
                    </button>
                ))}
            </div>
            <button onClick={() => setStep(2)} className="w-full bg-gold text-bg font-rajdhani font-bold text-xl py-4 rounded-2xl tracking-widest uppercase">
                Continue
            </button>
        </motion.div>,

        // Step 2 — Measurements
        <motion.div key="measurements" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="px-6 pt-4 space-y-5">
            <div>
                <div className="font-rajdhani font-bold text-2xl text-white tracking-wide">YOUR STATS</div>
                <div className="font-mono text-[10px] text-muted tracking-widests mt-1">Baseline measurements — all optional</div>
            </div>

            {units === "imperial" ? (
                <>
                    <div>
                        <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-2">Height</label>
                        <div className="flex gap-2">
                            <input value={heightFt} onChange={e => setHeightFt(e.target.value)} placeholder="ft" type="number"
                                className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" />
                            <input value={heightIn} onChange={e => setHeightIn(e.target.value)} placeholder="in" type="number"
                                className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" />
                        </div>
                    </div>
                    <div>
                        <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-2">Weight (lbs)</label>
                        <input value={weightLbs} onChange={e => setWeightLbs(e.target.value)} placeholder="e.g. 175" type="number"
                            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" />
                    </div>
                </>
            ) : (
                <>
                    <div>
                        <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-2">Height (cm)</label>
                        <input value={heightCm} onChange={e => setHeightCm(e.target.value)} placeholder="e.g. 175" type="number"
                            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" />
                    </div>
                    <div>
                        <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-2">Weight (kg)</label>
                        <input value={weightKg} onChange={e => setWeightKg(e.target.value)} placeholder="e.g. 80" type="number"
                            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" />
                    </div>
                </>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-2">Age</label>
                    <input value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 25" type="number"
                        className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted" />
                </div>
                <div>
                    <label className="font-mono text-[9px] text-muted tracking-widests uppercase block mb-2">Gender</label>
                    <select value={gender} onChange={e => setGender(e.target.value)}
                        className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors"
                    >
                        <option value="">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>

            <button onClick={() => setStep(3)} className="w-full bg-gold text-bg font-rajdhani font-bold text-xl py-4 rounded-2xl tracking-widests uppercase">
                Continue
            </button>
        </motion.div>,

        // Step 3 — Goal
        <motion.div key="goal" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="px-6 pt-4 space-y-5">
            <div>
                <div className="font-rajdhani font-bold text-2xl text-white tracking-wide">YOUR GOAL</div>
                <div className="font-mono text-[10px] text-muted tracking-widests mt-1">What are you training for?</div>
            </div>
            <div className="space-y-2">
                {GOALS.map(g => {
                    const isSelected = goals.includes(g.id)
                    return (
                        <button
                            key={g.id}
                            onClick={() => toggleGoal(g.id)}
                            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all ${isSelected
                                    ? "border-gold bg-gold/8"
                                    : "border-border bg-surface"
                                }`}
                        >
                            <span className="text-2xl flex-shrink-0">{g.icon}</span>
                            <div className="text-left flex-1">
                                <div className={`font-rajdhani font-bold text-base tracking-wide ${isSelected ? "text-gold" : "text-white"}`}>
                                    {g.label}
                                </div>
                                <div className="font-mono text-[9px] text-muted mt-0.5">{g.desc}</div>
                            </div>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "bg-gold border-gold text-bg text-xs font-bold" : "border-border"
                                }`}>
                                {isSelected && "✓"}
                            </div>
                        </button>
                    )
                })}
            </div>
            <button
                onClick={() => setStep(4)}
                disabled={goals.length === 0}
                className="w-full bg-gold text-bg font-rajdhani font-bold text-xl py-4 rounded-2xl tracking-widests uppercase disabled:opacity-30"
            >
                Continue
            </button>
        </motion.div>,

        // Step 4 — Equipment
        <motion.div key="equipment" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="px-6 pt-4 space-y-5">
            <div>
                <div className="font-rajdhani font-bold text-2xl text-white tracking-wide">YOUR EQUIPMENT</div>
                <div className="font-mono text-[10px] text-muted tracking-widests mt-1">What do you have access to?</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {EQUIPMENT_OPTIONS.map(item => {
                    const isSelected = equipment.includes(item)
                    return (
                        <button
                            key={item}
                            onClick={() => toggleEquipment(item)}
                            className={`py-3 px-4 rounded-xl border text-left transition-all ${isSelected
                                ? "border-cyan/40 bg-cyan/8 text-cyan"
                                : "border-border bg-surface text-muted"
                                }`}
                        >
                            <div className={`font-mono text-[10px] tracking-wide ${isSelected ? "text-cyan" : "text-muted"}`}>
                                {isSelected ? "✓ " : ""}{item}
                            </div>
                        </button>
                    )
                })}
            </div>
            <button
                onClick={finish}
                disabled={saving || equipment.length === 0}
                className="w-full bg-gold text-bg font-rajdhani font-bold text-xl py-4 rounded-2xl tracking-widests uppercase disabled:opacity-30"
            >
                {saving ? "SETTING UP..." : "START TRAINING"}
            </button>
        </motion.div>,
    ]

    return (
        <div className="flex flex-col h-full min-h-screen pb-24">
            {/* Progress dots */}
            {step > 0 && (
                <div className="flex justify-center gap-2 pt-4 pb-2 flex-shrink-0">
                    {[1, 2, 3, 4].map(i => (
                        <motion.div
                            key={i}
                            className="rounded-full"
                            animate={{
                                width: i === step ? 24 : 8,
                                background: i <= step ? "#f0c040" : "#2a2a3e",
                            }}
                            style={{ height: 6 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                    ))}
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {steps[step]}
                </AnimatePresence>
            </div>
        </div>
    )
}