import { TravelItem } from './TravelItem'
import { enumerateDays } from '@/types/itinerary'

export { enumerateDays }

let _tripSeq = 0
const newTripId = () => `t_${Date.now()}_${++_tripSeq}`

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

  applySync({ version, lastSyncTime } = {}) {
    if (version != null) this.version = Number(version) || this.version
    if (lastSyncTime != null) this.lastSyncTime = lastSyncTime
  }

  isStaleAgainst(serverVersion) {
    return Number(serverVersion) > this.version
  }

  touch() {
    this.updatedAt = Date.now()
    this.version += 1
  }
}
