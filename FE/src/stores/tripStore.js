import { defineStore } from 'pinia'
import { createPlaceItem, enumerateDays } from '@/domain/itinerary'

function todayISO(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

let _tripSeq = 0
const nextTripId = () => `t_${Date.now()}_${++_tripSeq}`

function newTrip({ title, startDate, endDate, itemsByDay = {} } = {}) {
  const s = startDate ?? todayISO(0)
  const e = endDate ?? todayISO(2)
  const first = enumerateDays(s, e)[0] ?? ''
  return {
    id: nextTripId(),
    title: title ?? '새 여행',
    startDate: s,
    endDate: e,
    itemsByDay,
    selectedDate: first,
  }
}

// 로그인 시 보여줄 Mock 여행 목록 (Phase 5)
function seedTrips() {
  const t1 = newTrip({
    title: '서울 맛집 투어',
    startDate: todayISO(7),
    endDate: todayISO(9),
  })
  t1.itemsByDay[t1.startDate] = [
    createPlaceItem({ name: '광장시장', category: 'food', time: '12:30', memo: '빈대떡, 마약김밥' }),
  ]
  const t2 = newTrip({
    title: '부산 주말 여행',
    startDate: todayISO(20),
    endDate: todayISO(21),
  })
  const t3 = newTrip({
    title: '제주 가족 일정',
    startDate: todayISO(45),
    endDate: todayISO(48),
  })
  return [t1, t2, t3]
}

export const useTripStore = defineStore('trip', {
  state: () => ({
    trips: [],         // Trip[]
    currentTripId: null,
    seeded: false,
  }),
  getters: {
    currentTrip(state) {
      return state.trips.find((t) => t.id === state.currentTripId) ?? null
    },
    title() { return this.currentTrip?.title ?? '' },
    startDate() { return this.currentTrip?.startDate ?? '' },
    endDate() { return this.currentTrip?.endDate ?? '' },
    selectedDate() { return this.currentTrip?.selectedDate ?? '' },
    days() {
      const t = this.currentTrip
      return t ? enumerateDays(t.startDate, t.endDate) : []
    },
    itemsOfSelectedDay() {
      const t = this.currentTrip
      if (!t) return []
      return t.itemsByDay[t.selectedDate] ?? []
    },
  },
  actions: {
    ensureSeed() {
      if (this.seeded) return
      this.trips = seedTrips()
      this.seeded = true
    },
    resetForLogout() {
      this.trips = []
      this.currentTripId = null
      this.seeded = false
    },
    createTrip(payload) {
      const t = newTrip(payload)
      this.trips.unshift(t)
      this.currentTripId = t.id
      return t
    },
    deleteTrip(id) {
      this.trips = this.trips.filter((t) => t.id !== id)
      if (this.currentTripId === id) this.currentTripId = null
    },
    selectTrip(id) {
      if (this.trips.some((t) => t.id === id)) this.currentTripId = id
    },
    exitTrip() { this.currentTripId = null },

    // --- 현재 trip 대상 액션 ---
    setTitle(t) { if (this.currentTrip) this.currentTrip.title = t },
    setRange(start, end) {
      const t = this.currentTrip
      if (!t) return
      t.startDate = start
      t.endDate = end
      if (!this.days.includes(t.selectedDate)) {
        t.selectedDate = this.days[0] ?? ''
      }
    },
    selectDate(date) {
      const t = this.currentTrip
      if (t && this.days.includes(date)) t.selectedDate = date
    },
    addItem(payload) {
      const t = this.currentTrip
      if (!t) return null
      const item = createPlaceItem(payload)
      if (!t.itemsByDay[t.selectedDate]) t.itemsByDay[t.selectedDate] = []
      t.itemsByDay[t.selectedDate].push(item)
      return item
    },
    updateItem(id, patch) {
      const t = this.currentTrip
      if (!t) return
      const list = t.itemsByDay[t.selectedDate]
      if (!list) return
      const idx = list.findIndex((i) => i.id === id)
      if (idx >= 0) list[idx] = { ...list[idx], ...patch }
    },
    removeItem(id) {
      const t = this.currentTrip
      if (!t) return
      const list = t.itemsByDay[t.selectedDate]
      if (!list) return
      t.itemsByDay[t.selectedDate] = list.filter((i) => i.id !== id)
    },
  },
})
