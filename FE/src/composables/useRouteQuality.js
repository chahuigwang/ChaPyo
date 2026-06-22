import { haversineKm } from '@/composables/useTimelineLogic'

// 동선 품질 판정 임계값 (튜닝 지점)
export const GOOD_MAX = 1.10 // 최적 대비 110% 이내 → 좋음(초록)
export const BAD_MIN = 1.40 // 최적 대비 140% 초과 → 나쁨(빨강)

// 좌표가 있는 항목만 추출 (경로/품질 계산 대상)
function withCoords(items) {
  return (items || []).filter((i) => i && i.lat != null && i.lng != null)
}

// 주어진 순서대로의 총 이동거리(km). 인접 구간 haversine 합.
export function routeDistance(items) {
  const pts = withCoords(items)
  let sum = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const d = haversineKm(pts[i], pts[i + 1])
    if (d != null) sum += d
  }
  return sum
}

// nearest-neighbor 근사 최적 총거리. 각 시작점에서 NN 경로를 만들고 최소값 선택.
export function optimalDistance(items) {
  const pts = withCoords(items)
  const n = pts.length
  if (n < 2) return 0
  let best = Infinity
  for (let start = 0; start < n; start++) {
    const visited = new Array(n).fill(false)
    visited[start] = true
    let cur = start
    let total = 0
    for (let step = 1; step < n; step++) {
      let nextIdx = -1
      let nextDist = Infinity
      for (let j = 0; j < n; j++) {
        if (visited[j]) continue
        const d = haversineKm(pts[cur], pts[j]) ?? Infinity
        if (d < nextDist) { nextDist = d; nextIdx = j }
      }
      if (nextIdx === -1) break
      visited[nextIdx] = true
      total += nextDist
      cur = nextIdx
    }
    if (total < best) best = total
  }
  return best === Infinity ? 0 : best
}

// 현재 순서의 품질. { current, optimal, ratio, status }
// status: 'good' | 'bad' | 'neutral'
export function routeQuality(items) {
  const pts = withCoords(items)
  if (pts.length < 2) {
    return { current: 0, optimal: 0, ratio: 1, status: 'neutral' }
  }
  const current = routeDistance(items)
  const optimal = optimalDistance(items)
  if (!optimal) {
    return { current, optimal: 0, ratio: 1, status: 'neutral' }
  }
  const ratio = current / optimal
  let status = 'neutral'
  if (ratio <= GOOD_MAX) status = 'good'
  else if (ratio >= BAD_MIN) status = 'bad'
  return { current, optimal, ratio, status }
}

// 가장 먼 구간(나쁨일 때 ⚠️ 위치 표시용)의 두 번째 점 인덱스를 반환.
// 좌표 있는 항목 기준 인덱스가 아니라, 원본 items 기준 인덱스.
export function worstLegMidpoint(items) {
  const list = items || []
  let worst = -1
  let worstD = -1
  let prev = null
  let prevIdx = -1
  for (let i = 0; i < list.length; i++) {
    const it = list[i]
    if (!it || it.lat == null || it.lng == null) continue
    if (prev) {
      const d = haversineKm(prev, it) ?? 0
      if (d > worstD) { worstD = d; worst = i; }
    }
    prev = it
    prevIdx = i
  }
  if (worst < 0) return null
  // worst 와 직전 좌표 항목의 중점
  let prevCoordIdx = worst - 1
  while (prevCoordIdx >= 0 && (list[prevCoordIdx]?.lat == null || list[prevCoordIdx]?.lng == null)) prevCoordIdx--
  if (prevCoordIdx < 0) return null
  const a = list[prevCoordIdx]
  const b = list[worst]
  return { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 }
}
