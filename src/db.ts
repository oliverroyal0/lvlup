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

export interface TravelPin {
  id?: number
  name: string
  country: string
  latitude: number
  longitude: number
  notes?: string
  mood?: string
  visitedDate: string
  photos?: string[]
  createdAt: Date
}

export interface FitnessProfile {
  id?: number
  heightCm?: number
  heightFt?: number
  heightIn?: number
  weightKg?: number
  weightLbs?: number
  age?: number
  gender?: string
  fitnessGoal:string[]
  units: "metric" | "imperial"
  equipment: string[]
  beforePhotoUrl?: string
  createdAt: Date
}

export interface BodyMetric {
  id?: number
  date: string
  weightKg?: number
  weightLbs?: number
  bodyFatPct?: number
  chestCm?: number
  waistCm?: number
  hipsCm?: number
  armCm?: number
  thighCm?: number
  chestIn?: number
  waistIn?: number
  hipsIn?: number
  armIn?: number
  thighIn?: number
  notes?: string
  photoUrl?: string
  createdAt: Date
}

export interface Exercise {
  id?: number
  name: string
  category: "strength" | "calisthenics" | "martial_arts" | "cardio" | "hiit" | "mobility" | "flexibility" | "skill"
  equipment: string[]
  musclesPrimary: string[]
  musclesSecondary: string[]
  description: string
  instructions: string[]
  difficulty: "beginner" | "intermediate" | "advanced" | "elite"
  isCustom: boolean
  imageUrl?: string
  createdAt?: Date
}

export interface WorkoutLog {
  id?: number
  date: string
  name?: string
  duration?: number
  notes?: string
  totalVolume?: number
  totalSets?: number
  xpEarned?: number
  createdAt: Date
}

export interface WorkoutSet {
  id?: number
  workoutLogId: number
  exerciseId: number
  exerciseName: string
  setNumber: number
  reps?: number
  weightKg?: number
  weightLbs?: number
  duration?: number
  distance?: number
  isPersonalRecord?: boolean
  notes?: string
}

export interface PersonalRecord {
  id?: number
  exerciseId: number
  exerciseName: string
  weightKg?: number
  weightLbs?: number
  reps?: number
  duration?: number
  distance?: number
  achievedDate: string
  workoutLogId?: number
}

export interface SkillProgress {
  id?: number
  exerciseId: number
  exerciseName: string
  currentLevel: number
  maxLevel: number
  notes?: string
  achievedDate?: string
  createdAt: Date
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
  travelPins!: Table<TravelPin>
  fitnessProfile!: Table<FitnessProfile>
  bodyMetrics!: Table<BodyMetric>
  exercises!: Table<Exercise>
  workoutLogs!: Table<WorkoutLog>
  workoutSets!: Table<WorkoutSet>
  personalRecords!: Table<PersonalRecord>
  skillProgress!: Table<SkillProgress>


  constructor() {
    super("lvlup-db")
    this.version(10).stores({
      quests: "++id, category, frequency, isCompleted, createdAt",
      users: "++id, username",
      missions: "++id, missionType, category, isCompleted, createdAt",
      statRecords: "++id, category, updatedAt",
      journalEntries: "++id, mood, createdAt",
      streaks: "++id, lastActiveDate",
      missionSteps: "++id, missionId, isCompleted, createdAt",
      habits: "++id, category, timeOfDay, lastCompletedDate, createdAt",
      travelPins: "++id, country, visitedDate, createdAt",
      fitnessProfile: "++id",
      bodyMetrics: "++id, date, createdAt",
      exercises: "++id, category, difficulty, isCustom",
      workoutLogs: "++id, date, createdAt",
      workoutSets: "++id, workoutLogId, exerciseId",
      personalRecords: "++id, exerciseId, achievedDate",
      skillProgress: "++id, exerciseId",
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