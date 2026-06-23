const VALID_CATEGORIES = new Set(['place', 'food', 'lodging', 'transport'])

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
    transitAfter = null,
    address = '',
    firstImage = null,
    placeId = null,
    serverId = null,
    nickname = '',
    addedByUserId = null,
    payerId = null,
    payerName = null,
  } = {}) {
    this.id = id ?? newItemId()
    this.name = name
    this.category = VALID_CATEGORIES.has(category) ? category : 'place'
    this.time = time
    this.memo = memo
    this.cost = Number(cost) || 0
    this.lat = lat
    this.lng = lng
    this.contentId = contentId
    this.transitAfter = transitAfter ?? { cost: 0, mins: null, method: '' }
    this.address = address
    this.firstImage = firstImage ?? null
    this.placeId = placeId != null ? Number(placeId) : null  // BE place 참조 ID
    this.serverId = serverId != null ? Number(serverId) : null // BE item(itemId)
    this.nickname = nickname // 이 일정을 추가한 사용자 닉네임(adderNickname)
    this.addedByUserId = addedByUserId // adderId
    this.payerId = payerId ?? null // 비용 담당자 userId(null = N분의 1)
    this.payerName = payerName ?? null // 비용 담당자 닉네임
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
      transitAfter: this.transitAfter,
      address: this.address,
      firstImage: this.firstImage,
      placeId: this.placeId,
      serverId: this.serverId,
      nickname: this.nickname,
      addedByUserId: this.addedByUserId,
      payerId: this.payerId,
      payerName: this.payerName,
    }
  }

  clone(patch = {}) {
    return new TravelItem({ ...this.toJSON(), ...patch })
  }
}
