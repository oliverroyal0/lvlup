import { useState, useEffect } from "react"
import { db, type FitnessProfile } from "../db"
import FitnessOnboarding from "./fitness/FitnessOnboarding"
import FitnessDashboard from "./fitness/FitnessDashboard"

export default function FitnessPage({ onUserUpdate }: {
  onUserUpdate: () => void
}) {
  const [profile, setProfile] = useState<FitnessProfile | null | undefined>(undefined)

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const p = await db.fitnessProfile.toCollection().first()
    setProfile(p ?? null)
  }

  if (profile === undefined) {
    return (
      <div className="flex items-center justify-center h-48 opacity-30">
        <div className="font-mono text-[10px] text-muted animate-pulse tracking-widest">LOADING...</div>
      </div>
    )
  }

  if (profile === null) {
    return (
      <FitnessOnboarding
        onComplete={() => loadProfile()}
      />
    )
  }

  return (
    <FitnessDashboard
      profile={profile}
      onUserUpdate={onUserUpdate}
      onProfileUpdate={loadProfile}
    />
  )
}