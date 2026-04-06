export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (minutes < 2) return "just now"
  if (minutes < 60) return `${minutes} minutes ago`
  if (hours < 2) return "1 hour ago"
  if (hours < 24) return `${hours} hours ago`
  if (days < 2) return "1 day ago"
  if (days < 7) return `${days} days ago`
  if (weeks < 2) return "1 week ago"
  if (weeks < 4) return `${weeks} weeks ago`
  if (months < 2) return "1 month ago"
  if (months < 12) return `${months} months ago`
  if (years < 2) return "1 year ago"
  return `${years} years ago`
}

export function isStale(dateStr: string, staleDays = 7): boolean {
  return Date.now() - new Date(dateStr).getTime() > staleDays * 86_400_000
}
