import { useState, useEffect } from "react"
import { db, type JournalEntry, type Quest } from "../db"
import { awardXP } from "../xpEngine"
import { syncJournalEntryToCloud } from "../sync"

const MOOD_CONFIG = {
  struggling: { emoji: "😔", label: "Struggling", color: "text-red", border: "border-red/40", bg: "bg-red/10" },
  neutral: { emoji: "😐", label: "Neutral", color: "text-muted", border: "border-border", bg: "bg-surface2" },
  good: { emoji: "🙂", label: "Good", color: "text-gold", border: "border-gold/40", bg: "bg-gold/10" },
  great: { emoji: "😄", label: "Great", color: "text-cyan", border: "border-cyan/40", bg: "bg-cyan/10" },
  "locked in": { emoji: "🔥", label: "Locked In", color: "text-purple", border: "border-purple/40", bg: "bg-purple/10" },
}

type Mood = keyof typeof MOOD_CONFIG

export default function JournalPage({ onLevelUp }: {
  onLevelUp: (msg: string, isRankUp: boolean) => void
}) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [showEditor, setShowEditor] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)

  useEffect(() => { loadEntries() }, [])

  async function loadEntries() {
    const all = await db.journalEntries.orderBy("createdAt").reverse().toArray()
    setEntries(all)
  }

  function openNew() {
    setSelectedEntry(null)
    setShowEditor(true)
  }

  function openEntry(entry: JournalEntry) {
    setSelectedEntry(entry)
    setShowEditor(true)
  }

  async function deleteEntry(id: number) {
    await db.journalEntries.delete(id)
    loadEntries()
  }

  // Group entries by month
  const grouped = entries.reduce<Record<string, JournalEntry[]>>((acc, entry) => {
    const key = new Date(entry.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    if (!acc[key]) acc[key] = []
    acc[key].push(entry)
    return acc
  }, {})

  const todayKey = new Date().toDateString()
  const hasEntryToday = entries.some(e => new Date(e.createdAt).toDateString() === todayKey)

  return (
    <div className="space-y-5">

      {/* Header card */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-rajdhani font-bold text-xl text-white tracking-wide leading-none">
              FIELD JOURNAL
            </div>
            <div className="font-mono text-[10px] text-muted tracking-widest mt-1">
              {entries.length} {entries.length === 1 ? "ENTRY" : "ENTRIES"} LOGGED
            </div>
          </div>
          <div className="text-right">
            <div className="font-rajdhani font-bold text-3xl text-orange leading-none">
              {entries.length}
            </div>
            <div className="font-mono text-[9px] text-muted tracking-widest mt-1">TOTAL</div>
          </div>
        </div>

        {/* Mood streak row */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {entries.slice(0, 7).reverse().map((entry, i) => {
            const mood = MOOD_CONFIG[entry.mood as Mood]
            return (
              <div key={i} className={`flex-shrink-0 w-9 h-9 rounded-lg border ${mood.border} ${mood.bg} flex items-center justify-center text-base`}>
                {mood.emoji}
              </div>
            )
          })}
          {entries.length === 0 && (
            <div className="font-mono text-[10px] text-muted tracking-wide">No entries yet — write your first one below</div>
          )}
        </div>
      </div>

      {/* New entry button */}
      {!hasEntryToday ? (
        <button
          onClick={openNew}
          className="w-full border border-dashed border-gold/40 bg-gold/5 rounded-xl py-4 flex flex-col items-center gap-1.5 hover:bg-gold/10 transition-all"
        >
          <span className="text-2xl">📝</span>
          <span className="font-rajdhani font-bold text-sm text-gold tracking-widest uppercase">Log Today's Entry</span>
          <span className="font-mono text-[9px] text-muted">+10 XP for writing</span>
        </button>
      ) : (
        <button
          onClick={openNew}
          className="w-full border border-dashed border-border rounded-xl py-3 font-mono text-[10px] text-muted tracking-widest hover:border-gold hover:text-gold transition-all"
        >
          + ADD ANOTHER ENTRY
        </button>
      )}

      {/* Entries grouped by month */}
      {Object.entries(grouped).map(([month, monthEntries]) => (
        <div key={month}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-px bg-orange"></div>
            <span className="font-mono text-[10px] text-muted tracking-widest uppercase">{month}</span>
          </div>
          <div className="space-y-2">
            {monthEntries.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onOpen={() => openEntry(entry)}
                onDelete={() => entry.id && deleteEntry(entry.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 opacity-30">
          <div className="text-5xl mb-3">📖</div>
          <div className="font-rajdhani font-bold text-xl text-muted tracking-widest">NO ENTRIES YET</div>
          <div className="font-mono text-xs text-muted mt-2">Every legend has a story. Start yours.</div>
        </div>
      )}

      {/* Editor */}
      {showEditor && (
        <JournalEditor
          existing={selectedEntry}
          onClose={() => setShowEditor(false)}
          onSave={() => { setShowEditor(false); loadEntries() }}
          onLevelUp={onLevelUp}
        />
      )}
    </div>
  )
}

function EntryCard({ entry, onOpen, onDelete }: {
  entry: JournalEntry
  onOpen: () => void
  onDelete: () => void
}) {
  const mood = MOOD_CONFIG[entry.mood as Mood]
  const date = new Date(entry.createdAt)

  return (
    <div
      className="bg-surface border border-border rounded-xl p-4 cursor-pointer hover:border-orange/40 transition-all"
      onClick={onOpen}
    >
      <div className="flex items-start gap-3">
        {/* Mood emoji */}
        <div className={`w-10 h-10 rounded-lg border ${mood.border} ${mood.bg} flex items-center justify-center text-lg flex-shrink-0`}>
          {mood.emoji}
        </div>

        <div className="flex-1 min-w-0">
          {/* Date + mood */}
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] text-muted">
              {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
            <span className={`font-mono text-[9px] ${mood.color} tracking-wide`}>
              {mood.label.toUpperCase()}
            </span>
          </div>

          {/* Content preview */}
          <div className="text-sm text-muted line-clamp-2 leading-relaxed">
            {entry.content || <span className="italic opacity-50">No content</span>}
          </div>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {entry.tags.map(tag => (
                <span key={tag} className="font-mono text-[9px] px-2 py-0.5 rounded border border-border text-muted bg-surface2">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="text-muted hover:text-red transition-colors text-sm flex-shrink-0"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function JournalEditor({ existing, onClose, onSave, onLevelUp }: {
  existing: JournalEntry | null
  onClose: () => void
  onSave: () => void
  onLevelUp: (msg: string, isRankUp: boolean) => void
}) {
  const [content, setContent] = useState(existing?.content ?? "")
  const [mood, setMood] = useState<Mood>(existing?.mood ?? "good")
  const [tags, setTags] = useState<string[]>(existing?.tags ?? [])
  const [tagInput, setTagInput] = useState("")
  const [linkedQuestIds, setLinkedQuestIds] = useState<number[]>(existing?.linkedQuestIds ?? [])
  const [completedQuests, setCompletedQuests] = useState<Quest[]>([])

  useEffect(() => { loadTodaysQuests() }, [])

  async function loadTodaysQuests() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const quests = await db.quests
      .filter(q => q.isCompleted && q.completedAt !== undefined &&
        new Date(q.completedAt!).toDateString() === new Date().toDateString())
      .toArray()
    setCompletedQuests(quests)
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-")
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput("")
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag))
  }

  function toggleQuest(id: number) {
    setLinkedQuestIds(prev =>
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    )
  }

  async function save() {
    if (!content.trim()) return

    if (existing?.id) {
      await db.journalEntries.update(existing.id, {
        content, mood, tags, linkedQuestIds,
      })
    } else {
      await db.journalEntries.add({
        content, mood, tags, linkedQuestIds,
        createdAt: new Date(),
      })

      const saved = await db.journalEntries.orderBy("createdAt").last()
      if (saved) await syncJournalEntryToCloud(saved)

      // Award XP for new entry
      const previousUser = await db.users.toCollection().first()
      const previousRank = previousUser?.rank
      const result = await awardXP(10)
      const updatedUser = await db.users.toCollection().first()
      const newRank = updatedUser?.rank

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

    onSave()
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end left-0 right-0 max-w-sm mx-auto">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-surface border-t border-border rounded-t-2xl p-5 space-y-4 z-50 max-h-[92vh] overflow-y-auto w-full">

        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="font-rajdhani font-bold text-lg text-orange tracking-wide">
            {existing ? "EDIT ENTRY" : "NEW ENTRY"}
          </span>
          <button onClick={onClose} className="text-muted text-xl leading-none">✕</button>
        </div>

        {/* Mood picker */}
        <div>
          <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-2">How are you feeling?</label>
          <div className="flex gap-2">
            {(Object.entries(MOOD_CONFIG) as [Mood, typeof MOOD_CONFIG[Mood]][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setMood(key)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all ${mood === key
                  ? `${cfg.border} ${cfg.bg} ${cfg.color}`
                  : "border-border text-muted"
                  }`}
              >
                <span className="text-lg">{cfg.emoji}</span>
                <span className="font-mono text-[8px] tracking-wide">{cfg.label.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-2">Entry</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What happened today? What did you learn? What are you proud of?"
            rows={6}
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-orange transition-colors placeholder:text-muted resize-none leading-relaxed"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-2">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTag()}
              placeholder="Add a tag..."
              className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange transition-colors placeholder:text-muted"
            />
            <button
              onClick={addTag}
              className="px-3 py-2 border border-border rounded-lg font-mono text-[10px] text-muted hover:border-orange hover:text-orange transition-all"
            >
              ADD
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <span
                  key={tag}
                  onClick={() => removeTag(tag)}
                  className="font-mono text-[10px] px-2.5 py-1 rounded border border-orange/30 bg-orange/10 text-orange cursor-pointer hover:bg-red/10 hover:border-red/30 hover:text-red transition-all"
                >
                  #{tag} ✕
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Link completed quests */}
        {completedQuests.length > 0 && (
          <div>
            <label className="font-mono text-[9px] text-muted tracking-widest uppercase block mb-2">
              Link today's quests
            </label>
            <div className="space-y-1.5">
              {completedQuests.map(quest => (
                <div
                  key={quest.id}
                  onClick={() => toggleQuest(quest.id!)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${linkedQuestIds.includes(quest.id!)
                    ? "border-green/40 bg-green/5"
                    : "border-border"
                    }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] flex-shrink-0 ${linkedQuestIds.includes(quest.id!)
                    ? "bg-green border-green text-bg font-bold"
                    : "border-border"
                    }`}>
                    {linkedQuestIds.includes(quest.id!) && "✓"}
                  </div>
                  <span className="text-sm text-muted">{quest.title}</span>
                  <span className="font-mono text-[9px] text-gold ml-auto">+{quest.xpReward} XP</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save */}
        <button
          onClick={save}
          className="w-full bg-orange text-bg font-rajdhani font-bold text-lg py-3 rounded-xl tracking-widest uppercase hover:opacity-90 active:opacity-70 transition-opacity"
        >
          {existing ? "Save Changes" : "Log Entry"}
        </button>
      </div>
    </div>
  )
}