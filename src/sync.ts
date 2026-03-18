import { supabase } from "./supabase"
import { db, type Quest, type Mission, type JournalEntry, type User } from "./db"

// Get current user ID from Supabase session
async function getUserId(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user?.id ?? null
}

// ── USER ──────────────────────────────────────────────

export async function syncUserToCloud(user: User) {
    const userId = await getUserId()
    if (!userId) return

    await supabase.from("users").upsert({
        id: userId,
        username: user.username,
        title: user.title,
        level: user.level,
        current_xp: user.currentXP,
        total_xp: user.totalXP,
        rank: user.rank,
    })
}

export async function loadUserFromCloud(): Promise<User | null> {
    const userId = await getUserId()
    if (!userId) return null

    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single()

    if (error || !data) return null

    return {
        username: data.username,
        title: data.title,
        level: data.level,
        currentXP: data.current_xp,
        totalXP: data.total_xp,
        rank: data.rank,
    }
}

// ── QUESTS ────────────────────────────────────────────

export async function syncQuestToCloud(quest: Quest) {
    const userId = await getUserId()
    if (!userId) return

    await supabase.from("quests").upsert({
        user_id: userId,
        title: quest.title,
        category: quest.category,
        frequency: quest.frequency,
        xp_reward: quest.xpReward,
        is_completed: quest.isCompleted,
        created_at: quest.createdAt,
        completed_at: quest.completedAt ?? null,
    })
}

export async function loadQuestsFromCloud(): Promise<Quest[]> {
    const userId = await getUserId()
    if (!userId) return []

    const { data, error } = await supabase
        .from("quests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

    if (error || !data) return []

    return data.map(q => ({
        title: q.title,
        category: q.category,
        frequency: q.frequency,
        xpReward: q.xp_reward,
        isCompleted: q.is_completed,
        createdAt: new Date(q.created_at),
        completedAt: q.completed_at ? new Date(q.completed_at) : undefined,
    }))
}

// ── MISSIONS ──────────────────────────────────────────

export async function syncMissionToCloud(mission: Mission) {
    const userId = await getUserId()
    if (!userId) return

    await supabase.from("missions").upsert({
        user_id: userId,
        title: mission.title,
        mission_type: mission.missionType,
        category: mission.category,
        current_value: mission.currentValue,
        target_value: mission.targetValue,
        xp_reward: mission.xpReward,
        title_reward: mission.titleReward ?? null,
        is_completed: mission.isCompleted,
        deadline: mission.deadline ?? null,
        created_at: mission.createdAt,
        completed_at: mission.completedAt ?? null,
    })
}

export async function loadMissionsFromCloud(): Promise<Mission[]> {
    const userId = await getUserId()
    if (!userId) return []

    const { data, error } = await supabase
        .from("missions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

    if (error || !data) return []

    return data.map(m => ({
        title: m.title,
        missionType: m.mission_type,
        category: m.category,
        currentValue: m.current_value,
        targetValue: m.target_value,
        xpReward: m.xp_reward,
        titleReward: m.title_reward ?? undefined,
        isCompleted: m.is_completed,
        deadline: m.deadline ? new Date(m.deadline) : undefined,
        createdAt: new Date(m.created_at),
        completedAt: m.completed_at ? new Date(m.completed_at) : undefined,
    }))
}

// ── JOURNAL ───────────────────────────────────────────

export async function syncJournalEntryToCloud(entry: JournalEntry) {
    const userId = await getUserId()
    if (!userId) return

    await supabase.from("journal_entries").upsert({
        user_id: userId,
        content: entry.content,
        mood: entry.mood,
        tags: entry.tags,
        linked_quest_ids: [],
        created_at: entry.createdAt,
    })
}

export async function loadJournalFromCloud(): Promise<JournalEntry[]> {
    const userId = await getUserId()
    if (!userId) return []

    const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

    if (error || !data) return []

    return data.map(e => ({
        content: e.content,
        mood: e.mood,
        tags: e.tags ?? [],
        linkedQuestIds: [],
        createdAt: new Date(e.created_at),
    }))
}

// ── STATS ─────────────────────────────────────────────

export async function syncStatToCloud(category: string, score: number) {
    const userId = await getUserId()
    if (!userId) return

    await supabase.from("stat_records").upsert(
        {
            user_id: userId,
            category,
            score,
            updated_at: new Date(),
        },
        { onConflict: "user_id,category" }
    )
}

export async function loadStatsFromCloud(): Promise<{ category: string; score: number }[]> {
    const userId = await getUserId()
    if (!userId) return []

    const { data, error } = await supabase
        .from("stat_records")
        .select("*")
        .eq("user_id", userId)

    if (error || !data) return []

    return data.map(s => ({
        category: s.category,
        score: s.score,
    }))
}

// ── FULL SYNC ─────────────────────────────────────────
// Call this on login — pulls cloud data into local Dexie DB

export async function pullFromCloud() {
    const userId = await getUserId()
    if (!userId) return

    try {
        // Pull user
        const cloudUser = await loadUserFromCloud()
        if (cloudUser) {
            const localUser = await db.users.toCollection().first()
            if (localUser?.id) {
                await db.users.update(localUser.id, cloudUser)
            } else {
                await db.users.add(cloudUser)
            }
        }

        // Pull quests
        const cloudQuests = await loadQuestsFromCloud()
        if (cloudQuests.length > 0) {
            await db.quests.clear()
            await db.quests.bulkAdd(cloudQuests)
        }

        // Pull missions
        const cloudMissions = await loadMissionsFromCloud()
        if (cloudMissions.length > 0) {
            await db.missions.clear()
            await db.missions.bulkAdd(cloudMissions)
        }

        // Pull journal
        const cloudJournal = await loadJournalFromCloud()
        if (cloudJournal.length > 0) {
            await db.journalEntries.clear()
            await db.journalEntries.bulkAdd(cloudJournal)
        }

        // Pull stats
        const cloudStats = await loadStatsFromCloud()
        if (cloudStats.length > 0) {
            await db.statRecords.clear()
            await db.statRecords.bulkAdd(
                cloudStats.map(s => ({ ...s, updatedAt: new Date() }))
            )
        }
    } catch (err) {
        console.error("Cloud sync failed:", err)
    }
}