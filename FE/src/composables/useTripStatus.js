import { computed, unref } from 'vue'

function parseISO(s) {
  if (!s) return null
  const [y, m, d] = String(s).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function startOfToday() {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}

function diffDays(a, b) {
  return Math.round((a.getTime() - b.getTime()) / 86400000)
}

export function useTripStatus(startDate, endDate) {
  const info = computed(() => {
    const s = parseISO(unref(startDate))
    const e = parseISO(unref(endDate))
    if (!s || !e) {
      return { status: 'upcoming', daysUntilStart: 0, daysSinceEnd: 0, currentDay: 0, totalDays: 0 }
    }
    const today = startOfToday()
    const totalDays = diffDays(e, s) + 1
    if (today < s) {
      return {
        status: 'upcoming',
        daysUntilStart: diffDays(s, today),
        daysSinceEnd: 0,
        currentDay: 0,
        totalDays,
      }
    }
    if (today > e) {
      return {
        status: 'past',
        daysUntilStart: 0,
        daysSinceEnd: diffDays(today, e),
        currentDay: 0,
        totalDays,
      }
    }
    return {
      status: 'ongoing',
      daysUntilStart: 0,
      daysSinceEnd: 0,
      currentDay: diffDays(today, s) + 1,
      totalDays,
    }
  })

  return {
    status: computed(() => info.value.status),
    daysUntilStart: computed(() => info.value.daysUntilStart),
    daysSinceEnd: computed(() => info.value.daysSinceEnd),
    currentDay: computed(() => info.value.currentDay),
    totalDays: computed(() => info.value.totalDays),
  }
}
