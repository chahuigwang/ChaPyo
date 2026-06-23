import { defineStore } from 'pinia'
import { placeService } from '@/api/placeService'
import { typeToCategory } from '@/stores/searchStore'

let _seq = 0
const nextId = () => `m_${Date.now()}_${++_seq}`

const GREETING =
  '여행 페르소나(예: "미식가", "INTJ 20대 남자")를 입력하고, 가고 싶은 분위기나 지역을 알려주세요. 맞춤 관광지를 추천해 드릴게요.'

// BE PlaceResponse → 카드/상세/좋아요 공통 아이템 형태로 정규화.
// (검색결과 results 와 동일 스키마: placeId 기반으로 좋아요/상세 조회가 동작)
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

      // persona 미입력 시 안내만 하고 요청은 보내지 않는다.
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
        const { text: reply, content: places } = await placeService.recommendAi({
          persona,
          text: content,
        })
        this.messages.push({
          id: nextId(),
          role: 'ai',
          content: reply || '추천 결과를 가져왔어요.',
          ts: Date.now(),
          places: places.map(toPlaceCard),
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
