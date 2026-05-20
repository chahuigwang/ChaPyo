import { TravelItem } from './TravelItem'

let _tripSeq = 0
const newTripId = () => `t_${Date.now()}_${++_tripSeq}`

// startDate~endDate 사이 'YYYY-MM-DD' 배열
export function enumerateDays(startDate, endDate) {
  if (!startDate || !endDate) return []
  const s = new Date(startDate)
  const e = new Date(endDate)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return []
  const out = []
  const cur = new Date(s)
  while (cur <= e) {
    out.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

// 여행 계획 도메인 모델. 협업 동기를 위한 version / lastSyncTime 포함.
export class TripPlan {
  constructor({
    id,
    title = '새 여행',
    startDate,
    endDate,
    itemsByDay = {},
    selectedDate,
    ownerId = null,
    collaboratorIds = [],
    version = 0,
    updatedAt,
    lastSyncTime = null,
  } = {}) {
    this.id = id ?? newTripId()
    this.title = title
    this.startDate = startDate ?? ''
    this.endDate = endDate ?? ''
    this.itemsByDay = TripPlan._hydrateItems(itemsByDay)
    this.selectedDate = selectedDate ?? this.days[0] ?? ''
    this.ownerId = ownerId
    this.collaboratorIds = [...collaboratorIds]
    this.version = Number(version) || 0
    this.updatedAt = updatedAt ?? Date.now()
    this.lastSyncTime = lastSyncTime
  }

  static _hydrateItems(itemsByDay) {
    const out = {}
    for (const [day, list] of Object.entries(itemsByDay ?? {})) {
      out[day] = (list ?? []).map((i) => (i instanceof TravelItem ? i : TravelItem.fromJSON(i)))
    }
    return out
  }

  get days() { return enumerateDays(this.startDate, this.endDate) }
  get isCollaborative() { return this.collaboratorIds.length > 0 }

  itemsOf(date) { return this.itemsByDay[date] ?? [] }

  static fromJSON(raw = {}) { return new TripPlan(raw) }

  toJSON() {
    const itemsByDay = {}
    for (const [day, list] of Object.entries(this.itemsByDay)) {
      itemsByDay[day] = list.map((i) => (i instanceof TravelItem ? i.toJSON() : i))
    }
    return {
      id: this.id,
      title: this.title,
      startDate: this.startDate,
      endDate: this.endDate,
      itemsByDay,
      selectedDate: this.selectedDate,
      ownerId: this.ownerId,
      collaboratorIds: [...this.collaboratorIds],
      version: this.version,
      updatedAt: this.updatedAt,
      lastSyncTime: this.lastSyncTime,
    }
  }

  // 협업: 서버 동기 메타 반영
  applySync({ version, lastSyncTime } = {}) {
    if (version != null) this.version = Number(version) || this.version
    if (lastSyncTime != null) this.lastSyncTime = lastSyncTime
  }

  // 협업: 동시 편집 충돌 감지. 서버 version > 로컬 version 이면 stale.
  isStaleAgainst(serverVersion) {
    return Number(serverVersion) > this.version
  }

  touch() {
    this.updatedAt = Date.now()
    this.version += 1
  }
}
