export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false
  if (Notification.permission === "granted") return true
  if (Notification.permission === "denied") return false

  const permission = await Notification.requestPermission()
  return permission === "granted"
}

export function scheduleLocalNotification(title: string, body: string, delayMs: number) {
  if (Notification.permission !== "granted") return

  setTimeout(() => {
    new Notification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    })
  }, delayMs)
}

export function scheduleDailyReminder() {
  if (Notification.permission !== "granted") return

  const now = new Date()
  const reminder = new Date()
  reminder.setHours(20, 0, 0, 0) // 8pm daily reminder

  if (reminder <= now) {
    reminder.setDate(reminder.getDate() + 1)
  }

  const delay = reminder.getTime() - now.getTime()
  scheduleLocalNotification(
    "LVL UP 🔥",
    "Don't break your streak — log your quests for today!",
    delay
  )
}