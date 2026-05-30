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
  return []
}

export const useStorageStore = defineStore('storage', {
  state: () => ({
    items: seedStorageItems(),
    dragging: null, // { source: 'storage'|'chat', item: PlaceItem }
  }),
  getters: {
    // Accept full item object; match by sourceId, id, or name (for suggestion items without id)
    isLiked: (state) => {
      const _items = state.items // touch here so Pinia's computed tracks items changes
      return (item) => {
        if (!item) return false
        const key = item.sourceId ?? item.id
        return _items.some((i) =>
          (key && (i.sourceId === key || i.id === key)) ||
          (item.name && i.name === item.name),
        )
      }
    },
  },
  actions: {
    addItem(payload) {
      const sid = payload?.sourceId ?? payload?.id ?? null
      const name = payload?.name ?? ''
      // Deduplication: prevent same item being added twice
      const exists = this.items.some((i) =>
        (sid && (i.sourceId === sid || i.id === sid)) ||
        (name && i.name === name),
      )
      if (exists) return
      const it = createPlaceItem(payload)
      const preservedVotes = payload?.votes ?? { up: 0, down: 0 }
      this.items.unshift({
        ...it,
        id: nextId(),
        sourceId: sid,
        votes: { ...preservedVotes },
        myVote: payload?.myVote ?? null,
      })
    },
    removeItem(id) {
      this.items = this.items.filter((i) => i.id !== id)
    },
    toggleLike(item) {
      const key = item.sourceId ?? item.id
      const existing = this.items.find((i) =>
        (key && (i.sourceId === key || i.id === key)) ||
        (item.name && i.name === item.name),
      )
      if (existing) {
        this.items = this.items.filter((i) => i.id !== existing.id)
      } else {
        this.addItem({ ...item, sourceId: item.id ?? null })
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
