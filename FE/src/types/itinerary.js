// 일정 도메인 정의.
export const CATEGORIES = [
  { id: 'place', label: '관광', emoji: '📍' },
  { id: 'food', label: '식당', emoji: '🍽️' },
  { id: 'lodging', label: '숙소', emoji: '🏨' },
  { id: 'transport', label: '이동', emoji: '🚆' },
]

export function findCategory(id) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]
}

// Itinerary 아이템 팩토리. role: 카드 단위 데이터
export function createPlaceItem({ name, category = 'place', time = '', memo = '', cost = 0, lat = null, lng = null }) {
  return {
    id: `i_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    category,
    time,
    memo,
    cost: Number(cost) || 0,
    lat,
    lng,
  }
}

// startDate~endDate 사이의 날짜 배열을 'YYYY-MM-DD' 문자열로 반환
export function enumerateDays(startDate, endDate) {
  if (!startDate || !endDate) return []
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return []
  const out = []
  const cur = new Date(start)
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

export function formatDayLabel(dateStr, index) {
  if (!dateStr) return `Day ${index + 1}`
  const d = new Date(dateStr)
  const md = `${d.getMonth() + 1}/${d.getDate()}`
  const wd = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  return `Day ${index + 1} · ${md}(${wd})`
}
