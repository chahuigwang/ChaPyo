import { defineStore } from 'pinia'
import { PERSONAS, findPersona, buildCustomPersona } from '@/types/persona'
import { buildRecommendation } from '@/types/recommendation'

let _seq = 0
const nextId = () => `m_${Date.now()}_${++_seq}`

export const useChatStore = defineStore('chat', {
  state: () => ({
    personas: PERSONAS.map((p) => ({ ...p })),
    personaId: PERSONAS[0].id,
    threads: Object.fromEntries(
      PERSONAS.map((p) => [p.id, [{ id: nextId(), role: 'ai', content: p.greeting, ts: Date.now() }]])
    ),
    isTyping: false,
  }),
  getters: {
    persona: (s) => findPersona(s.personas, s.personaId),
    messages: (s) => s.threads[s.personaId] ?? [],
  },
  actions: {
    selectPersona(id) {
      if (!this.personas.find((p) => p.id === id)) return
      this.personaId = id
    },
    addPersona({ gender, ageGroup, mbti }) {
      if (!gender || !ageGroup || !mbti) return null
      const p = buildCustomPersona({ gender, ageGroup, mbti })
      this.personas.push(p)
      this.threads[p.id] = [{ id: nextId(), role: 'ai', content: p.greeting, ts: Date.now() }]
      this.personaId = p.id
      return p
    },
    updatePersona(id, { gender, ageGroup, mbti }) {
      const p = this.personas.find((x) => x.id === id)
      if (!p || p.builtIn) return
      p.gender = gender
      p.ageGroup = ageGroup
      p.mbti = mbti
      p.name = `${gender} · ${ageGroup} · ${mbti}`
      p.tagline = `${gender}/${ageGroup}/${mbti} 맞춤 추천`
    },
    reorderPersonas(fromId, toId) {
      if (fromId === toId) return
      const from = this.personas.findIndex((p) => p.id === fromId)
      const to = this.personas.findIndex((p) => p.id === toId)
      if (from < 0 || to < 0) return
      const [moved] = this.personas.splice(from, 1)
      this.personas.splice(to, 0, moved)
    },
    deletePersona(id) {
      const p = this.personas.find((x) => x.id === id)
      if (!p || p.builtIn) return
      this.personas = this.personas.filter((x) => x.id !== id)
      delete this.threads[id]
      if (this.personaId === id) this.personaId = this.personas[0]?.id
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
