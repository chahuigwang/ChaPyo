import { http } from './httpClient'
import { ENDPOINTS } from './endpoints'
import { TripPlan } from '@/models/TripPlan'
import { TravelItem } from '@/models/TravelItem'

// Trip 도메인 서비스. Store 는 이 모듈만 호출한다.
export const tripService = {
  async list() {
    const { data } = await http.get(ENDPOINTS.trips.list)
    return (data ?? []).map((raw) => TripPlan.fromJSON(raw))
  },

  async detail(id) {
    const { data, sync } = await http.get(ENDPOINTS.trips.detail(id))
    const plan = TripPlan.fromJSON(data)
    plan.applySync(sync)
    return plan
  },

  async create(payload) {
    const body = TripPlan.fromJSON(payload).toJSON()
    const { data } = await http.post(ENDPOINTS.trips.create, body)
    return TripPlan.fromJSON(data)
  },

  async update(plan) {
    const body = plan.toJSON()
    const { data, sync } = await http.put(ENDPOINTS.trips.update(plan.id), body)
    const next = TripPlan.fromJSON(data)
    next.applySync(sync)
    return next
  },

  async remove(id) {
    await http.delete(ENDPOINTS.trips.remove(id))
    return id
  },

  // 협업: Smart Polling. 마지막 동기 시점 이후 변경분만 받는다.
  async pollSync(id, lastSyncTime) {
    const { data, sync } = await http.get(ENDPOINTS.trips.sync(id), { since: lastSyncTime })
    return { plan: data ? TripPlan.fromJSON(data) : null, sync }
  },

  async addItem(tripId, payload) {
    const { data } = await http.post(ENDPOINTS.trips.items(tripId), payload)
    return TravelItem.fromJSON(data)
  },

  async updateItem(tripId, itemId, patch) {
    const { data } = await http.patch(ENDPOINTS.trips.item(tripId, itemId), patch)
    return TravelItem.fromJSON(data)
  },

  async removeItem(tripId, itemId) {
    await http.delete(ENDPOINTS.trips.item(tripId, itemId))
    return itemId
  },
}
