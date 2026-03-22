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
  isArchived?: boolean
}

export interface StatRecord {
  id?: number
  category: string
  score: number
  updatedAt: Date
}

export interface JournalEntry {
  id?: number
  content: string
  mood: "struggling" | "neutral" | "good" | "great" | "locked in"
  tags: string[]
  linkedQuestIds: number[]
  createdAt: Date
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

export interface Streak {
  id?: number
  currentStreak: number
  longestStreak: number
  lastActiveDate: string
  activeDays: string[]
}

export interface MissionStep {
  id?: number
  missionId: number
  title: string
  isCompleted: boolean
  xpReward: number
  createdAt: Date
  completedAt?: Date
}

export interface Habit {
  id?: number
  title: string
  category: string
  frequency: "daily" | "weekly" | "bi-weekly" | "monthly"
  timeOfDay: "morning" | "afternoon" | "night" | "anytime"
  xpReward: number
  currentStreak: number
  longestStreak: number
  lastCompletedDate: string
  completedDates: string[]
  createdAt: Date
  isArchived?: boolean
}

export class LVLUpDatabase extends Dexie {
  quests!: Table<Quest>
  users!: Table<User>
  missions!: Table<Mission>
  statRecords!: Table<StatRecord>
  journalEntries!: Table<JournalEntry>
  streaks!: Table<Streak>
  missionSteps!: Table<MissionStep>
  habits!: Table<Habit>


  constructor() {
    super("lvlup-db")
    this.version(8).stores({
      quests: "++id, category, frequency, isCompleted, createdAt",
      users: "++id, username",
      missions: "++id, missionType, category, isCompleted, createdAt",
      statRecords: "++id, category, updatedAt",
      journalEntries: "++id, mood, createdAt",
      streaks: "++id, lastActiveDate",
      missionSteps: "++id, missionId, isCompleted, createdAt",
      habits: "++id, category, timeOfDay, lastCompletedDate, createdAt",
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