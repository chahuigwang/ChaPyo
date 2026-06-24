import { http } from './httpClient'
import { ENDPOINTS } from './endpoints'
import { TripPlan } from '@/models/TripPlan'

// BaseResponse<T> 래퍼를 벗겨 data만 반환. (성공 응답은 { success, code, message, data })
function unwrap(res) {
  return res?.data?.data ?? null
}

export const tripService = {
  // GET /api/v1/trips → 여행 계획 목록
  async list() {
    const { data } = await http.get(ENDPOINTS.trips.list)
    const items = data?.data ?? []
    return items.map((raw) => TripPlan.fromJSON({
      ...raw,
      id: String(raw.planId ?? raw.id),
      isOwner: raw.owner ?? raw.isOwner ?? false,
      itemCount: raw.itemCount ?? null,
      memberCount: raw.memberCount ?? null,
      totalCost: raw.totalCost ?? null,
    }))
  },

  // POST /api/v1/trips → 새 여행 계획 생성 (서버가 기본 제목/날짜 부여)
  async create() {
    const { data } = await http.post(ENDPOINTS.trips.create, {})
    const raw = data?.data ?? data
    return TripPlan.fromJSON({
      ...raw,
      id: String(raw.planId ?? raw.id),
      isOwner: raw.owner ?? raw.isOwner ?? true,
    })
  },

  // GET /api/v1/trips/{planId} → 멤버 + 일정 포함 상세. raw 객체를 그대로 반환(매핑은 store에서).
  async detail(planId) {
    const res = await http.get(ENDPOINTS.trips.detail(planId))
    return unwrap(res)
  },

  // PATCH /api/v1/trips/{planId} → 제목/시작일/종료일 수정
  async update(planId, { title, startDate, endDate } = {}) {
    await http.patch(ENDPOINTS.trips.update(planId), { title, startDate, endDate })
  },

  // DELETE /api/v1/trips/{planId} → 여행 계획 삭제
  async remove(planId) {
    await http.delete(ENDPOINTS.trips.remove(planId))
  },

  // PUT /api/v1/trips/{planId}/items/{itemId} → 일정 수정 (일차/시간/비용/메모/담당자)
  async updateItem(planId, itemId, { dayNumber, visitTime, cost, memo, payerId } = {}) {
    await http.put(ENDPOINTS.trips.item(planId, itemId), {
      dayNumber: dayNumber ?? null,
      visitTime: visitTime || null,
      cost: cost ?? null,
      memo: memo || null,
      payerId: payerId !== undefined ? (payerId ?? null) : undefined,
    })
  },

  // DELETE /api/v1/trips/{planId}/items/{itemId} → 일정 삭제
  async removeItem(planId, itemId) {
    await http.delete(ENDPOINTS.trips.item(planId, itemId))
  },

  // PATCH /api/v1/trips/{planId}/items/orders → 일정 순서 일괄 변경
  // itemOrders: [{ itemId, order }]
  async updateItemOrders(planId, itemOrders) {
    await http.patch(ENDPOINTS.trips.itemOrders(planId), { itemOrders })
  },

  // PUT /api/v1/trips/{planId}/items/{itemId}/payer → 비용 담당자 지정
  // (BE 미구현 — 엔드포인트만 잡아둠. payer 가 null 이면 N분의 1)
  async setItemPayer(planId, itemId, { payerId, payerName } = {}) {
    await http.put(ENDPOINTS.trips.itemPayer(planId, itemId), {
      payerId: payerId ?? null,
      payerNickname: payerName ?? null,
    })
  },

  // POST /api/v1/trips/{planId}/items → 일정 추가 (itemOrder null이면 서버가 마지막에 부여)
  async addItem(planId, { placeId, dayNumber, visitTime, itemOrder, cost, memo } = {}) {
    await http.post(ENDPOINTS.trips.items(planId), {
      placeId,
      dayNumber,
      visitTime: visitTime || null,
      itemOrder: itemOrder ?? null,
      cost: cost ?? null,
      memo: memo || null,
    })
  },

  // POST /api/v1/trips/{planId}/routes → 아이템 간 이동 정보(소요시간/비용) 저장
  // fromItemId/toItemId 는 서버 itemId. 같은 구간을 다시 보내면 upsert.
  async saveRoute(planId, { fromItemId, toItemId, transport, moveTime, cost } = {}) {
    await http.post(ENDPOINTS.trips.routes(planId), {
      fromItemId,
      toItemId,
      transport: transport || null,
      moveTime: moveTime ?? null,
      cost: cost ?? null,
    })
  },

  // POST /api/v1/trips/{planId}/members → 이메일로 멤버 초대
  async inviteMember(planId, email) {
    const res = await http.post(ENDPOINTS.trips.members(planId), { email })
    return res?.data?.message ?? '멤버 초대 성공'
  },

  // DELETE /api/v1/trips/{planId}/members/{userId} → 멤버 내보내기 / 본인 나가기
  async removeMember(planId, targetUserId) {
    await http.delete(ENDPOINTS.trips.member(planId, targetUserId))
  },
}
