import { defineStore } from 'pinia'
import { TripPlan, TravelItem, enumerateDays } from '@/models'
import { tripService } from '@/api/tripService'
import { placeService } from '@/api/placeService'
import { useToastStore } from '@/stores/toastStore'
import { useUiStore } from '@/stores/uiStore'

// placeId 별 상세(이미지/주소/좌표) 보강을 1회만 시도하기 위한 가드
const _placeMetaFetched = new Set()

function todayISO(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

// 서버 trip id는 숫자(planId). 로컬 전용(시드 't_...') 과 구분해 API 호출 여부를 결정한다.
function isServerId(id) {
  return /^\d+$/.test(String(id ?? ''))
}

// 폴링 재동기화 시 "실제로 바뀐 게 있는지" 판별용 시그니처.
// 동일하면 plan 객체 교체를 건너뛰어 지도/리스트의 불필요한 전체 재렌더(깜빡임)를 막는다.
function planSignature(plan) {
  if (!plan) return ''
  const parts = []
  parts.push(plan.title ?? '', plan.startDate ?? '', plan.endDate ?? '')
  parts.push((plan.members ?? []).map((m) => m.userId ?? m.nickname).join(','))
  for (const date of Object.keys(plan.itemsByDay ?? {}).sort()) {
    parts.push('|' + date)
    for (const it of plan.itemsByDay[date]) {
      const t = it.transitAfter ?? {}
      parts.push(
        `${it.id}:${it.time ?? ''}:${it.cost ?? ''}:${it.memo ?? ''}:${it.payerId ?? ''}:${it.payerName ?? ''}:${it.lat ?? ''}:${it.lng ?? ''}:${it.firstImage ? 1 : 0}:${it.name ?? ''}:${t.mins ?? ''}:${t.cost ?? ''}:${t.method ?? ''}`,
      )
    }
  }
  return parts.join('§')
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

// 서버는 날짜가 아닌 "일차(dayNumber)"로 일정을 관리한다. (1=첫째 날, 2=둘째 날 …)
// 내부 itemsByDay는 ISO 날짜 키를 쓰므로 API 경계에서 양방향 변환한다.
function dayNumberToDate(startDate, endDate, dayNumber) {
  const days = enumerateDays(startDate, endDate)
  return days[(Number(dayNumber) || 1) - 1] ?? null
}
function dateToDayNumber(startDate, endDate, date) {
  const idx = enumerateDays(startDate, endDate).indexOf(String(date))
  return idx >= 0 ? idx + 1 : null
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
    // serverId(itemId) → { payerId, payerName }. BE 미구현 동안 폴링 재조회가 담당자 지정을 덮어쓰지 않도록 보존.
    itemPayerOverrides: {},
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
      // 여행 기간 내 날짜만 표시(기간 밖 아이템은 숨김)
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
      // 서버는 dayNumber(일차)로 내려준다 → 시작일 기준 ISO 날짜로 변환. 기간 밖(변환 불가)은 숨김.
      const start = String(raw.startDate)
      const end = String(raw.endDate)
      const items = [...(raw.items ?? [])].sort(
        (a, b) => (a.itemOrder ?? 0) - (b.itemOrder ?? 0),
      )
      // 이동 정보(routes): fromItemId 기준으로 매핑 → 출발 아이템의 transitAfter 로 연결
      const routesByFrom = {}
      for (const r of (raw.routes ?? [])) {
        if (r?.fromItemId != null) routesByFrom[r.fromItemId] = r
      }
      for (const it of items) {
        const date = dayNumberToDate(start, end, it.dayNumber)
        if (!date) continue
        const enrich = this.placeCache[it.placeId] ?? {}
        // 서버가 내려주는 좌표 우선, 없으면 캐시 보강값
        const lat = it.latitude ?? enrich.lat ?? null
        const lng = it.longitude ?? enrich.lng ?? null
        if (lat != null && lng != null) this._cachePlace(it.placeId, { ...enrich, lat, lng })
        if (!itemsByDay[date]) itemsByDay[date] = []
        const route = routesByFrom[it.itemId]
        const built = new TravelItem({
          id: `srv_${it.itemId}`,
          serverId: it.itemId,
          // 출발 아이템에 이동 정보(소요시간/비용) 연결. 없으면 기본값.
          transitAfter: route
            ? { routeId: route.routeId ?? null, toItemId: route.toItemId ?? null, cost: route.cost ?? 0, mins: route.moveTime ?? null, method: route.transport ?? '' }
            : { cost: 0, mins: null, method: '' },
          placeId: it.placeId,
          name: it.title ?? enrich.name ?? '',
          category: enrich.category ?? 'place',
          time: normalizeTime(it.visitTime),
          cost: it.cost ?? 0,
          memo: it.memo ?? '',
          address: it.addr1 ?? enrich.address ?? '',
          firstImage: it.img ?? enrich.firstImage ?? null,
          lat,
          lng,
          // 추가한 사람(adder)
          nickname: it.adderNickname ?? it.nickname ?? '',
          addedByUserId: it.adderId ?? it.userId ?? null,
          // 비용 담당자(payer): BE 값 우선, 없으면 로컬 오버라이드(BE 미구현 동안 유지)
          payerId: it.payerId ?? this.itemPayerOverrides[it.itemId]?.payerId ?? null,
          payerName: it.payerNickname ?? this.itemPayerOverrides[it.itemId]?.payerName ?? null,
        })
        itemsByDay[date].push(built)
        this._hydratePlaceMeta(built) // 이미지/주소/좌표 보강(placeId별 1회)
      }
      // 모든 날짜에 빈 배열 보장 (드래그 라이브 바인딩 :list 가 항상 동일 참조를 갖도록)
      for (const d of enumerateDays(start, end)) {
        if (!itemsByDay[d]) itemsByDay[d] = []
      }
      return new TripPlan({
        id: String(raw.planId),
        title: raw.title,
        startDate: String(raw.startDate),
        endDate: String(raw.endDate),
        itemsByDay,
        members: raw.members ?? [],
        isOwner: raw.owner ?? raw.isOwner ?? false,
        selectedDate: prev?.selectedDate, // 보던 선택 날짜 유지
        updatedAt: Date.now(),
      })
    },

    // 일정 응답엔 이미지가 없어, placeId로 상세를 1회 받아 이미지/주소/좌표를 보강·캐시
    _hydratePlaceMeta(item) {
      const pid = item?.placeId
      if (!pid || item.firstImage || _placeMetaFetched.has(pid)) return
      _placeMetaFetched.add(pid)
      placeService.detail(pid).then((d) => {
        if (!d) { _placeMetaFetched.delete(pid); return }
        const enrich = { ...this.placeCache[pid] }
        if (d.firstImage1) enrich.firstImage = d.firstImage1
        if (d.addr1) enrich.address = enrich.address || d.addr1
        if (d.latitude != null) enrich.lat = enrich.lat ?? Number(d.latitude)
        if (d.longitude != null) enrich.lng = enrich.lng ?? Number(d.longitude)
        this.placeCache[pid] = enrich
        // 현재 화면의 항목에도 즉시 반영
        if (d.firstImage1 && !item.firstImage) item.firstImage = d.firstImage1
        if (d.addr1 && !item.address) item.address = d.addr1
      }).catch(() => { _placeMetaFetched.delete(pid) })
    },

    // GET /api/v1/trips/{id} → 멤버 + 일정을 서버에서 로드(진입/폴링 공용)
    async fetchDetail(id) {
      if (!id) return null
      try {
        const raw = await tripService.detail(id)
        if (!raw) return null
        const idx = this.trips.findIndex((x) => x.id === String(id))
        const prev = idx >= 0 ? this.trips[idx] : null
        const plan = this._planFromDetail(raw, prev)
        // 폴링 결과가 기존과 구조적으로 동일하면 교체하지 않는다.
        // (새 객체로 갈아끼우면 deep-watch 가 지도/리스트를 통째로 다시 그려 깜빡인다)
        if (prev && planSignature(prev) === planSignature(plan)) {
          this.currentTripId = prev.id
          this.seeded = true
          return prev
        }
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

    // 현재 여행을 서버 상태로 재동기화 (폴링)
    async syncCurrent() {
      if (!this.currentTripId || this.syncing) return
      if (!isServerId(this.currentTripId)) return
      // 드래그 중에는 폴링이 로컬 순서를 덮어쓰지 않도록 건너뛴다
      if (useUiStore().draggingDayIso) return
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

    // DELETE /members/{userId} → 방장이 멤버 내보내기 (후 멤버 재조회)
    async kickMember(targetUserId) {
      const id = this.currentTripId
      if (!id || !isServerId(id) || targetUserId == null) return { ok: false }
      try {
        await tripService.removeMember(id, targetUserId)
        await this.fetchDetail(id)
        return { ok: true }
      } catch (err) {
        useToastStore().error('내보내기에 실패했습니다.')
        return { ok: false }
      }
    },

    // DELETE /members/{myUserId} → 본인이 여행에서 나가기 (목록에서 제거)
    async leaveTrip(myUserId) {
      const id = this.currentTripId
      if (!id || !isServerId(id) || myUserId == null) return { ok: false }
      try {
        await tripService.removeMember(id, myUserId)
        this.trips = this.trips.filter((t) => t.id !== id)
        this.currentTripId = null
        return { ok: true }
      } catch (err) {
        useToastStore().error('여행 나가기에 실패했습니다.')
        return { ok: false }
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
    // 새 기간으로 줄였을 때 범위를 벗어나 삭제될 일정 개수 (확인 알림용)
    itemsOutsideRange(start, end) {
      const trip = this.currentTrip
      if (!trip) return 0
      const keep = new Set(enumerateDays(start, end))
      let count = 0
      for (const [date, list] of Object.entries(trip.itemsByDay)) {
        if (!keep.has(date)) count += (list?.length ?? 0)
      }
      return count
    },
    setRange(start, end) {
      const trip = this.currentTrip
      if (!trip) return
      trip.startDate = start
      trip.endDate = end
      // 기간이 줄면 범위를 벗어난 일정은 서버에서 자동 삭제되므로 로컬에서도 즉시 제거
      const keep = new Set(enumerateDays(start, end))
      for (const date of Object.keys(trip.itemsByDay)) {
        if (!keep.has(date)) delete trip.itemsByDay[date]
      }
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
      if (!this.days.includes(date)) return null

      const placeId = resolvePlaceId(payload)
      this._cachePlace(placeId, payload)

      const item = new TravelItem({ ...payload, placeId })
      if (!trip.itemsByDay[date]) trip.itemsByDay[date] = []
      trip.itemsByDay[date].push(item)
      trip.touch()

      if (placeId && isServerId(trip.id)) {
        tripService.addItem(trip.id, {
          placeId,
          dayNumber: dateToDayNumber(trip.startDate, trip.endDate, date),
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
    // 기존 서버 일정을 다른 날짜로 이동: 추가+삭제 대신 PUT(dayNumber)로 단일 처리
    moveItemToDate(fromDate, toDate, id, patch = {}) {
      const trip = this.currentTrip
      if (!trip || !fromDate || !toDate) return null
      if (!this.days.includes(toDate)) return null
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
          dayNumber: dateToDayNumber(trip.startDate, trip.endDate, toDate),
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
    // 낙관적 로컬 수정 후 PUT /items/{itemId} (날짜/시간/비용/메모)
    // 선택 날짜에 의존하지 않고 모든 날짜에서 항목을 찾아, 항목의 실제 날짜를 dayNumber로 변환해 전송
    updateItem(id, patch) {
      const trip = this.currentTrip
      if (!trip) return
      let foundDate = null
      let list = null
      let idx = -1
      for (const [d, l] of Object.entries(trip.itemsByDay)) {
        const i = l.findIndex((x) => x.id === id)
        if (i >= 0) { foundDate = d; list = l; idx = i; break }
      }
      if (idx < 0) return
      const merged = new TravelItem({ ...list[idx], ...patch })
      list[idx] = merged
      trip.touch()
      if (merged.serverId && isServerId(trip.id)) {
        tripService.updateItem(trip.id, merged.serverId, {
          dayNumber: dateToDayNumber(trip.startDate, trip.endDate, foundDate),
          visitTime: merged.time,
          cost: merged.cost,
          memo: merged.memo,
        }).catch((err) => {
          this.lastError = err?.message ?? 'updateItem failed'
          useToastStore().error('일정 수정에 실패했습니다.')
        })
      }
    },
    // 비용 담당자 지정: 낙관적 로컬 반영 후 PUT /items/{itemId} 에 payerId 포함해 서버 반영
    setItemPayer(id, payerId, payerName) {
      const trip = this.currentTrip
      if (!trip) return
      let found = null
      let foundDate = null
      for (const [d, list] of Object.entries(trip.itemsByDay)) {
        const it = list.find((x) => x.id === id)
        if (it) { found = it; foundDate = d; break }
      }
      if (!found) return
      found.payerId = payerId ?? null
      found.payerName = payerName ?? null
      if (found.serverId != null) {
        this.itemPayerOverrides[found.serverId] = { payerId: found.payerId, payerName: found.payerName }
      }
      trip.touch()
      if (found.serverId && isServerId(trip.id)) {
        tripService.updateItem(trip.id, found.serverId, {
          dayNumber: dateToDayNumber(trip.startDate, trip.endDate, foundDate),
          visitTime: found.time,
          cost: found.cost,
          memo: found.memo,
          payerId: found.payerId,
        }).catch((err) => {
          this.lastError = err?.message ?? 'setItemPayer failed'
          useToastStore().error('담당자 지정에 실패했습니다.')
        })
      }
    },
    // 아이템 간 이동 정보(소요시간/비용) 저장: 낙관적 로컬 반영 후 POST /routes
    // fromId/toId 는 일정 아이템의 로컬 id(srv_*). 서버 itemId(serverId)로 변환해 전송.
    setRoute(fromId, toId, { transport, moveTime, cost } = {}) {
      const trip = this.currentTrip
      if (!trip) return
      let from = null, to = null
      for (const list of Object.values(trip.itemsByDay)) {
        for (const it of list) {
          if (it.id === fromId) from = it
          if (it.id === toId) to = it
        }
      }
      if (!from) return
      // 낙관적 로컬 반영
      from.transitAfter = {
        ...(from.transitAfter ?? {}),
        method: transport ?? '',
        mins: moveTime ?? null,
        cost: Number(cost) || 0,
      }
      trip.touch()
      if (from.serverId && to?.serverId && isServerId(trip.id)) {
        tripService.saveRoute(trip.id, {
          fromItemId: from.serverId,
          toItemId: to.serverId,
          transport: transport ?? '',
          moveTime: moveTime ?? null,
          cost: Number(cost) || 0,
        }).catch((err) => {
          this.lastError = err?.message ?? 'saveRoute failed'
          useToastStore().error('이동 정보 저장에 실패했습니다.')
        })
      }
    },

    // Day 순서 변경(드래그): 날짜 슬롯은 고정(start~end), 각 슬롯의 "내용(아이템 집합)"을 재배치한다.
    // newOrder = 사용자가 끌어 만든 새 iso 순서. dates[i] 슬롯이 newOrder[i] 블록의 아이템을 받는다.
    reorderDays(newOrder) {
      const trip = this.currentTrip
      if (!trip || !Array.isArray(newOrder)) return
      const dates = enumerateDays(trip.startDate, trip.endDate)
      if (newOrder.length !== dates.length) return
      if (newOrder.every((iso, i) => iso === dates[i])) return // 변경 없음
      const snapshot = {}
      for (const d of dates) snapshot[d] = trip.itemsByDay[d] ?? []
      for (let i = 0; i < dates.length; i++) {
        trip.itemsByDay[dates[i]] = snapshot[newOrder[i]]
      }
      trip.touch()
      // 서버 반영: 내용이 바뀐 슬롯의 아이템에 새 dayNumber + 순서 저장
      if (!isServerId(trip.id)) return
      for (let i = 0; i < dates.length; i++) {
        if (newOrder[i] === dates[i]) continue // 그대로인 슬롯은 스킵
        const list = trip.itemsByDay[dates[i]] ?? []
        const dayNumber = i + 1
        list.forEach((it) => {
          if (it.serverId == null) return
          tripService.updateItem(trip.id, it.serverId, {
            dayNumber,
            visitTime: it.time,
            cost: it.cost,
            memo: it.memo,
            payerId: it.payerId,
          }).catch((err) => {
            this.lastError = err?.message ?? 'reorderDays failed'
          })
        })
        this._persistItemOrders(trip.id, list)
      }
      useToastStore().success('일정 순서를 변경했습니다.')
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

    // ── 드래그(vuedraggable) 영속화: 배열은 :list 가 이미 이동/정렬했으므로 서버 반영만 ──
    // 같은 날 순서변경 후 1회 저장
    persistDayOrder(date) {
      const trip = this.currentTrip
      if (!trip || !date) return
      const list = trip.itemsByDay[date]
      if (!list) return
      trip.touch()
      this._persistItemOrders(trip.id, list)
    },
    // 다른 날로 이동(배열은 이미 옮겨짐): 이동 항목의 visitDate(dayNumber) 서버 갱신 + 양쪽 순서 저장
    commitItemMoved(id, fromDate, toDate) {
      const trip = this.currentTrip
      if (!trip) return
      const list = trip.itemsByDay[toDate]
      const moved = list?.find((i) => i.id === id)
      trip.touch()
      if (moved?.serverId && isServerId(trip.id)) {
        tripService.updateItem(trip.id, moved.serverId, {
          dayNumber: dateToDayNumber(trip.startDate, trip.endDate, toDate),
          visitTime: moved.time,
          cost: moved.cost,
          memo: moved.memo,
        }).catch((err) => {
          this.lastError = err?.message ?? 'moveItem failed'
          useToastStore().error('일정 이동에 실패했습니다.')
        })
      }
      this._persistItemOrders(trip.id, trip.itemsByDay[toDate] ?? [])
      if (fromDate && fromDate !== toDate) {
        this._persistItemOrders(trip.id, trip.itemsByDay[fromDate] ?? [])
      }
    },
    // 플라이아웃(검색/좋아요/AI)에서 clone 으로 삽입된 raw 카드를 정식 일정으로 교체
    // vuedraggable 이 toDate 배열의 index 위치에 raw 객체를 넣은 뒤 호출된다.
    replaceDroppedRaw(date, index, rawPayload) {
      const trip = this.currentTrip
      if (!trip || !date) return
      const list = trip.itemsByDay[date]
      if (!list) return
      // 자리 표시용으로 삽입된 raw 제거
      if (index >= 0 && index < list.length) list.splice(index, 1)
      const at = Math.max(0, Math.min(index, list.length))
      // 삽입 위치 기준 기존 항목들의 serverId 순서 스냅샷(재정렬 복원용)
      const prevServerIds = list.map((it) => it.serverId).filter((v) => v != null)
      const placeId = resolvePlaceId(rawPayload)
      this._cachePlace(placeId, rawPayload)
      const item = new TravelItem({
        ...rawPayload,
        placeId,
        // raw 카드 필드 정규화
        name: rawPayload.name ?? rawPayload.title ?? '',
        address: rawPayload.address ?? rawPayload.addr1 ?? '',
        firstImage: rawPayload.firstImage ?? rawPayload.firstImage1 ?? null,
      })
      list.splice(at, 0, item)
      trip.touch()
      if (placeId && isServerId(trip.id)) {
        tripService.addItem(trip.id, {
          placeId,
          dayNumber: dateToDayNumber(trip.startDate, trip.endDate, date),
          visitTime: item.time,
          itemOrder: at + 1, // 드롭한 위치(1-based)에 삽입
          cost: item.cost,
          memo: item.memo,
        })
          .then(() => this.fetchDetail(trip.id))
          // fetchDetail 은 서버 itemOrder 로 재정렬한다. 서버가 추가 항목을 맨 뒤에
          // 부여하면 드롭 위치가 무시되므로, 드롭한 위치(at)로 다시 맞춰 영속화한다.
          .then(() => this._reorderAfterInsert(trip.id, date, prevServerIds, placeId, at))
          .catch((err) => {
            this.lastError = err?.message ?? 'addItem failed'
            useToastStore().error('일정 추가에 실패했습니다.')
          })
      }
      return item
    },
    // 드롭으로 추가된 항목을 서버 재조회 후에도 드롭한 위치(at)에 유지한다.
    _reorderAfterInsert(planId, date, prevServerIds, placeId, at) {
      const trip = this.currentTrip
      if (!trip || trip.id !== String(planId)) return
      const list = trip.itemsByDay[date]
      if (!list?.length) return
      const prevSet = new Set(prevServerIds)
      // 새로 생성된 항목 = 이전에 없던 serverId (placeId 우선 매칭)
      const newItem =
        list.find((it) => it.placeId === placeId && !prevSet.has(it.serverId)) ??
        list.find((it) => !prevSet.has(it.serverId))
      if (!newItem) return
      // 기존 항목을 원래 순서대로 복원하고, 새 항목을 at 위치에 끼워 넣는다.
      const existing = prevServerIds
        .map((sid) => list.find((it) => it.serverId === sid))
        .filter(Boolean)
      const ordered = [...existing]
      ordered.splice(Math.max(0, Math.min(at, ordered.length)), 0, newItem)
      // 누락된 항목(혹시 모를)을 뒤에 보존
      for (const it of list) if (!ordered.includes(it)) ordered.push(it)
      const same = ordered.length === list.length && ordered.every((it, i) => it === list[i])
      trip.itemsByDay[date] = ordered
      if (!same) {
        trip.touch()
        this._persistItemOrders(planId, ordered)
      }
    },
  },
})
