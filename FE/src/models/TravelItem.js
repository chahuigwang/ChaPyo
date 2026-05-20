// 일정 한 칸(장소/식당/숙소/이동) 도메인 모델.
const CATEGORY_SET = new Set(['place', 'food', 'lodging', 'transport'])

let _itemSeq = 0
const newItemId = () => `i_${Date.now()}_${++_itemSeq}`

export class TravelItem {
  constructor({
    id,
    name = '',
    category = 'place',
    time = '',
    memo = '',
    cost = 0,
    lat = null,
    lng = null,
    contentId = null,
  } = {}) {
    this.id = id ?? newItemId()
    this.name = name
    this.category = CATEGORY_SET.has(category) ? category : 'place'
    this.time = time
    this.memo = memo
    this.cost = Number(cost) || 0
    this.lat = lat
    this.lng = lng
    this.contentId = contentId
  }

  static fromJSON(raw = {}) {
    return new TravelItem(raw)
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      time: this.time,
      memo: this.memo,
      cost: this.cost,
      lat: this.lat,
      lng: this.lng,
      contentId: this.contentId,
    }
  }

  clone(patch = {}) {
    return new TravelItem({ ...this.toJSON(), ...patch })
  }
}
