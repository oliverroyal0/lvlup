import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { db } from "../db"
import { supabase } from "../supabase"


const today = new Date().toDateString()
const storageKey = "lvlup-ai-calls"


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
    followUps?: string[]
}


function getUsedCalls(): number {
    try {
        const stored = localStorage.getItem(storageKey)
        if (!stored) return 0
        const { date, count } = JSON.parse(stored)
        if (date !== today) return 0 // reset daily
        return count
    } catch {
        return 0
    }
}

function incrementUsedCalls() {
    const current = getUsedCalls()
    localStorage.setItem(storageKey, JSON.stringify({ date: today, count: current + 1 }))
}

export function AIPanel({ context, onClose }: {
    context: AIContext
    onClose: () => void
}) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [usedCalls, setUsedCalls] = useState(getUsedCalls)
    const MAX_FREE_CALLS = 10


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

        // Try multiple regex patterns to catch different formatting

        setMessages(prev => [...prev, userMessage])
        setInput("")
        setLoading(true)
        incrementUsedCalls()
        setUsedCalls(getUsedCalls())

        try {
            const userContext = await buildUserContext()

            const systemPrompt = `You are CoachBot — the AI life coach inside LVL UP, a gamified life tracking app. You are part hype coach, part anime mentor, part life strategist. Your job is to help ${userContext.split("Name: ")[1]?.split("\n")[0] ?? "the user"} level up every area of their real life.

${context.systemPrompt}

${userContext}

PERSONALITY:
- Warm, direct, and genuinely invested in the user's growth
- Reference their actual stats, level, and progress — make it personal
- Use their name naturally in conversation
- Speak like a mentor who knows them well — not a generic chatbot
- Keep energy high but grounded — motivating without being fake
- Keep responses somewhat short — max 3 sentences of advice before action blocks
- Be punchy and direct — no fluff, no long explanations
- Let the action buttons do the heavy lifting, not the text
- After first response, adapt tone based on user's style — mirror their energy and language


CONVERSATION RULES:
- Always continue the conversation — never give a dead-end response
- After giving advice or creating items, ask a follow-up question like:
  "Want me to build out a full morning routine?" or
  "Should I create a mission to tie these habits together?" or
  "Want more options or should we go deeper on one of these?"
- If the user seems stuck, offer 2-3 specific directions they can go
- Remember what was said earlier in this conversation and reference it
- If they ask about one area of life, proactively connect it to others
  (e.g. fitness habits → better sleep → better focus → stronger Mind stat) 
  
FOLLOW-UP FORMAT:
After every response, always end with a line that starts with "FOLLOWUPS:" followed by 3 short follow-up options separated by "|" that the user can tap to continue the conversation. Make them specific to what was just discussed.
Example: FOLLOWUPS: Build me a full week plan|What about my weakest stat?|Connect these to a mission 

ACTION RULES:
            - ALWAYS output JSON blocks when suggesting quests, habits, or missions
                - NEVER say "I'll create..." without the actual JSON block
                    - Output 2 - 4 JSON blocks per response when relevant
                        - Each JSON block becomes a tap - to - add button in the app

JSON FORMATS(use exactly):
For a quest:
            \`\`\`json
{"action":"addQuest","title":"...","category":"STRENGTH|MIND|WEALTH|EXPLORER|FOCUS|HEALTH|HOME","xpReward":25,"frequency":"daily|weekly"}
\`\`\`

For a habit:
\`\`\`json
{"action":"addHabit","title":"...","category":"STRENGTH|MIND|WEALTH|EXPLORER|FOCUS|HEALTH|HOME","xpReward":20,"frequency":"daily|weekly|bi-weekly|monthly"}
\`\`\`

For a mission:
\`\`\`json
{"action":"addMission","title":"...","category":"STRENGTH|MIND|WEALTH|EXPLORER|FOCUS|HEALTH|HOME","xpReward":500,"missionType":"main|seasonal|yearly|sideQuest"}
\`\`\`

LIFE AREAS YOU CAN HELP WITH:
- Fitness & Strength: workouts, PRs, body goals, nutrition habits
- Mind & Focus: reading, learning, meditation, deep work, journaling
- Wealth & Finance: budgeting, saving, income goals, investment habits
- Health: sleep, hydration, nutrition, wellness routines
- Explorer: travel goals, new experiences, adventure missions
- Home: cleaning routines, organization habits, home improvement missions
- Education: courses, skills, certifications, learning paths

CROSS-AREA CONNECTIONS:
- Always look for ways habits in one area boost another
- e.g. "Your Strength stat is your highest — great foundation. But your Mind stat is low. Adding a reading habit after workouts could unlock huge XP gains across both."
- This kind of insight is what makes you invaluable vs a basic AI`


            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    max_tokens: 1500,
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
            const jsonRegex = /```json\r?\n([\s\S]*?)\r?\n?```/g
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

            // Extract follow-ups
            const followUps: string[] = []
            const followUpMatch = rawContent.match(/FOLLOWUPS:\s*(.+)$/m)
            if (followUpMatch) {
                const options = followUpMatch[1].split("|").map((s: string) => s.trim()).filter(Boolean)
                followUps.push(...options.slice(0, 3))
            }

            // Clean content — remove JSON blocks and FOLLOWUPS line
            const cleanContent = rawContent
                .replace(/```json\r?\n[\s\S]*?\r?\n?```/g, "")
                .replace(/FOLLOWUPS:.*$/m, "")
                .trim()

            setMessages(prev => [...prev, {
                role: "assistant",
                content: cleanContent,
                actions,
                followUps,
            }])

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

    const actionColors: Record<string, string> = {
        addQuest: "border-cyan/30   bg-cyan/5   hover:bg-cyan/10   hover:border-cyan/50",
        addHabit: "border-purple/30 bg-purple/5 hover:bg-purple/10 hover:border-purple/50",
        addMission: "border-gold/30   bg-gold/5   hover:bg-gold/10   hover:border-gold/50",
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
                            <div key={i} className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div
                                    className={`max-w-[88%] px-3 py-2 rounded-xl text-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-purple/20 border border-purple/30 text-white rounded-br-sm"
                                        : "bg-surface2 border border-purple/20 text-[#d4d0e8] rounded-bl-sm"
                                        }`}
                                    style={msg.role === "assistant" ? { boxShadow: "0 0 12px rgba(155,111,240,0.08)" } : {}}
                                >
                                    {msg.content}
                                </div>

                                {/* Action buttons */}
                                {msg.actions && msg.actions.length > 0 && (
                                    <div className="w-full space-y-1">
                                        {msg.actions.map((action, j) => (
                                            <ActionButton
                                                key={j}
                                                action={action}
                                                colorClass={actionColors[action.type] ?? "border-border text-muted"}
                                                onExecute={executeAction}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Follow-up suggestion chips */}
                                {msg.followUps && msg.followUps.length > 0 && i === messages.length - 1 && (
                                    <div className="w-full space-y-1.5 mt-1">
                                        <div className="font-mono text-[9px] text-muted tracking-widest uppercase">
                                            Continue with...
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            {msg.followUps.map((followUp, j) => (
                                                <motion.button
                                                    key={j}
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: j * 0.08 }}
                                                    onClick={() => sendMessage(followUp)}
                                                    className="w-full text-left px-3 py-2.5 bg-surface border border-border rounded-xl font-mono text-[10px] text-muted hover:border-purple/40 hover:text-purple hover:bg-purple/5 transition-all flex items-center gap-2"
                                                >
                                                    <span className="text-purple opacity-60">→</span>
                                                    {followUp}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                )}
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

function ActionButton({ action, colorClass, onExecute }: {
    action: AIAction
    colorClass: string
    onExecute: (action: AIAction) => void
}) {
    const [done, setDone] = useState(false)
    const [loading, setLoading] = useState(false)

    const typeIcons: Record<string, string> = {
        addQuest: "⚔️",
        addHabit: "🔄",
        addMission: "🎯",
    }

    const typeLabels: Record<string, string> = {
        addQuest: "Quest",
        addHabit: "Habit",
        addMission: "Mission",
    }

    async function handleClick() {
        if (done || loading) return
        setLoading(true)
        await onExecute(action)
        setLoading(false)
        setDone(true)
    }

    return (
        <motion.button
            onClick={handleClick}
            disabled={done || loading}
            whileTap={{ scale: 0.97 }}
            className={`w-full rounded-xl border transition-all overflow-hidden ${done
                ? "border-green/30 bg-green/5"
                : colorClass
                }`}
        >
            <div className="flex items-center gap-3 px-3 py-2.5">
                {/* Type icon */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${done ? "bg-green/20" : "bg-black/20"
                    }`}>
                    {done ? "✓" : typeIcons[action.type] ?? "➕"}
                </div>

                {/* Content */}
                <div className="flex-1 text-left min-w-0">
                    <div className={`font-mono text-[9px] tracking-widest uppercase mb-0.5 ${done ? "text-green" : "text-muted"
                        }`}>
                        {done ? "Added to your app" : `Add as ${typeLabels[action.type] ?? "item"}`}
                    </div>
                    <div className={`text-sm font-medium truncate ${done ? "text-green" : "text-white"}`}>
                        {action.payload.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[9px] text-muted">
                            {action.payload.category}
                        </span>
                        {action.payload.frequency && (
                            <span className="font-mono text-[9px] text-muted">
                                · {action.payload.frequency}
                            </span>
                        )}
                        <span className="font-mono text-[9px] text-gold ml-auto">
                            +{action.payload.xpReward} XP
                        </span>
                    </div>
                </div>

                {/* Arrow / loading */}
                <div className="flex-shrink-0">
                    {loading ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border border-muted border-t-transparent rounded-full"
                        />
                    ) : done ? null : (
                        <span className="text-muted text-sm">→</span>
                    )}
                </div>
            </div>
        </motion.button>
    )
}