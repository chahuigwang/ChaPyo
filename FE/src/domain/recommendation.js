// Mock 추천 엔진: 사용자 발화 + 페르소나 → 추천 카드 목록.
// Phase 5 이후 백엔드 LLM 응답으로 교체될 자리.

const SEED = {
  서울: [
    { name: '경복궁', category: 'place', time: '10:00', memo: '한복 대여 후 입장' },
    { name: '광장시장', category: 'food', time: '12:30', memo: '빈대떡, 마약김밥' },
    { name: '북촌한옥마을', category: 'place', time: '14:30', memo: '도보 산책' },
  ],
  부산: [
    { name: '해운대 해수욕장', category: 'place', time: '10:00', memo: '아침 산책' },
    { name: '자갈치시장', category: 'food', time: '12:00', memo: '회 + 꼼장어' },
    { name: '감천문화마을', category: 'place', time: '15:00', memo: '포토 스팟' },
  ],
  제주: [
    { name: '성산일출봉', category: 'place', time: '07:00', memo: '일출 명소' },
    { name: '올레시장', category: 'food', time: '12:30', memo: '흑돼지 + 갈치조림' },
    { name: '협재 해수욕장', category: 'place', time: '15:30', memo: '에메랄드 빛 바다' },
  ],
}

const PERSONA_BIAS = {
  foodie: (item) => item.category === 'food',
  budget: (item) => item.memo && !item.memo.includes('럭셔리'),
  luxury: (item) => true, // mock — 가격대 무시
  planner: () => true,
}

function detectRegion(text) {
  for (const key of Object.keys(SEED)) {
    if (text.includes(key)) return key
  }
  return null
}

// 반환: { reply, suggestions } — suggestion = { name, category, time, memo }
export function buildRecommendation(userText, persona) {
  const region = detectRegion(userText)
  if (!region) {
    return {
      reply: `[${persona.name}] 어느 지역을 생각 중이신가요? (예: 서울, 부산, 제주)`,
      suggestions: [],
    }
  }

  const bias = PERSONA_BIAS[persona.id] ?? (() => true)
  const picks = SEED[region].filter(bias).slice(0, 3)
  const items = picks.length ? picks : SEED[region].slice(0, 2)

  return {
    reply: `[${persona.name}] ${region} 코스 ${items.length}곳 추천드려요. 마음에 드는 곳을 일정에 추가해 보세요.`,
    suggestions: items,
  }
}
