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
    return items.map((raw) => TripPlan.fromJSON({ ...raw, id: String(raw.planId ?? raw.id) }))
  },

  // POST /api/v1/trips → 새 여행 계획 생성 (서버가 기본 제목/날짜 부여)
  async create() {
    const { data } = await http.post(ENDPOINTS.trips.create, {})
    const raw = data?.data ?? data
    return TripPlan.fromJSON({ ...raw, id: String(raw.planId ?? raw.id) })
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

  // PATCH /api/v1/trips/{planId}/items/{itemId} → 일정 수정 (날짜/시간/비용/메모)
  async updateItem(planId, itemId, { visitDate, visitTime, cost, memo } = {}) {
    await http.patch(ENDPOINTS.trips.item(planId, itemId), {
      visitDate: visitDate || null,
      visitTime: visitTime || null,
      cost: cost ?? null,
      memo: memo || null,
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

  // POST /api/v1/trips/{planId}/items → 일정 추가 (응답 본문 없음, itemOrder는 서버가 부여)
  async addItem(planId, { placeId, visitDate, visitTime, cost, memo } = {}) {
    await http.post(ENDPOINTS.trips.items(planId), {
      placeId,
      visitDate,
      visitTime: visitTime || null,
      cost: cost ?? null,
      memo: memo || null,
    })
  },

  // POST /api/v1/trips/{planId}/members → 이메일로 멤버 초대
  async inviteMember(planId, email) {
    const res = await http.post(ENDPOINTS.trips.members(planId), { email })
    return res?.data?.message ?? '멤버 초대 성공'
  },
}
