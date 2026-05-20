import { defineStore } from 'pinia'

// Phase 25 — mock collaboration state. Real wiring (SSE / polling) lands later.
// `editingByItemId`: { [itemId]: { userId, name, color } }
// `staleAlert`: { open, by, version }
export const useCollabStore = defineStore('collab', {
  state: () => ({
    me: { id: 'me', name: '나' },
    peers: [
      { id: 'u1', name: '민지', color: '#00B7EB' },
      { id: 'u2', name: '준호', color: '#F59E0B' },
      { id: 'u3', name: '서연', color: '#10B981' },
      { id: 'u4', name: '도윤', color: '#A855F7' },
    ],
    editingByItemId: {},
    inviteOpen: false,
    historyOpen: false,
    history: [],
    staleAlert: { open: false, by: null, version: 0 },
    sharedVersion: 1,
  }),
  getters: {
    isEditing: (s) => (itemId) => Boolean(s.editingByItemId[itemId]),
    editorOf: (s) => (itemId) => s.editingByItemId[itemId] ?? null,
    // Mock "last edited by" — deterministic peer per item id.
    lastEditorOf: (s) => (itemId) => {
      if (!itemId) return null
      const seed = String(itemId).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
      return s.peers[seed % s.peers.length] ?? null
    },
  },
  actions: {
    openInvite() { this.inviteOpen = true },
    closeInvite() { this.inviteOpen = false },

    openHistory() { this.historyOpen = true },
    closeHistory() { this.historyOpen = false },

    pushHistory({ type, itemName, byName, byColor }) {
      const peer = this.peers.find((p) => p.name === byName) ?? this.peers[0]
      this.history.unshift({
        id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type,
        itemName,
        byName: byName ?? peer.name,
        byColor: byColor ?? peer.color,
        at: Date.now(),
      })
      if (this.history.length > 50) this.history.length = 50
    },
    seedDemoHistory() {
      if (this.history.length) return
      const samples = [
        { type: 'add', byName: '민지', itemName: '경복궁' },
        { type: 'edit', byName: '준호', itemName: '광장시장' },
        { type: 'reorder', byName: '서연', itemName: '북촌 한옥마을' },
        { type: 'remove', byName: '도윤', itemName: 'KTX 서울→부산' },
      ]
      samples.forEach((s, i) => {
        const peer = this.peers.find((p) => p.name === s.byName) ?? this.peers[0]
        this.history.push({
          id: `h_seed_${i}`,
          ...s,
          byColor: peer.color,
          at: Date.now() - (i + 1) * 9 * 60 * 1000,
        })
      })
    },

    // Mock helpers — flag/unflag an item as being edited by a peer.
    markEditing(itemId, peer) {
      if (!itemId || !peer) return
      this.editingByItemId[itemId] = peer
    },
    clearEditing(itemId) { delete this.editingByItemId[itemId] },

    showStale(byName = '민지') {
      this.sharedVersion += 1
      this.staleAlert = { open: true, by: byName, version: this.sharedVersion }
    },
    dismissStale() { this.staleAlert.open = false },

    // Demo seed — pre-populate one editing intent so the UI is observable.
    seedDemoEditing(itemId) {
      if (!itemId) return
      this.markEditing(itemId, this.peers[0])
    },
  },
})
