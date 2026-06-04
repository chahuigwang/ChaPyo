import { defineStore } from 'pinia'
import { TripPlan, TravelItem, enumerateDays } from '@/models'
import { tripService } from '@/api/tripService'

function todayISO(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

function seedTrips() {
  const DAY = 86_400_000
  const now = Date.now()
  const t1 = new TripPlan({
    title: '서울 맛집 투어',
    startDate: todayISO(7),
    endDate: todayISO(9),
    updatedAt: now - DAY * 1,
    version: 1,
  })
  t1.itemsByDay[t1.startDate] = [
    new TravelItem({ name: '경복궁', category: 'place', time: '09:30', memo: '수문장 교대식 관람', cost: 3000, lat: 37.579617, lng: 126.977041 }),
    new TravelItem({ name: '북촌 한옥마을', category: 'place', time: '11:30', memo: '전통 한옥 골목 산책', cost: 0, lat: 37.582604, lng: 126.983998 }),
    new TravelItem({ name: '광장시장', category: 'food', time: '13:00', memo: '빈대떡, 마약김밥', cost: 25000, lat: 37.570028, lng: 126.999595 }),
    new TravelItem({ name: 'N서울타워', category: 'place', time: '17:30', memo: '서울 야경 명소', cost: 16000, lat: 37.551169, lng: 126.988227 }),
  ]
  const t2 = new TripPlan({ title: '부산 주말 여행', startDate: todayISO(20), endDate: todayISO(21), updatedAt: now - DAY * 5 })
  const t3 = new TripPlan({ title: '제주 가족 일정', startDate: todayISO(45), endDate: todayISO(48), updatedAt: now - DAY * 12 })
  return [t1, t2, t3]
}

export const useTripStore = defineStore('trip', {
  state: () => ({
    trips: [],
    currentTripId: null,
    seeded: false,
    syncing: false,
    lastError: null,
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

    async fetchTrips() {
      try {
        this.trips = await tripService.list()
        this.seeded = true
      } catch (err) {
        this.lastError = err?.message ?? 'fetchTrips failed'
      }
    },
    async syncCurrent() {
      const t = this.currentTrip
      if (!t || this.syncing) return
      this.syncing = true
      try {
        const { plan } = await tripService.pollSync(t.id, t.lastSyncTime)
        if (plan && !plan.isStaleAgainst(t.version)) {
          const idx = this.trips.findIndex((x) => x.id === t.id)
          if (idx >= 0) this.trips[idx] = plan
        }
      } catch (err) {
        this.lastError = err?.message ?? 'sync failed'
      } finally {
        this.syncing = false
      }
    },

    createTrip(payload = {}) {
      const t = new TripPlan({
        ...payload,
        startDate: payload.startDate ?? todayISO(0),
        endDate: payload.endDate ?? todayISO(2),
      })
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

    setTitle(t) {
      const trip = this.currentTrip
      if (!trip) return
      trip.title = t
      trip.touch()
    },
    setRange(start, end) {
      const trip = this.currentTrip
      if (!trip) return
      trip.startDate = start
      trip.endDate = end
      if (!this.days.includes(trip.selectedDate)) trip.selectedDate = this.days[0] ?? ''
      trip.touch()
    },
    selectDate(date) {
      const trip = this.currentTrip
      if (trip && this.days.includes(date)) trip.selectedDate = date
    },
    addItem(payload) {
      const trip = this.currentTrip
      if (!trip) return null
      const item = new TravelItem(payload)
      if (!trip.itemsByDay[trip.selectedDate]) trip.itemsByDay[trip.selectedDate] = []
      trip.itemsByDay[trip.selectedDate].push(item)
      trip.touch()
      return item
    },
    addItemToDate(date, payload) {
      const trip = this.currentTrip
      if (!trip || !date) return null
      if (!enumerateDays(trip.startDate, trip.endDate).includes(date)) return null
      const item = new TravelItem(payload)
      if (!trip.itemsByDay[date]) trip.itemsByDay[date] = []
      trip.itemsByDay[date].push(item)
      trip.touch()
      return item
    },
    updateItem(id, patch) {
      const trip = this.currentTrip
      if (!trip) return
      const list = trip.itemsByDay[trip.selectedDate]
      if (!list) return
      const idx = list.findIndex((i) => i.id === id)
      if (idx >= 0) {
        list[idx] = new TravelItem({ ...list[idx], ...patch })
        trip.touch()
      }
    },
    patchItemCoords(id, lat, lng) {
      const trip = this.currentTrip
      if (!trip) return
      for (const list of Object.values(trip.itemsByDay)) {
        const item = list.find((i) => i.id === id)
        if (item) { item.lat = lat; item.lng = lng; return }
      }
    },
    removeItem(id) {
      const trip = this.currentTrip
      if (!trip) return
      const list = trip.itemsByDay[trip.selectedDate]
      if (!list) return
      trip.itemsByDay[trip.selectedDate] = list.filter((i) => i.id !== id)
      trip.touch()
    },
    updateTransit(id, patch) {
      const trip = this.currentTrip
      if (!trip) return
      for (const list of Object.values(trip.itemsByDay)) {
        const item = list.find((i) => i.id === id)
        if (item) { item.transitAfter = { ...item.transitAfter, ...patch }; trip.touch(); return }
      }
    },
    removeItemFromDate(date, id) {
      const trip = this.currentTrip
      if (!trip || !date) return null
      const list = trip.itemsByDay[date]
      if (!list) return null
      const removed = list.find((i) => i.id === id) ?? null
      trip.itemsByDay[date] = list.filter((i) => i.id !== id)
      trip.touch()
      return removed
    },
    reorderInDate(date, fromIdx, toIdx) {
      const trip = this.currentTrip
      if (!trip || !date) return
      const list = trip.itemsByDay[date]
      if (!list || fromIdx < 0 || fromIdx >= list.length || toIdx < 0 || toIdx > list.length) return
      const [moved] = list.splice(fromIdx, 1)
      list.splice(toIdx > fromIdx ? toIdx - 1 : toIdx, 0, moved)
      trip.touch()
    },
  },
})
