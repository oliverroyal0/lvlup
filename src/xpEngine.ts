import { db } from "./db"

const XP_PER_LEVEL = 500

export function xpForNextLevel(level: number): number {
  return level * XP_PER_LEVEL
}

export function rankFromLevel(level: number): string {
  if (level >= 50) return "S"
  if (level >= 30) return "A"
  if (level >= 20) return "B"
  if (level >= 10) return "C"
  if (level >= 5)  return "D"
  if (level >= 2)  return "E"
  return "F"
}

export function titleFromLevel(level: number): string {
  if (level >= 50) return "Legendary"
  if (level >= 30) return "Shadow Grinder"
  if (level >= 20) return "Awakened"
  if (level >= 10) return "Rising"
  if (level >= 5)  return "Initiate"
  return "Newcomer"
}

export async function awardXP(amount: number): Promise<{
  leveledUp: boolean
  newLevel: number
  newRank: string
}> {
    
  const user = await db.users.toCollection().first()
  if (!user || !user.id) return { leveledUp: false, newLevel: 1, newRank: "F" }

  const newTotalXP = user.totalXP + amount
  let newCurrentXP = user.currentXP + amount
  let newLevel = user.level
  let leveledUp = false

  // Check for level up
  while (newCurrentXP >= xpForNextLevel(newLevel)) {
    newCurrentXP -= xpForNextLevel(newLevel)
    newLevel++
    leveledUp = true
  }

  const newRank = rankFromLevel(newLevel)
  const newTitle = titleFromLevel(newLevel)

  await db.users.update(user.id, {
    totalXP: newTotalXP,
    currentXP: newCurrentXP,
    level: newLevel,
    rank: newRank,
    title: newTitle,
  })

  return { leveledUp, newLevel, newRank }
}

export async function incrementStat(category: string, amount: number = 1) {
  const existing = await db.statRecords
    .where("category")
    .equals(category)
    .first()

  if (existing && existing.id) {
    await db.statRecords.update(existing.id, {
      score: existing.score + amount,
      updatedAt: new Date(),
    })
  } else {
    await db.statRecords.add({
      category,
      score: amount,
      updatedAt: new Date(),
    })
  }
}