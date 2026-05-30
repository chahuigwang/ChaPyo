import { defineStore } from 'pinia'
import { createPlaceItem } from '@/types/itinerary'

// 보관함: 아직 일정에 배정되지 않은 여행 아이템 풀.
// 개인 상태(Personal State): 협업 상대와 동기화되지 않는다. 사용자가 워크스페이스 일정으로 드롭한 시점에서야
// SHARED 상태(tripStore)로 전이되어 실시간 동기 대상이 된다.
// 또한 현재 드래그 중인 아이템을 단일 진실 공급원으로 보유한다(HTML5 dataTransfer는 문자열만 안전).
let _seq = 0
const nextId = () => `s_${Date.now()}_${++_seq}`

function withVotes(it) {
  return { ...it, votes: { up: 0, down: 0 }, myVote: null }
}
function seedStorageItems() {
  return [
    createPlaceItem({ name: '창덕궁', category: 'place', memo: '유네스코 세계유산', cost: 3000, lat: 37.582604, lng: 126.991638 }),
    createPlaceItem({ name: '이태원 펍거리', category: 'food', memo: '저녁 펍 투어', cost: 35000, lat: 37.534509, lng: 126.994470 }),
    createPlaceItem({ name: '한강공원 (반포)', category: 'place', memo: '달빛 무지개 분수', cost: 0, lat: 37.510997, lng: 126.996141 }),
    createPlaceItem({ name: '롯데호텔 서울', category: 'lodging', memo: '5성급 도심 호텔', cost: 320000, lat: 37.564934, lng: 126.981275 }),
    createPlaceItem({ name: 'KTX 서울→부산', category: 'transport', memo: '약 2시간 30분', cost: 59800 }),
  ].map((it, idx) => withVotes({
    ...it,
    id: nextId(),
    // Seed plausible peer votes so the UI has signal on first load.
    votes: { up: [3, 5, 4, 2, 1][idx] ?? 0, down: [0, 1, 0, 2, 1][idx] ?? 0 },
    myVote: null,
  }))
}

export const useStorageStore = defineStore('storage', {
  state: () => ({
    items: seedStorageItems(),
    dragging: null, // { source: 'storage'|'chat', item: PlaceItem }
  }),
  getters: {
    isLiked: (state) => (sourceId) =>
      state.items.some((i) => i.sourceId === sourceId || i.id === sourceId),
  },
  actions: {
    addItem(payload) {
      const it = createPlaceItem(payload)
      const preservedVotes = payload?.votes ?? { up: 0, down: 0 }
      this.items.unshift({
        ...it,
        id: nextId(),
        sourceId: payload?.sourceId ?? payload?.id ?? null,
        votes: { ...preservedVotes },
        myVote: payload?.myVote ?? null,
      })
    },
    removeItem(id) {
      this.items = this.items.filter((i) => i.id !== id)
    },
    toggleLike(item) {
      const existing = this.items.find((i) => i.sourceId === item.id || i.id === item.id)
      if (existing) {
        this.items = this.items.filter((i) => i.id !== existing.id)
      } else {
        this.addItem({ ...item, sourceId: item.id })
      }
    },
    vote(id, dir) {
      const it = this.items.find((i) => i.id === id)
      if (!it) return
      if (!it.votes) it.votes = { up: 0, down: 0 }
      if (it.myVote === dir) {
        // toggle off
        it.votes[dir] = Math.max(0, (it.votes[dir] || 0) - 1)
        it.myVote = null
      } else {
        if (it.myVote) it.votes[it.myVote] = Math.max(0, (it.votes[it.myVote] || 0) - 1)
        it.votes[dir] = (it.votes[dir] || 0) + 1
        it.myVote = dir
      }
    },
    setDragging(payload) { this.dragging = payload },
    clearDragging() { this.dragging = null },
  },
})
