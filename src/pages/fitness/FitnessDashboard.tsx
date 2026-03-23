import { useState, useEffect } from "react"
import { db, type FitnessProfile, type WorkoutLog, type PersonalRecord, type BodyMetric } from "../../db"
import { awardXP, incrementStat } from "../../xpEngine"
import WorkoutLogger from "./WorkoutLogger"
import BodyMetricsScreen from "./BodyMetricsScreen"
import ExerciseDatabase from "./ExerciseDatabase"
import PRTracker from "./PRTracker"
import ExerciseHistory from "./ExerciseHistory"
import SkillsTracker from "./SkillsTracker"

const DASH_TABS = [
    { id: "overview", icon: "📊", label: "Overview" },
    { id: "workout", icon: "⚔️", label: "Workout" },
    { id: "exercises", icon: "📚", label: "Exercises" },
    { id: "skills", icon: "⭐", label: "Skills" },
    { id: "prs", icon: "🏆", label: "PRs" },
    { id: "metrics", icon: "📏", label: "Metrics" },
    { id: "history", icon: "📋", label: "History" },
]

export default function FitnessDashboard({ profile, onUserUpdate }: {
    profile: FitnessProfile
    onUserUpdate: () => void
    onProfileUpdate: () => void
}) {
    const [activeTab, setActiveTab] = useState("overview")
    const [recentWorkouts, setRecentWorkouts] = useState<WorkoutLog[]>([])
    const [recentPRs, setRecentPRs] = useState<PersonalRecord[]>([])
    const [latestMetric, setLatestMetric] = useState<BodyMetric | null>(null)
    const [totalWorkouts, setTotalWorkouts] = useState(0)

    useEffect(() => { loadData() }, [])

    async function loadData() {
        const workouts = await db.workoutLogs.orderBy("createdAt").reverse().limit(5).toArray()
        const prs = await db.personalRecords.orderBy("achievedDate").reverse().limit(5).toArray()
        const metric = await db.bodyMetrics.orderBy("createdAt").last()
        const total = await db.workoutLogs.count()
        setRecentWorkouts(workouts)
        setRecentPRs(prs)
        setLatestMetric(metric ?? null)
        setTotalWorkouts(total)
    }

    const weightDisplay = profile.units === "imperial"
        ? `${latestMetric?.weightLbs ?? "—"} lbs`
        : `${latestMetric?.weightKg ?? "—"} kg`

    return (
        <div className="space-y-4">
            {/* Sub tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
                {DASH_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] tracking-widest border transition-all ${activeTab === tab.id
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-border text-muted"
                            }`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label.toUpperCase()}</span>
                    </button>
                ))}
            </div>

            {/* Overview */}
            {activeTab === "overview" && (
                <div className="space-y-4">
                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-surface border border-border rounded-xl p-3 text-center">
                            <div className="font-rajdhani font-bold text-2xl text-gold leading-none">{totalWorkouts}</div>
                            <div className="font-mono text-[9px] text-muted mt-1 tracking-wide">WORKOUTS</div>
                        </div>
                        <div className="bg-surface border border-border rounded-xl p-3 text-center">
                            <div className="font-rajdhani font-bold text-2xl text-cyan leading-none">{recentPRs.length}</div>
                            <div className="font-mono text-[9px] text-muted mt-1 tracking-wide">TOTAL PRs</div>
                        </div>
                        <div className="bg-surface border border-border rounded-xl p-3 text-center">
                            <div className="font-rajdhani font-bold text-lg text-purple leading-none">{weightDisplay}</div>
                            <div className="font-mono text-[9px] text-muted mt-1 tracking-wide">WEIGHT</div>
                        </div>
                    </div>

                    {/* Profile summary */}
                    <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-4 h-px bg-gold"></div>
                            <span className="font-mono text-[10px] text-muted tracking-widests uppercase">Your Profile</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                {
                                    label: "Goals", val: (Array.isArray(profile.fitnessGoal)
                                        ? profile.fitnessGoal
                                        : [profile.fitnessGoal]
                                    ).map((g: string) => g.replace(/_/g, " ")).join(", ")
                                },
                                { label: "Units", val: profile.units },
                                { label: "Equipment", val: `${profile.equipment.length} types` },
                                {
                                    label: "Height", val: profile.units === "imperial"
                                        ? `${profile.heightFt ?? "—"}'${profile.heightIn ?? "—"}"`
                                        : `${profile.heightCm ?? "—"} cm`
                                },
                            ].map(item => (
                                <div key={item.label} className="bg-surface2 border border-border rounded-lg px-3 py-2">
                                    <div className="font-mono text-[9px] text-muted tracking-wide uppercase">{item.label}</div>
                                    <div className="font-rajdhani font-bold text-sm text-white mt-0.5 capitalize">{item.val}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick start workout */}
                    <button
                        onClick={() => setActiveTab("workout")}
                        className="w-full bg-surface border border-gold/30 rounded-xl p-4 flex items-center gap-4 hover:border-gold/60 transition-all"
                    >
                        <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-2xl flex-shrink-0">
                            ⚔️
                        </div>
                        <div className="text-left">
                            <div className="font-rajdhani font-bold text-lg text-gold tracking-wide">START WORKOUT</div>
                            <div className="font-mono text-[10px] text-muted mt-0.5">Log exercises, sets, and reps</div>
                        </div>
                        <span className="ml-auto text-gold text-lg">→</span>
                    </button>

                    {/* Recent workouts */}
                    {recentWorkouts.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-4 h-px bg-gold"></div>
                                <span className="font-mono text-[10px] text-muted tracking-widests uppercase">Recent Workouts</span>
                            </div>
                            <div className="space-y-2">
                                {recentWorkouts.map(workout => (
                                    <div key={workout.id} className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                                        <span className="text-xl">💪</span>
                                        <div className="flex-1">
                                            <div className="font-rajdhani font-bold text-sm text-white">
                                                {workout.name ?? "Workout"}
                                            </div>
                                            <div className="font-mono text-[9px] text-muted mt-0.5">
                                                {workout.date} · {workout.totalSets ?? 0} sets · +{workout.xpEarned ?? 0} XP
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent PRs */}
                    {recentPRs.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-4 h-px bg-gold"></div>
                                <span className="font-mono text-[10px] text-muted tracking-widests uppercase">Recent PRs</span>
                            </div>
                            <div className="space-y-2">
                                {recentPRs.map(pr => (
                                    <div key={pr.id} className="bg-surface border border-gold/20 rounded-xl px-4 py-3 flex items-center gap-3">
                                        <span className="text-xl">🏆</span>
                                        <div className="flex-1">
                                            <div className="font-rajdhani font-bold text-sm text-gold">{pr.exerciseName}</div>
                                            <div className="font-mono text-[9px] text-muted mt-0.5">
                                                {profile.units === "imperial"
                                                    ? `${pr.weightLbs ?? "—"} lbs`
                                                    : `${pr.weightKg ?? "—"} kg`
                                                } × {pr.reps ?? "—"} reps · {pr.achievedDate}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "workout" && (
                <WorkoutLogger
                    profile={profile}
                    onComplete={async (xp) => {
                        await awardXP(xp)
                        await incrementStat("STRENGTH", 1)
                        onUserUpdate()
                        loadData()
                        setActiveTab("overview")
                    }}
                />
            )}

            {activeTab === "metrics" && (
                <BodyMetricsScreen profile={profile} onUpdate={loadData} />
            )}

            {activeTab === "prs" && (
                <PRTracker profile={profile} />
            )}

            {activeTab === "exercises" && (
                <ExerciseDatabase />
            )}

            {activeTab === "skills" && (
                <SkillsTracker profile={profile} onUserUpdate={onUserUpdate} />
            )}

            {activeTab === "history" && (
                <ExerciseHistory profile={profile} />
            )}
        </div>
    )
}