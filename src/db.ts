import Dexie, { type Table } from "dexie"

export interface Quest {
  id?: number
  title: string
  category: string
  frequency: "daily" | "weekly" | "bi-weekly" | "monthly" | "semi-annually" | "bi-annually" | "annually" | "oneTime"
  xpReward: number
  isCompleted: boolean
  createdAt: Date
  completedAt?: Date
}

export interface Mission {
  id?: number
  title: string
  missionType: "main" | "seasonal" | "yearly" | "sideQuest"
  category: string
  currentValue: number
  targetValue: number
  xpReward: number
  titleReward?: string
  isCompleted: boolean
  deadline?: Date
  createdAt: Date
  completedAt?: Date
}

export interface User {
  id?: number
  username: string
  level: number
  currentXP: number
  totalXP: number
  rank: string
  title: string
}

export class LVLUpDatabase extends Dexie {
  quests!: Table<Quest>
  users!: Table<User>
  missions!: Table<Mission>

  constructor() {
    super("lvlup-db")
    this.version(2).stores({
        quests: "++id, category, frequency, isCompleted, createdAt",
        users: "++id, username",
        missions: "++id, missionType, category, isCompleted, createdAt",
    })
  }
}

export const db = new LVLUpDatabase()

// Create default user on first launch
export async function initUser() {
  const count = await db.users.count()
  if (count === 0) {
    await db.users.add({
      username: "Shadow",
      level: 1,
      currentXP: 0,
      totalXP: 0,
      rank: "F",
      title: "Newcomer",
    })
  }
}