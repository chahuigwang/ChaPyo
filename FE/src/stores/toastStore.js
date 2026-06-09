import { defineStore } from 'pinia'

let _seq = 0

// 전역 알림(토스트). API 실패 등 사용자 피드백 수단.
export const useToastStore = defineStore('toast', {
  state: () => ({
    items: [], // { id, type: 'success'|'error'|'info', message }
  }),
  actions: {
    push(message, type = 'info', ttl = 3200) {
      if (!message) return
      const id = ++_seq
      this.items.push({ id, type, message })
      setTimeout(() => this.remove(id), ttl)
      return id
    },
    success(message, ttl) { return this.push(message, 'success', ttl) },
    error(message, ttl) { return this.push(message, 'error', ttl ?? 4200) },
    info(message, ttl) { return this.push(message, 'info', ttl) },
    remove(id) {
      this.items = this.items.filter((t) => t.id !== id)
    },
  },
})
