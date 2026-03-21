import { useState, useEffect } from "react"
import { db, type Mission } from "../db"
import { awardXP, incrementStat } from "../xpEngine"
import { syncMissionToCloud } from "../sync"

const MISSION_COLORS = {
  main: { border: "border-gold/40", bg: "bg-gold/5", label: "text-gold", badge: "bg-gold/15 text-gold border-gold/30" },
  seasonal: { border: "border-cyan/40", bg: "bg-cyan/5", label: "text-cyan", badge: "bg-cyan/15 text-cyan border-cyan/30" },
  yearly: { border: "border-purple/40", bg: "bg-purple/5", label: "text-purple", badge: "bg-purple/15 text-purple border-purple/30" },
  sideQuest: { border: "border-muted/40", bg: "bg-surface", label: "text-muted", badge: "bg-surface2 text-muted border-border" },
}

const MISSION_LABELS = {
  main: "Main Quest",
  seasonal: "Seasonal",
  yearly: "Yearly",
  sideQuest: "Side Quest",
}

const MISSION_ICONS = {
  main: "⭐",
  seasonal: "🌙",
  yearly: "🏆",
  sideQuest: "🗺️",
}

export default function MissionsPage({ onUserUpdate, onLevelUp }: {
  onUserUpdate: () => void
  onLevelUp: (msg: string, isRankUp: boolean) => void
}) {

  const [missions, setMissions] = useState<Mission[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"all" | Mission["missionType"]>("all")

  useEffect(() => { loadMissions() }, [])

  async function loadMissions() {
    const all = await db.missions.orderBy("createdAt").reverse().toArray()
    setMissions(all)
  }

  async function incrementProgress(mission: Mission) {
    if (!mission.id || mission.isCompleted) return

    const newValue = mission.currentValue + 1
    const isNowComplete = newValue >= mission.targetValue

    await db.missions.update(mission.id, {
      currentValue: newValue,
      isCompleted: isNowComplete,
      completedAt: isNowComplete ? new Date() : undefined,
    })

    const updated = await db.missions.get(mission.id!)
    if (updated) await syncMissionToCloud(updated)

    if (isNowComplete) {
      const previousUser = await db.users.toCollection().first()
      const previousRank = previousUser?.rank
      const result = await awardXP(mission.xpReward)
      await incrementStat(mission.category)
      const updatedUser = await db.users.toCollection().first()
      const newRank = updatedUser?.rank
      onUserUpdate()

      if (result.leveledUp) {
        const rankChanged = newRank && previousRank && newRank !== previousRank
        onLevelUp(
          rankChanged
            ? `${previousRank} → ${newRank}`
            : `Level ${result.newLevel} · Rank ${result.newRank}`,
          !!rankChanged
        )
      }
    }

    loadMissions()
  }
  async function deleteMission(id: number) {
    await db.missions.delete(id)
    loadMissions()
  }

  const filtered = activeFilter === "all"
    ? missions
    : missions.filter(m => m.missionType === activeFilter)

  const activeMissions = filtered.filter(m => !m.isCompleted)
  const completedMissions = filtered.filter(m => m.isCompleted)

  return (
    <div className="space-y-5">

      {/* Header stats */}
      <div className="grid grid-cols-3 gap-2">
        {(["main", "seasonal", "sideQuest"] as const).map(type => {
          const count = missions.filter(m => m.missionType === type && !m.isCompleted).length
          const colors = MISSION_COLORS[type]
          return (
            <div key={type} className={`border ${colors.border} ${colors.bg} rounded-xl p-3 text-center`}>
              <div className="text-xl mb-1">{MISSION_ICONS[type]}</div>
              <div className={`font-rajdhani font-bold text-2xl leading-none ${colors.label}`}>{count}</div>
              <div className="font-mono text-[9px] text-muted mt-1 tracking-wide">{MISSION_LABELS[type].toUpperCase()}</div>
            </div>
          )
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["all", "main", "seasonal", "yearly", "sideQuest"] as const).map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`flex-shrink-0 font-mono text-[10px] px-3 py-1.5 rounded-lg border transition-all tracking-wide ${activeFilter === filter
              ? "border-gold bg-gold/10 text-gold"
              : "border-border text-muted"
              }`}
          >
            {filter === "all" ? "ALL" : MISSION_LABELS[filter].toUpperCase()}
          </button>
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={() => setShowAdd(true)}
        className="w-full border border-dashed border-border rounded-xl py-3 font-mono text-[10px] text-muted tracking-widest hover:border-gold hover:text-gold transition-all"
      >
        + NEW MISSION
      </button>

      {/* Active missions */}
      {activeMissions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-gold"></div>
            <span className="font-mono text-[10px] text-muted tracking-widest uppercase">Active</span>
          </div>
          {activeMissions.map(mission => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onIncrement={() => incrementProgress(mission)}
              onDelete={() => mission.id && deleteMission(mission.id)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {activeMissions.length === 0 && completedMissions.length === 0 && (
        <div className="text-center py-16 opacity-30">
          <div className="text-5xl mb-3">🗺️</div>
          <div className="font-rajdhani font-bold text-xl text-muted tracking-widest">NO MISSIONS YET</div>
          <div className="font-mono text-xs text-muted mt-2">Every legend starts somewhere.</div>
        </div>
      )}

      {/* Completed missions */}
      {completedMissions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-green"></div>
            <span className="font-mono text-[10px] text-muted tracking-widest uppercase">Completed</span>
          </div>
          {completedMissions.map(mission => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onIncrement={() => { }}
              onDelete={() => mission.id && deleteMission(mission.id)}
            />
          ))}
        </div>
      )}

      {/* Add Mission Sheet */}
      {showAdd && (
        <AddMissionSheet
          onClose={() => setShowAdd(false)}
          onSave={() => { setShowAdd(false); loadMissions() }}
        />
      )}
    </div>
  )
}

function MissionCard({ mission, onIncrement, onDelete }: {
  mission: Mission
  onIncrement: () => void
  onDelete: () => void
}) {
  const colors = MISSION_COLORS[mission.missionType]
  const pct = mission.targetValue > 0
    ? Math.min((mission.currentValue / mission.targetValue) * 100, 100)
    : 0

  return (
    <div className={`border ${colors.border} ${colors.bg} rounded-xl p-4 space-y-3`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-mono text-[9px] px-2 py-0.5 rounded border ${colors.badge} tracking-widest`}>
              {MISSION_ICONS[mission.missionType]} {MISSION_LABELS[mission.missionType].toUpperCase()}
            </span>
            <span className="font-mono text-[9px] text-muted tracking-wide">{mission.category}</span>
          </div>
          <div className={`font-rajdhani font-bold text-lg leading-tight ${mission.isCompleted ? "text-muted line-through" : "text-white"}`}>
            {mission.title}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="text-muted hover:text-red transition-colors text-sm flex-shrink-0 mt-0.5"
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      {mission.targetValue > 1 && (
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="font-mono text-[10px] text-muted">Progress</span>
            <span className={`font-mono text-[10px] ${colors.label}`}>
              {mission.currentValue} / {mission.targetValue}
            </span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${mission.isCompleted
                ? "bg-green"
                : mission.missionType === "main" ? "bg-gradient-to-r from-purple to-gold"
                  : mission.missionType === "seasonal" ? "bg-cyan"
                    : mission.missionType === "yearly" ? "bg-purple"
                      : "bg-muted"
                }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-gold">⭐ +{mission.xpReward} XP</span>
          {mission.titleReward && (
            <span className="font-mono text-[10px] text-purple">🏷️ {mission.titleReward}</span>
          )}
          {mission.deadline && (
            <span className="font-mono text-[10px] text-red">
              📅 {new Date(mission.deadline).toLocaleDateString()}
            </span>
          )}
        </div>
        {!mission.isCompleted && (
          <button
            onClick={onIncrement}
            className="font-mono text-[10px] px-3 py-1.5 rounded-lg border border-border text-muted hover:border-gold hover:text-gold transition-all"
          >
            {mission.targetValue <= 1 ? "COMPLETE ✓" : "LOG +1"}
          </button>
        )}
        {mission.isCompleted && (
          <span className="font-mono text-[10px] text-green">COMPLETED ✓</span>
        )}
      </div>
    </div>
  )
}

function AddMissionSheet({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [title, setTitle] = useState("")
  const [missionType, setMissionType] = useState<Mission["missionType"]>("main")
  const [category, setCategory] = useState("STRENGTH")
  const [targetValue, setTargetValue] = useState(1)
  const [xpReward, setXpReward] = useState(500)
  const [titleReward, setTitleReward] = useState("")
  const [hasDeadline, setHasDeadline] = useState(false)
  const [deadline, setDeadline] = useState("")

  const categories = ["STRENGTH", "MIND", "WEALTH", "EXPLORER", "FOCUS", "HEALTH"]

  const typeXP = { main: 500, seasonal: 250, yearly: 1000, sideQuest: 150 }

  async function save() {
    if (!title.trim()) return
    await db.missions.add({
      title: title.trim(),
      missionType,
      category,
      currentValue: 0,
      targetValue,
      xpReward,
      titleReward: titleReward.trim() || undefined,
      isCompleted: false,
      deadline: hasDeadline && deadline ? new Date(deadline) : undefined,
      createdAt: new Date(),
    })
    const saved = await db.missions.orderBy("createdAt").last()
    if (saved) await syncMissionToCloud(saved)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end left-0 right-0 max-w-sm mx-auto">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-surface border-t border-border rounded-t-2xl p-5 space-y-4 z-50 max-h-[90vh] overflow-y-auto w-full">

        <div className="flex items-center justify-between">
          <span className="font-rajdhani font-bold text-lg text-gold tracking-wide">NEW MISSION</span>
          <button onClick={onClose} className="text-muted text-xl leading-none">✕</button>
        </div>

        {/* Title */}
        <div>
          <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-2">Mission Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Name your arc..."
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold transition-colors placeholder:text-muted"
          />
        </div>

        {/* Mission Type */}
        <div>
          <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-2">Mission Type</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(MISSION_LABELS) as Mission["missionType"][]).map(type => {
              const colors = MISSION_COLORS[type]
              return (
                <button
                  key={type}
                  onClick={() => { setMissionType(type); setXpReward(typeXP[type]) }}
                  className={`font-mono text-[10px] py-2 rounded-lg border transition-all tracking-wide ${missionType === type
                    ? `${colors.border} ${colors.bg} ${colors.label}`
                    : "border-border text-muted"
                    }`}
                >
                  {MISSION_ICONS[type]} {MISSION_LABELS[type].toUpperCase()}
                </button>
              )
            })}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-2">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`font-mono text-[10px] py-2 rounded-lg border transition-all tracking-wide ${category === cat
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border text-muted"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Target */}
        <div>
          <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-2">
            Target Steps — {targetValue === 1 ? "Single completion" : `${targetValue} steps`}
          </label>
          <input
            type="range"
            min={1}
            max={100}
            value={targetValue}
            onChange={e => setTargetValue(Number(e.target.value))}
            className="w-full accent-gold"
          />
          <div className="flex justify-between font-mono text-[9px] text-muted mt-1">
            <span>1</span><span>50</span><span>100</span>
          </div>
        </div>

        {/* XP Reward */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted tracking-widest uppercase">XP Reward</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setXpReward(Math.max(50, xpReward - 50))} className="w-7 h-7 border border-border rounded-lg text-muted hover:text-gold hover:border-gold transition-all font-bold">−</button>
            <span className="font-rajdhani font-bold text-xl text-gold min-w-[60px] text-center">+{xpReward}</span>
            <button onClick={() => setXpReward(xpReward + 50)} className="w-7 h-7 border border-border rounded-lg text-muted hover:text-gold hover:border-gold transition-all font-bold">+</button>
          </div>
        </div>

        {/* Title Reward */}
        <div>
          <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-2">Title Reward (optional)</label>
          <input
            value={titleReward}
            onChange={e => setTitleReward(e.target.value)}
            placeholder='e.g. "The Builder"'
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-purple transition-colors placeholder:text-muted"
          />
        </div>

        {/* Deadline */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-mono text-[9px] text-muted tracking-widest uppercase">Deadline (optional)</label>
            <button
              onClick={() => setHasDeadline(!hasDeadline)}
              className={`font-mono text-[9px] px-2 py-1 rounded border transition-all ${hasDeadline ? "border-red bg-red/10 text-red" : "border-border text-muted"}`}
            >
              {hasDeadline ? "ON" : "OFF"}
            </button>
          </div>
          {hasDeadline && (
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-red transition-colors"
            />
          )}
        </div>

        {/* Save */}
        <button
          onClick={save}
          className="w-full bg-gold text-bg font-rajdhani font-bold text-lg py-3 rounded-xl tracking-widest uppercase hover:opacity-90 active:opacity-70 transition-opacity"
        >
          Create Mission
        </button>
      </div>
    </div>
  )
}