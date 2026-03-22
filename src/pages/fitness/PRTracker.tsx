import { useState, useEffect } from "react"
import { db, type PersonalRecord, type FitnessProfile } from "../../db"

export default function PRTracker({ profile }: { profile: FitnessProfile }) {
  const [prs, setPRs] = useState<PersonalRecord[]>([])

  useEffect(() => {
    db.personalRecords.orderBy("achievedDate").reverse().toArray().then(setPRs)
  }, [])

  const weightUnit = profile.units === "imperial" ? "lbs" : "kg"

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-px bg-gold"></div>
          <span className="font-mono text-[10px] text-muted tracking-widests uppercase">Personal Records</span>
        </div>
        <div className="font-mono text-[10px] text-muted mt-1">
          PRs are automatically tracked when you log a new best during a workout
        </div>
      </div>

      {prs.length === 0 ? (
        <div className="text-center py-10 opacity-30">
          <div className="text-4xl mb-2">🏆</div>
          <div className="font-mono text-xs text-muted">No PRs yet. Log a workout to start tracking.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {prs.map(pr => (
            <div key={pr.id} className="bg-surface border border-gold/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">🏆</span>
                <div className="flex-1">
                  <div className="font-rajdhani font-bold text-base text-gold">{pr.exerciseName}</div>
                  <div className="font-mono text-[10px] text-muted mt-0.5">
                    {profile.units === "imperial" ? pr.weightLbs : pr.weightKg} {weightUnit}
                    {pr.reps && ` × ${pr.reps} reps`}
                    {pr.duration && ` · ${pr.duration}s`}
                  </div>
                </div>
                <div className="font-mono text-[9px] text-muted">{pr.achievedDate}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}