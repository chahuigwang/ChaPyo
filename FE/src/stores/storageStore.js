import { defineStore } from 'pinia'
import { placeService } from '@/api/placeService'
import { useToastStore } from '@/stores/toastStore'
import { typeToCategory } from '@/stores/searchStore'

// 좋아요는 placeId 를 단일 키로 사용. 검색결과(id=placeId), TravelItem(placeId),
// 좋아요카드(placeId), 보관함카드(sourceId=placeId) 모두에서 placeId 를 뽑아낸다.
function likeKeyOf(item) {
  const raw = item?.placeId ?? item?.sourceId ?? item?.id
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

let _seq = 0
// 임의의 source(검색/타임라인/서버응답)를 좋아요 리스트 카드 형태로 정규화
function toCard(src) {
  const placeId = likeKeyOf(src)
  return {
    id: placeId != null ? `like_${placeId}` : `like_${++_seq}`,
    placeId,
    sourceId: placeId, // 일정으로 드래그 시 placeId 해석에 사용
    name: src.name ?? src.title ?? '',
    category: src.category ?? typeToCategory(src.categoryCode2 ?? src.categoryCode1) ?? 'place',
    address: src.address ?? src.addr1 ?? '',
    firstImage: src.firstImage ?? src.firstImage1 ?? null,
    likeCount: src.likeCount ?? 0,
    lat: src.lat ?? (src.latitude != null ? Number(src.latitude) : null),
    lng: src.lng ?? (src.longitude != null ? Number(src.longitude) : null),
  }
}

export const useStorageStore = defineStore('storage', {
  state: () => ({
    items: [],        // 좋아요한 장소 카드 — 전역 단일 진실(placeId 기준)
    likeCounts: {},   // placeId → 최신 좋아요 수(토글 후 서버값). 전역 동기화용 오버라이드
    dragging: null,
    loaded: false,
  }),
  getters: {
    // 어디서든(검색/상세/타임라인/리스트) placeId 로 좋아요 여부 판단
    isLiked: (state) => (item) => {
      const key = likeKeyOf(item)
      if (key != null) return state.items.some((i) => i.placeId === key)
      return item?.name ? state.items.some((i) => i.name === item.name) : false
    },
    // placeId 의 최신 좋아요 수. 토글된 값이 있으면 그걸, 없으면 항목 자체 값
    likeCountOf: (state) => (item) => {
      const key = likeKeyOf(item)
      if (key != null && state.likeCounts[key] != null) return state.likeCounts[key]
      return item?.likeCount ?? 0
    },
  },
  actions: {
    // 앱 진입 1회: GET /places/likes?size=1000 → 전역 좋아요 적재
    async fetchLikes() {
      try {
        const list = await placeService.fetchLikes(1000)
        this.items = list.map(toCard)
        this.loaded = true
      } catch (err) {
        // 조용히 실패 — 토글/재진입 시 복구
      }
    },
    reset() {
      this.items = []
      this.likeCounts = {}
      this.dragging = null
      this.loaded = false
    },

    addItem(payload) {
      const card = toCard(payload)
      if (card.placeId != null && this.items.some((i) => i.placeId === card.placeId)) return
      this.items.unshift(card)
    },
    removeItem(id) {
      this.items = this.items.filter((i) => i.id !== id)
    },

    // 아직 좋아요가 아니면 좋아요 (드래그로 보관함에 담을 때)
    like(item) {
      if (!this.isLiked(item)) this.toggleLike(item)
    },

    // 낙관적 토글 → POST /places/{placeId}/likes → 서버 결과로 확정(실패 시 롤백)
    async toggleLike(item) {
      const placeId = likeKeyOf(item)
      const wasLiked = this.isLiked(item)

      // placeId 없는 항목은 로컬만 토글
      if (placeId == null) {
        if (wasLiked) this.items = this.items.filter((i) => i.name !== item.name)
        else this.items.unshift(toCard(item))
        return
      }

      // 낙관적 반영
      if (wasLiked) this.items = this.items.filter((i) => i.placeId !== placeId)
      else this.items.unshift(toCard(item))

      try {
        const { liked, likeCount } = await placeService.toggleLike(placeId)
        const has = this.items.some((i) => i.placeId === placeId)
        if (liked && !has) this.items.unshift(toCard(item))
        else if (!liked && has) this.items = this.items.filter((i) => i.placeId !== placeId)
        // 서버가 돌려준 갱신된 좋아요 수를 반영
        if (likeCount != null) this._applyLikeCount(placeId, likeCount, item)
      } catch (err) {
        // 롤백
        if (wasLiked) this.items.unshift(toCard(item))
        else this.items = this.items.filter((i) => i.placeId !== placeId)
        useToastStore().error('좋아요 처리에 실패했습니다.')
      }
    },
    // 갱신된 좋아요 수를 전역 맵에 기록(모든 화면이 likeCountOf 로 참조) + 원본/카드에도 반영
    _applyLikeCount(placeId, count, srcItem) {
      this.likeCounts[placeId] = count
      if (srcItem && typeof srcItem === 'object') srcItem.likeCount = count
      const card = this.items.find((i) => i.placeId === placeId)
      if (card) card.likeCount = count
    },

    setDragging(payload) { this.dragging = payload },
    clearDragging() { this.dragging = null },
  },
})
