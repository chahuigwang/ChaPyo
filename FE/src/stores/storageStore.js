import { defineStore } from 'pinia'
import { createPlaceItem } from '@/types/itinerary'

let _seq = 0
const nextId = () => `s_${Date.now()}_${++_seq}`

function withVotes(it) {
  return { ...it, votes: { up: 0, down: 0 }, myVote: null }
}

export const useStorageStore = defineStore('storage', {
  state: () => ({
    items: [],
    dragging: null,
  }),
  getters: {
    isLiked: (state) => {
      const _items = state.items
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
