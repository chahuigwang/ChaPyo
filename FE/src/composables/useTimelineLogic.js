import { computed } from 'vue'

function timeToMinutes(t) {
  if (!t || typeof t !== 'string') return null
  const [h, m] = t.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

export function haversineKm(a, b) {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null
  const toRad = (d) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat))
  return 2 * R * Math.asin(Math.sqrt(x))
}

export const TIME_BLOCKS = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00']

export function snapTimeFor(index) {
  if (index == null) return null
  return TIME_BLOCKS[Math.max(0, Math.min(index, TIME_BLOCKS.length - 1))]
}

export function useTimelineLogic(items) {
  const transits = computed(() =>
    items.value.slice(0, -1).map((a, i) => {
      const b = items.value[i + 1]
      const realKm = haversineKm(a, b)
      if (realKm != null) {
        return { km: realKm.toFixed(1), mins: Math.max(3, Math.round((realKm / 30) * 60)) }
      }
      const seed = (a.id + b.id).split('').reduce((s, c) => s + c.charCodeAt(0), 0)
      return { km: (0.6 + (seed % 47) / 10).toFixed(1), mins: 8 + (seed % 18) }
    })
  )

  const dailyCost = computed(() =>
    items.value.reduce((s, i) => s + (Number(i.cost) || 0) + (Number(i.transitAfter?.cost) || 0), 0)
  )

  return { transits, dailyCost }
}
