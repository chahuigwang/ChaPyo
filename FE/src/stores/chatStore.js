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
    typingStartedAt: null, // 요청 시작 시각 (ms) — 경과 시간 표시용
    _abortController: null,
  }),
  actions: {
    setPersona(text) {
      this.persona = text ?? ''
    },
    cancelRequest() {
      if (this._abortController) {
        this._abortController.abort()
        this._abortController = null
      }
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

      const controller = new AbortController()
      this._abortController = controller
      this.isTyping = true
      this.typingStartedAt = Date.now()

      try {
        const tripStore = useTripStore()
        const planId = tripStore.currentTripId

        let reply = ''
        let places = []

        if (planId && /^\d+$/.test(String(planId))) {
          const { data } = await http.post(
            ENDPOINTS.trips.aiChat(planId),
            { persona, message: content },
            { timeout: 0, signal: controller.signal },
          )
          reply = data?.data?.reply ?? ''
          places = (data?.data?.places ?? []).map(toPlaceCard)
        } else {
          const { data } = await http.post(
            ENDPOINTS.tourism.ai,
            { persona, text: content },
            { timeout: 0, signal: controller.signal },
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
        // 사용자가 직접 취소한 경우 시스템 메시지 없이 조용히 종료
        if (err?.code === 'ERR_CANCELED' || controller.signal.aborted) return
        this.messages.push({
          id: nextId(),
          role: 'system',
          content: err?.message ?? 'AI 추천 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.',
          ts: Date.now(),
        })
      } finally {
        this.isTyping = false
        this.typingStartedAt = null
        this._abortController = null
      }
    },
    pushSystemNotice(content) {
      this.messages.push({ id: nextId(), role: 'system', content, ts: Date.now() })
    },
  },
})
