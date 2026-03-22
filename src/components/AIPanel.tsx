import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { db } from "../db"
import { supabase } from "../supabase"

export interface AIContext {
    screen: string
    systemPrompt: string
    suggestions: string[]
    onAction?: (action: AIAction) => void
}

export interface AIAction {
    type: "addQuest" | "addHabit" | "addMission" | "addJournal" | "info"
    payload: any
}

interface Message {
    role: "user" | "assistant"
    content: string
    actions?: AIAction[]
}

export function AIPanel({ context, onClose }: {
    context: AIContext
    onClose: () => void
}) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [usedCalls, setUsedCalls] = useState(0)
    const MAX_FREE_CALLS = 5

    async function buildUserContext(): Promise<string> {
        const user = await db.users.toCollection().first()
        const stats = await db.statRecords.toArray()
        const activeQuests = await db.quests.filter(q => !q.isCompleted).count()
        const activeMissions = await db.missions.filter(m => !m.isCompleted).count()
        const recentMood = await db.journalEntries.orderBy("createdAt").last()
        const habits = await db.habits.filter(h => !h.isArchived).toArray()
        await supabase.auth.getSession()

        return `
PLAYER CONTEXT:
- Name: ${user?.username ?? "Unknown"}
- Level: ${user?.level ?? 1} | Rank: ${user?.rank ?? "F"} | Title: ${user?.title ?? "Newcomer"}
- Total XP: ${user?.totalXP ?? 0}
- Stats: ${stats.map(s => `${s.category}: ${s.score}`).join(", ") || "No stats yet"}
- Active Quests: ${activeQuests}
- Active Missions: ${activeMissions}
- Active Habits: ${habits.length}
- Recent Mood: ${recentMood?.mood ?? "unknown"}
- Current Screen: ${context.screen}
    `.trim()
    }

    async function sendMessage(text: string) {
        if (!text.trim() || loading) return
        if (usedCalls >= MAX_FREE_CALLS) return

        const userMessage: Message = { role: "user", content: text }
        setMessages(prev => [...prev, userMessage])
        setInput("")
        setLoading(true)
        setUsedCalls(prev => prev + 1)

        try {
            const userContext = await buildUserContext()

            const systemPrompt = `You are an AI life coach inside LVL UP, a gamified life tracking app. You help users level up their real life.

${context.systemPrompt}

${userContext}

RESPONSE RULES:
- Keep responses concise and motivating — max 3 sentences of advice
- Always end with 1-3 actionable JSON blocks if relevant
- JSON action format: {"action":"addQuest","title":"...","category":"STRENGTH|MIND|WEALTH|EXPLORER|FOCUS|HEALTH|HOME","xpReward":25,"frequency":"daily|weekly"}
- For habits: {"action":"addHabit","title":"...","category":"...","xpReward":20,"frequency":"daily|weekly|bi-weekly|monthly"}
- For missions: {"action":"addMission","title":"...","category":"...","xpReward":500,"missionType":"main|seasonal|yearly|sideQuest"}
- Wrap JSON in triple backticks with json tag
- Speak directly to the user, use their name, reference their actual stats
- Tone: like a hype coach meets anime mentor — encouraging, direct, fired up`

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    max_tokens: 1000,
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                        { role: "user", content: text }
                    ],
                })
            })

            const data = await response.json()
            const rawContent = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't process that. Try again."

            // Parse actions from JSON blocks
            const actions: AIAction[] = []
            const jsonRegex = /```json\n([\s\S]*?)\n```/g
            let match
            while ((match = jsonRegex.exec(rawContent)) !== null) {
                try {
                    const parsed = JSON.parse(match[1])
                    if (parsed.action === "addQuest") {
                        actions.push({ type: "addQuest", payload: parsed })
                    } else if (parsed.action === "addHabit") {
                        actions.push({ type: "addHabit", payload: parsed })
                    } else if (parsed.action === "addMission") {
                        actions.push({ type: "addMission", payload: parsed })
                    }
                } catch { }
            }

            // Clean the response text — remove JSON blocks
            const cleanContent = rawContent.replace(/```json\n[\s\S]*?\n```/g, "").trim()

            const assistantMessage: Message = {
                role: "assistant",
                content: cleanContent,
                actions,
            }
            setMessages(prev => [...prev, assistantMessage])

        } catch (err) {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Something went wrong. Check your API key and try again.",
            }])
        } finally {
            setLoading(false)
        }
    }

    async function executeAction(action: AIAction) {
        try {
            if (action.type === "addQuest") {
                await db.quests.add({
                    title: action.payload.title,
                    category: action.payload.category ?? "FOCUS",
                    frequency: action.payload.frequency ?? "daily",
                    xpReward: action.payload.xpReward ?? 25,
                    isCompleted: false,
                    createdAt: new Date(),
                })
            } else if (action.type === "addHabit") {
                await db.habits.add({
                    title: action.payload.title,
                    category: action.payload.category ?? "FOCUS",
                    frequency: action.payload.frequency ?? "daily",
                    xpReward: action.payload.xpReward ?? 20,
                    currentStreak: 0,
                    longestStreak: 0,
                    lastCompletedDate: "",
                    completedDates: [],
                    createdAt: new Date(),
                })
            } else if (action.type === "addMission") {
                await db.missions.add({
                    title: action.payload.title,
                    missionType: action.payload.missionType ?? "main",
                    category: action.payload.category ?? "FOCUS",
                    currentValue: 0,
                    targetValue: 1,
                    xpReward: action.payload.xpReward ?? 500,
                    isCompleted: false,
                    createdAt: new Date(),
                })
            }
            context.onAction?.(action)
        } catch (err) {
            console.error("Failed to execute action:", err)
        }
    }

    const actionLabels: Record<string, string> = {
        addQuest: "➕ Add as Quest",
        addHabit: "➕ Add as Habit",
        addMission: "➕ Add as Mission",
    }

    const actionColors: Record<string, string> = {
        addQuest: "border-cyan/40 bg-cyan/10 text-cyan hover:bg-cyan/20",
        addHabit: "border-purple/40 bg-purple/10 text-purple hover:bg-purple/20",
        addMission: "border-gold/40 bg-gold/10 text-gold hover:bg-gold/20",
    }

    return (
        <AnimatePresence>
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="border-b border-border bg-surface overflow-hidden"
        >
            <div className="p-4 space-y-3 max-h-96 flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">✨</span>
                        <span className="font-rajdhani font-bold text-sm text-purple tracking-widest uppercase">
                            AI Coach
                        </span>
                        <span className="font-mono text-[9px] text-muted">
                            {MAX_FREE_CALLS - usedCalls} calls left
                        </span>
                    </div>
                    <button onClick={onClose} className="text-muted hover:text-red transition-colors text-sm">✕</button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 min-h-0">

                    {/* Suggestions if no messages yet */}
                    {messages.length === 0 && (
                        <div className="space-y-2">
                            <div className="font-mono text-[9px] text-muted tracking-widest uppercase mb-2">
                                Suggested prompts
                            </div>
                            {context.suggestions.map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(suggestion)}
                                    className="w-full text-left px-3 py-2 bg-surface2 border border-border rounded-lg font-mono text-[10px] text-muted hover:border-purple/40 hover:text-purple transition-all"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Message thread */}
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] space-y-2`}>
                                <div className={`px-3 py-2.5 rounded-xl text-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-purple/20 border border-purple/30 text-white ml-auto"
                                        : "bg-surface2 border border-border text-muted"
                                    }`}>
                                    {msg.content}
                                </div>

                                {/* Action buttons */}
                                {msg.actions && msg.actions.length > 0 && (
                                    <div className="space-y-1.5">
                                        {msg.actions.map((action, j) => (
                                            <ActionButton
                                                key={j}
                                                action={action}
                                                label={actionLabels[action.type] ?? "Add"}
                                                colorClass={actionColors[action.type] ?? "border-border text-muted"}
                                                onExecute={executeAction}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Loading */}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="px-3 py-2.5 bg-surface2 border border-border rounded-xl">
                                <div className="flex gap-1">
                                    {[0, 1, 2].map(i => (
                                        <motion.div
                                            key={i}
                                            className="w-1.5 h-1.5 bg-purple rounded-full"
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="flex gap-2 flex-shrink-0">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendMessage(input)}
                        placeholder={usedCalls >= MAX_FREE_CALLS ? "Daily limit reached" : "Ask your AI coach..."}
                        disabled={usedCalls >= MAX_FREE_CALLS || loading}
                        className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple transition-colors placeholder:text-muted disabled:opacity-40"
                    />
                    <button
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim() || loading || usedCalls >= MAX_FREE_CALLS}
                        className="px-3 py-2 bg-purple/20 border border-purple/40 rounded-lg font-mono text-[10px] text-purple hover:bg-purple/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        SEND
                    </button>
                </div>
            </div>
        </motion.div>
        </AnimatePresence>
    )
}

function ActionButton({ action, label, colorClass, onExecute }: {
    action: AIAction
    label: string
    colorClass: string
    onExecute: (action: AIAction) => void
}) {
    const [done, setDone] = useState(false)

    async function handleClick() {
        if (done) return
        await onExecute(action)
        setDone(true)
    }

    return (
        <button
            onClick={handleClick}
            disabled={done}
            className={`w-full text-left px-3 py-2 rounded-lg border font-mono text-[10px] tracking-wide transition-all ${done
                    ? "border-green/30 bg-green/10 text-green cursor-default"
                    : colorClass
                }`}
        >
            {done ? "✓ Added!" : `${label}: "${action.payload.title}"`}
        </button>
    )
}