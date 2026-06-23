import { defineStore } from 'pinia'
import { http } from '@/api/httpClient'
import { ENDPOINTS } from '@/api/endpoints'
import { typeToCategory } from '@/stores/searchStore'
import { useTripStore } from '@/stores/tripStore'

let _seq = 0
const nextId = () => `m_${Date.now()}_${++_seq}`

const GREETING =
  '여행 페르소나(예: "미식가", "INTJ 20대 남자")를 입력하고, 가고 싶은 분위기나 지역을 알려주세요. 맞춤 관광지를 추천해 드릴게요.'

function toPlaceCard(p) {
  return {
    placeId: p.placeId,
    id: String(p.placeId),
    name: p.title,
    address: p.addr1,
    firstImage: p.firstImage1,
    categoryCode1: p.categoryCode1,
    categoryCode2: p.categoryCode2,
    category: typeToCategory(p.categoryCode2 ?? p.categoryCode1),
    likeCount: p.likeCount ?? 0,
    avgRating: p.avgRating ?? null,
    reviewCount: p.reviewCount ?? null,
    liked: p.liked ?? false,
  }
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    persona: '미식가',
    messages: [{ id: nextId(), role: 'ai', content: GREETING, ts: Date.now() }],
    isTyping: false,
  }),
  actions: {
    setPersona(text) {
      this.persona = text ?? ''
    },
    async sendMessage(text) {
      const content = text?.trim()
      if (!content || this.isTyping) return

      const persona = this.persona.trim()
      this.messages.push({ id: nextId(), role: 'user', content, ts: Date.now() })

      if (!persona) {
        this.messages.push({
          id: nextId(),
          role: 'system',
          content: '먼저 상단에 페르소나를 입력해 주세요. (예: 미식가, INTJ 20대 남자)',
          ts: Date.now(),
        })
        return
      }

      this.isTyping = true
      try {
        const tripStore = useTripStore()
        const planId = tripStore.currentTripId

        let reply = ''
        let places = []

        if (planId && /^\d+$/.test(String(planId))) {
          // POST /api/v1/trips/{planId}/ai/chat
          // body: persona(페르소나)와 message(사용자 입력)를 분리해 전송
          // Response: { success, data: { reply, places } }
          // AI 응답은 10초를 넘길 수 있으므로 timeout 0(무제한)으로 호출 → 셀프 취소 방지
          const { data } = await http.post(
            ENDPOINTS.trips.aiChat(planId),
            { persona, message: content },
            { timeout: 0 },
          )
          reply = data?.data?.reply ?? ''
          places = (data?.data?.places ?? []).map(toPlaceCard)
        } else {
          // 여행 미선택 시 fallback: 기존 AI 추천 API
          const { data } = await http.post(
            ENDPOINTS.tourism.ai,
            { persona, text: content },
            { timeout: 0 },
          )
          reply = data?.data?.text ?? ''
          places = (data?.data?.content ?? []).map(toPlaceCard)
        }

        this.messages.push({
          id: nextId(),
          role: 'ai',
          content: reply || '추천 결과를 가져왔어요.',
          ts: Date.now(),
          places,
        })
      } catch (err) {
        this.messages.push({
          id: nextId(),
          role: 'system',
          content: err?.message ?? 'AI 추천 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.',
          ts: Date.now(),
        })
      } finally {
        this.isTyping = false
      }
    },
    pushSystemNotice(content) {
      this.messages.push({ id: nextId(), role: 'system', content, ts: Date.now() })
    },
  },
})
