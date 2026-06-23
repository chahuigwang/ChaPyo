import { colorForUser } from '@/composables/useUserColor'

// 비용 분담 계산.
// - 아이템 cost: payer(담당자)가 멤버면 그 멤버가 전액 부담, 미지정이면 균등(N분의 1) 풀.
//   매칭은 payerId 우선, 없으면 payerName(닉네임).
// - 이동비(transitAfter.cost): 담당 지정 불가 → 균등 풀에 포함.
//
// @param {Array} items   - TravelItem 목록(평탄화)
// @param {Array} members - [{ userId, nickname }]
// @returns {{ rows: Array<{userId, nickname, amount, color}>, total: number, shared: number, perShare: number }}
export function computeCostSplit(items = [], members = []) {
  const n = members.length
  // 멤버 식별 키(userId 우선, 없으면 nickname)
  const keyOf = (id, name) => (id != null ? `id:${id}` : (name != null ? `nm:${name}` : null))
  const memberKey = (m) => keyOf(m.userId, m.nickname)
  const memberKeys = new Set(members.map(memberKey))

  const assigned = {} // memberKey → 전담 합
  members.forEach((m) => { assigned[memberKey(m)] = 0 })
  let shared = 0
  let total = 0

  for (const it of items) {
    const cost = Number(it?.cost) || 0
    const transit = Number(it?.transitAfter?.cost) || 0
    total += cost + transit
    const payerKey = keyOf(it?.payerId, it?.payerName)
    if (payerKey && memberKeys.has(payerKey)) {
      assigned[payerKey] += cost
    } else {
      shared += cost
    }
    shared += transit
  }

  const perShare = n > 0 ? shared / n : 0
  const rows = members.map((m) => ({
    userId: m.userId,
    nickname: m.nickname,
    amount: Math.round((assigned[memberKey(m)] || 0) + perShare),
    color: colorForUser(m.userId ?? m.nickname),
  }))

  return { rows, total, shared, perShare }
}
