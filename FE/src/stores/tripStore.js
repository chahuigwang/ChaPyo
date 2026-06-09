import { defineStore } from 'pinia'
import { TripPlan, TravelItem, enumerateDays } from '@/models'
import { tripService } from '@/api/tripService'
import { useToastStore } from '@/stores/toastStore'

function todayISO(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

// 서버 trip id는 숫자(planId). 로컬 전용(시드 't_...') 과 구분해 API 호출 여부를 결정한다.
function isServerId(id) {
  return /^\d+$/.test(String(id ?? ''))
}

// 일정 추가 payload에서 BE place 참조 ID 추출. (검색결과 id=placeId, 보관함 sourceId=placeId)
function resolvePlaceId(payload) {
  const raw = payload?.placeId ?? payload?.sourceId ?? payload?.id
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

// LocalTime("10:00:00" | "10:00") → "HH:mm"
function normalizeTime(t) {
  if (!t) return ''
  return String(t).slice(0, 5)
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
    // placeId → { name, category, address, firstImage, lat, lng }
    // BE 일정 응답엔 좌표/카테고리/이미지가 없어, 추가 시점에 본 정보를 캐시해 상세 재조회 때 보강한다.
    placeCache: {},
  }),
  getters: {
    currentTrip(state) {
      return state.trips.find((t) => t.id === state.currentTripId) ?? null
    },
    title() { return this.currentTrip?.title ?? '' },
    members() { return this.currentTrip?.members ?? [] },
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
      if (import.meta.env.DEV) this.trips = seedTrips()
      this.seeded = true
    },
    resetForLogout() {
      this.trips = []
      this.currentTripId = null
      this.seeded = false
      this.placeCache = {}
    },

    async fetchTrips() {
      try {
        this.trips = await tripService.list()
        this.seeded = true
      } catch (err) {
        this.lastError = err?.message ?? 'fetchTrips failed'
        useToastStore().error('여행 목록을 불러오지 못했습니다.')
      }
    },

    // 서버 상세(raw) → TripPlan 매핑. itemsByDay는 placeCache로 보강.
    _planFromDetail(raw, prev = null) {
      const itemsByDay = {}
      const items = [...(raw.items ?? [])].sort(
        (a, b) => (a.itemOrder ?? 0) - (b.itemOrder ?? 0),
      )
      for (const it of items) {
        const date = String(it.visitDate)
        const enrich = this.placeCache[it.placeId] ?? {}
        if (!itemsByDay[date]) itemsByDay[date] = []
        itemsByDay[date].push(new TravelItem({
          id: `srv_${it.itemId}`,
          serverId: it.itemId,
          placeId: it.placeId,
          name: it.title ?? enrich.name ?? '',
          category: enrich.category ?? 'place',
          time: normalizeTime(it.visitTime),
          cost: it.cost ?? 0,
          memo: it.memo ?? '',
          address: enrich.address ?? '',
          firstImage: enrich.firstImage ?? null,
          lat: enrich.lat ?? null,
          lng: enrich.lng ?? null,
        }))
      }
      return new TripPlan({
        id: String(raw.planId),
        title: raw.title,
        startDate: String(raw.startDate),
        endDate: String(raw.endDate),
        itemsByDay,
        members: raw.members ?? [],
        selectedDate: prev?.selectedDate, // 보던 선택 날짜 유지
        updatedAt: Date.now(),
      })
    },

    // GET /api/v1/trips/{id} → 멤버 + 일정을 서버에서 로드(진입/폴링 공용)
    async fetchDetail(id) {
      if (!id) return null
      try {
        const raw = await tripService.detail(id)
        if (!raw) return null
        const idx = this.trips.findIndex((x) => x.id === String(id))
        const plan = this._planFromDetail(raw, idx >= 0 ? this.trips[idx] : null)
        if (idx >= 0) this.trips[idx] = plan
        else this.trips.unshift(plan)
        this.currentTripId = plan.id
        this.seeded = true
        return plan
      } catch (err) {
        this.lastError = err?.message ?? 'fetchDetail failed'
        return null
      }
    },

    // 현재 여행을 서버 상태로 재동기화 (15초 폴링)
    async syncCurrent() {
      if (!this.currentTripId || this.syncing) return
      if (!isServerId(this.currentTripId)) return
      this.syncing = true
      try {
        await this.fetchDetail(this.currentTripId)
      } finally {
        this.syncing = false
      }
    },

    async createTrip() {
      try {
        const t = await tripService.create()
        this.trips.unshift(t)
        this.currentTripId = t.id
        return t
      } catch (err) {
        this.lastError = err?.message ?? 'createTrip failed'
        useToastStore().error('여행 생성에 실패했습니다.')
        return null
      }
    },

    // POST /api/v1/trips/{id}/members → 이메일 초대 후 멤버 재조회
    async inviteMember(email) {
      const id = this.currentTripId
      if (!id || !isServerId(id)) {
        return { ok: false, message: '저장된 여행에서만 초대할 수 있습니다.' }
      }
      try {
        const message = await tripService.inviteMember(id, email)
        await this.fetchDetail(id)
        return { ok: true, message }
      } catch (err) {
        return { ok: false, message: err?.message ?? '초대에 실패했습니다.' }
      }
    },

    // PATCH /api/v1/trips/{id} → 제목/날짜 서버 반영
    async _persistPlan() {
      const t = this.currentTrip
      if (!t || !isServerId(t.id)) return
      try {
        await tripService.update(t.id, {
          title: t.title,
          startDate: t.startDate,
          endDate: t.endDate,
        })
      } catch (err) {
        this.lastError = err?.message ?? 'updatePlan failed'
        useToastStore().error('변경 사항 저장에 실패했습니다.')
      }
    },
    // 낙관적 로컬 삭제 후 DELETE /trips/{id}
    async deleteTrip(id) {
      const existed = this.trips.some((t) => t.id === id)
      this.trips = this.trips.filter((t) => t.id !== id)
      if (this.currentTripId === id) this.currentTripId = null
      if (existed && isServerId(id)) {
        try {
          await tripService.remove(id)
        } catch (err) {
          this.lastError = err?.message ?? 'deleteTrip failed'
          useToastStore().error('여행 삭제에 실패했습니다.')
        }
      }
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
      this._persistPlan()
    },
    setRange(start, end) {
      const trip = this.currentTrip
      if (!trip) return
      trip.startDate = start
      trip.endDate = end
      if (!this.days.includes(trip.selectedDate)) trip.selectedDate = this.days[0] ?? ''
      trip.touch()
      this._persistPlan()
    },
    selectDate(date) {
      const trip = this.currentTrip
      if (trip && this.days.includes(date)) trip.selectedDate = date
    },
    // placeId가 있으면 placeCache에 보강 정보를 저장(상세 재조회 시 좌표/카테고리 복원용)
    _cachePlace(placeId, payload) {
      if (!placeId) return
      this.placeCache[placeId] = {
        name: payload.name ?? this.placeCache[placeId]?.name ?? '',
        category: payload.category ?? this.placeCache[placeId]?.category ?? 'place',
        address: payload.address ?? this.placeCache[placeId]?.address ?? '',
        firstImage: payload.firstImage ?? this.placeCache[placeId]?.firstImage ?? null,
        lat: payload.lat ?? this.placeCache[placeId]?.lat ?? null,
        lng: payload.lng ?? this.placeCache[placeId]?.lng ?? null,
      }
    },
    addItem(payload) {
      return this.addItemToDate(this.selectedDate, payload)
    },
    // 낙관적 로컬 추가 후, placeId가 있고 서버 여행이면 POST /items → 상세 재조회로 동기화
    addItemToDate(date, payload) {
      const trip = this.currentTrip
      if (!trip || !date) return null
      if (!enumerateDays(trip.startDate, trip.endDate).includes(date)) return null

      const placeId = resolvePlaceId(payload)
      this._cachePlace(placeId, payload)

      const item = new TravelItem({ ...payload, placeId })
      if (!trip.itemsByDay[date]) trip.itemsByDay[date] = []
      trip.itemsByDay[date].push(item)
      trip.touch()

      if (placeId && isServerId(trip.id)) {
        tripService.addItem(trip.id, {
          placeId,
          visitDate: date,
          visitTime: item.time,
          cost: item.cost,
          memo: item.memo,
        })
          .then(() => this.fetchDetail(trip.id))
          .catch((err) => {
            this.lastError = err?.message ?? 'addItem failed'
            useToastStore().error('일정 추가에 실패했습니다.')
          })
      }
      return item
    },
    // 기존 서버 일정을 다른 날짜로 이동: 추가+삭제 대신 PATCH(visitDate)로 단일 처리
    moveItemToDate(fromDate, toDate, id, patch = {}) {
      const trip = this.currentTrip
      if (!trip || !fromDate || !toDate) return null
      if (!enumerateDays(trip.startDate, trip.endDate).includes(toDate)) return null
      const fromList = trip.itemsByDay[fromDate]
      if (!fromList) return null
      const idx = fromList.findIndex((i) => i.id === id)
      if (idx < 0) return null
      const moved = fromList[idx]
      if (patch.time != null) moved.time = patch.time
      fromList.splice(idx, 1)
      if (!trip.itemsByDay[toDate]) trip.itemsByDay[toDate] = []
      trip.itemsByDay[toDate].push(moved)
      trip.touch()
      if (moved.serverId && isServerId(trip.id)) {
        tripService.updateItem(trip.id, moved.serverId, {
          visitDate: toDate,
          visitTime: moved.time,
          cost: moved.cost,
          memo: moved.memo,
        }).catch((err) => {
          this.lastError = err?.message ?? 'moveItem failed'
          useToastStore().error('일정 이동에 실패했습니다.')
        })
      }
      return moved
    },
    // 낙관적 로컬 수정 후 PATCH /items/{itemId} (날짜/시간/비용/메모)
    updateItem(id, patch) {
      const trip = this.currentTrip
      if (!trip) return
      const date = trip.selectedDate
      const list = trip.itemsByDay[date]
      if (!list) return
      const idx = list.findIndex((i) => i.id === id)
      if (idx < 0) return
      const merged = new TravelItem({ ...list[idx], ...patch })
      list[idx] = merged
      trip.touch()
      if (merged.serverId && isServerId(trip.id)) {
        tripService.updateItem(trip.id, merged.serverId, {
          visitDate: date,
          visitTime: merged.time,
          cost: merged.cost,
          memo: merged.memo,
        }).catch((err) => {
          this.lastError = err?.message ?? 'updateItem failed'
          useToastStore().error('일정 수정에 실패했습니다.')
        })
      }
    },
    // 서버 일정 삭제 헬퍼 (serverId 있는 항목만)
    _deleteItemOnServer(planId, item) {
      if (!item?.serverId || !isServerId(planId)) return
      tripService.removeItem(planId, item.serverId).catch((err) => {
        this.lastError = err?.message ?? 'removeItem failed'
        useToastStore().error('일정 삭제에 실패했습니다.')
      })
    },
    // 해당 날짜의 현재 순서를 서버에 일괄 반영
    _persistItemOrders(planId, list) {
      if (!isServerId(planId)) return
      const itemOrders = list
        .map((it, i) => ({ itemId: it.serverId, order: i + 1 }))
        .filter((o) => o.itemId != null)
      if (!itemOrders.length) return
      tripService.updateItemOrders(planId, itemOrders).catch((err) => {
        this.lastError = err?.message ?? 'reorder failed'
        useToastStore().error('순서 변경에 실패했습니다.')
      })
    },
    patchItemCoords(id, lat, lng) {
      const trip = this.currentTrip
      if (!trip) return
      for (const list of Object.values(trip.itemsByDay)) {
        const item = list.find((i) => i.id === id)
        if (item) {
          item.lat = lat
          item.lng = lng
          // 지오코딩으로 얻은 좌표를 캐시에 보존 → 폴링 재조회 시 좌표 유실(깜빡임) 방지
          if (item.placeId) {
            this.placeCache[item.placeId] = { ...this.placeCache[item.placeId], lat, lng }
          }
          return
        }
      }
    },
    removeItem(id) {
      const trip = this.currentTrip
      if (!trip) return
      const list = trip.itemsByDay[trip.selectedDate]
      if (!list) return
      const removed = list.find((i) => i.id === id) ?? null
      trip.itemsByDay[trip.selectedDate] = list.filter((i) => i.id !== id)
      trip.touch()
      this._deleteItemOnServer(trip.id, removed)
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
      this._deleteItemOnServer(trip.id, removed)
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
      this._persistItemOrders(trip.id, list)
    },
  },
})
