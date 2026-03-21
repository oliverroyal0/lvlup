import { db } from "./db"

export async function getOrCreateStreak() {
  const existing = await db.streaks.toCollection().first()
  if (existing) return existing

  const newStreak = {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: "",
    activeDays: [] as string[],
  }
  const id = await db.streaks.add(newStreak)
  return { ...newStreak, id }
}

export async function updateStreak() {
  const today = new Date().toDateString()
  const streak = await getOrCreateStreak()
  if (!streak.id) return streak

  // Already logged today
  if (streak.lastActiveDate === today) return streak

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toDateString()

  const newActiveDays = [...new Set([...streak.activeDays, today])]

  let newStreak = 1
  if (streak.lastActiveDate === yesterdayStr) {
    newStreak = streak.currentStreak + 1
  }

  const newLongest = Math.max(newStreak, streak.longestStreak)

  await db.streaks.update(streak.id, {
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastActiveDate: today,
    activeDays: newActiveDays,
  })

  return { ...streak, currentStreak: newStreak, longestStreak: newLongest, lastActiveDate: today, activeDays: newActiveDays }
}

export async function getCurrentStreak() {
  const streak = await getOrCreateStreak()

  // Check if streak is broken — last active was not today or yesterday
  const today = new Date().toDateString()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toDateString()

  if (
    streak.lastActiveDate !== today &&
    streak.lastActiveDate !== yesterdayStr &&
    streak.lastActiveDate !== ""
  ) {
    // Streak broken — reset
    if (streak.id) {
      await db.streaks.update(streak.id, { currentStreak: 0 })
    }
    return { ...streak, currentStreak: 0 }
  }

  return streak
}