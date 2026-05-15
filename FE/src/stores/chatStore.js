import { defineStore } from 'pinia'
import { PERSONAS, findPersona } from '@/domain/persona'
import { buildRecommendation } from '@/domain/recommendation'

let _seq = 0
const nextId = () => `m_${Date.now()}_${++_seq}`

export const useChatStore = defineStore('chat', {
  state: () => ({
    personaId: PERSONAS[0].id,
    threads: Object.fromEntries(
      PERSONAS.map((p) => [p.id, [{ id: nextId(), role: 'ai', content: p.greeting, ts: Date.now() }]])
    ),
    isTyping: false,
  }),
  getters: {
    persona: (s) => findPersona(s.personaId),
    messages: (s) => s.threads[s.personaId] ?? [],
  },
  actions: {
    selectPersona(id) {
      if (!findPersona(id)) return
      this.personaId = id
    },
    async sendMessage(text) {
      const content = text?.trim()
      if (!content) return
      const list = this.threads[this.personaId]
      list.push({ id: nextId(), role: 'user', content, ts: Date.now() })

      this.isTyping = true
      await new Promise((r) => setTimeout(r, 500))
      const { reply, suggestions } = buildRecommendation(content, this.persona)
      list.push({
        id: nextId(),
        role: 'ai',
        content: reply,
        ts: Date.now(),
        suggestions,
        addedIds: [],
      })
      this.isTyping = false
    },
    markSuggestionAdded(messageId, suggestionIndex) {
      const list = this.threads[this.personaId]
      const m = list.find((x) => x.id === messageId)
      if (!m) return
      if (!m.addedIds) m.addedIds = []
      if (!m.addedIds.includes(suggestionIndex)) m.addedIds.push(suggestionIndex)
    },
    pushSystemNotice(content) {
      const list = this.threads[this.personaId]
      list.push({ id: nextId(), role: 'system', content, ts: Date.now() })
    },
  },
})
