import { useState, useEffect } from "react"
import { db, type StatRecord } from "../db"
import { type User } from "../db"
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

const STAT_CONFIG = {
  STRENGTH: { icon: "💪", color: "#40d4e8", label: "Strength" },
  MIND:     { icon: "🧠", color: "#9b6ff0", label: "Mind" },
  WEALTH:   { icon: "💰", color: "#f0c040", label: "Wealth" },
  EXPLORER: { icon: "🌍", color: "#40e890", label: "Explorer" },
  FOCUS:    { icon: "🎯", color: "#e84040", label: "Focus" },
  HEALTH:   { icon: "❤️", color: "#f08040", label: "Health" },
    HOME:   { icon: "🏠", color: "#e1d49e", label: "Home" },
}

type StatKey = keyof typeof STAT_CONFIG

export default function StatsPage({ user }: { user: User }) {
  const [stats, setStats] = useState<Record<string, number>>({})
  const [totalQuests, setTotalQuests] = useState(0)
  const [totalMissions, setTotalMissions] = useState(0)

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    // Load stat scores
    const records: StatRecord[] = await db.statRecords.toArray()
    const scoreMap: Record<string, number> = {}
    records.forEach(r => { scoreMap[r.category] = r.score })
    setStats(scoreMap)

    // Load counts
    const qCount = await db.quests.filter(q => q.isCompleted).count()
    const mCount = await db.missions.filter(m => m.isCompleted).count()
    setTotalQuests(qCount)
    setTotalMissions(mCount)
  }

  // Build radar data — normalize scores to 0-100 for display
  const maxScore = Math.max(...Object.values(stats), 1)
  const radarData = Object.entries(STAT_CONFIG).map(([key, cfg]) => ({
    category: cfg.label,
    score: stats[key] || 0,
    fullMark: maxScore,
    icon: cfg.icon,
  }))

  const totalScore = Object.values(stats).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-rajdhani font-bold text-xl text-white tracking-wide leading-none uppercase">
              {user.username}
            </div>
            <div className="font-mono text-[10px] text-purple tracking-widest mt-1 uppercase">
              {user.title}
            </div>
          </div>
          <div className="text-right">
            <div className="font-rajdhani font-bold text-3xl text-gold leading-none">
              {user.level}
            </div>
            <div className="font-mono text-[9px] text-muted tracking-widest mt-1">LEVEL</div>
          </div>
        </div>

        {/* All-time stats row */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: "Total XP", val: user.totalXP.toLocaleString(), color: "text-gold" },
            { label: "Quests Done", val: totalQuests, color: "text-cyan" },
            { label: "Missions Done", val: totalMissions, color: "text-purple" },
          ].map(s => (
            <div key={s.label} className="bg-surface2 border border-border rounded-lg p-2.5 text-center">
              <div className={`font-rajdhani font-bold text-xl leading-none ${s.color}`}>{s.val}</div>
              <div className="font-mono text-[9px] text-muted mt-1 tracking-wide">{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Radar chart */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-px bg-gold"></div>
          <span className="font-mono text-[10px] text-muted tracking-widest uppercase">Character Radar</span>
          <div className="ml-auto font-mono text-[10px] text-gold">
            {totalScore} total pts
          </div>
        </div>

        {totalScore === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-30">
            <div className="text-4xl mb-2">📊</div>
            <div className="font-mono text-xs text-muted text-center">
              Complete quests and missions<br />to build your stats
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid
                stroke="#2a2a3e"
                strokeWidth={1}
              />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: "#6a6a8a", fontSize: 11, fontFamily: "Share Tech Mono" }}
              />
              <Radar
                name="Stats"
                dataKey="score"
                stroke="#f0c040"
                fill="#f0c040"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              
              <Tooltip
                contentStyle={{
                  background: "#12121a",
                  border: "1px solid #2a2a3e",
                  borderRadius: "8px",
                  fontFamily: "Share Tech Mono",
                  fontSize: "11px",
                  color: "#f0c040",
                }}
                formatter={(value) => [`${value ?? 0} pts`, "Score"]}
              />
              
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category cards */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-px bg-gold"></div>
          <span className="font-mono text-[10px] text-muted tracking-widest uppercase">Category Breakdown</span>
        </div>
        <div className="space-y-2">
          {(Object.entries(STAT_CONFIG) as [StatKey, typeof STAT_CONFIG[StatKey]][]).map(([key, cfg]) => {
            const score = stats[key] || 0
            const pct = maxScore > 0 ? (score / maxScore) * 100 : 0
            return (
              <div key={key} className="bg-surface border border-border rounded-xl px-4 py-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">{cfg.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-rajdhani font-bold text-sm text-white tracking-wide">
                        {cfg.label.toUpperCase()}
                      </span>
                      <span
                        className="font-rajdhani font-bold text-lg leading-none"
                        style={{ color: cfg.color }}
                      >
                        {score}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: cfg.color,
                      opacity: score === 0 ? 0.2 : 1,
                    }}
                  />
                </div>
                {score === 0 && (
                  <div className="font-mono text-[9px] text-muted mt-1.5">
                    No activity yet — complete {cfg.label.toLowerCase()} quests to build this stat
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Rank progress */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-px bg-gold"></div>
          <span className="font-mono text-[10px] text-muted tracking-widest uppercase">Rank Progression</span>
        </div>
        <div className="flex items-center justify-between">
          {["F", "E", "D", "C", "B", "A", "S"].map(rank => {
            const isActive = rank === user.rank
            const ranks = ["F", "E", "D", "C", "B", "A", "S"]
            const isPast = ranks.indexOf(rank) < ranks.indexOf(user.rank)
            return (
              <div key={rank} className="flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center font-rajdhani font-bold text-base transition-all ${
                  isActive
                    ? "border-gold bg-gold/15 text-gold shadow-sm"
                    : isPast
                    ? "border-green/30 bg-green/5 text-green"
                    : "border-border text-muted opacity-40"
                }`}>
                  {rank}
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-3 font-mono text-[10px] text-muted text-center">
          Current rank: <span className="text-gold">{user.rank}</span>
          {user.rank !== "S" && (
            <span> · Keep leveling up to advance</span>
          )}
        </div>
      </div>

    </div>
  )
}