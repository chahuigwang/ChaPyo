import { http } from './httpClient'
import { ENDPOINTS } from './endpoints'

/**
 * 장소 검색 쿼리 파라미터
 * @typedef {Object} PlaceSearchParams
 * @property {string}  [areaCode]     - 시/도 코드 (e.g. '11')
 * @property {string}  [districtCode] - 구/군 코드 (e.g. '110')
 * @property {string}  [category1]    - 1차 카테고리 코드 (e.g. 'AC')
 * @property {string}  [category2]    - 2차 카테고리 코드 (e.g. 'AC01')
 * @property {number}  [page]         - 페이지 번호 (0-based or 1-based: 백엔드 스펙 확인)
 * @property {number}  [size]         - 페이지 크기
 */

/**
 * 장소 단건 아이템
 * @typedef {Object} PlaceItem
 * @property {number} placeId
 * @property {string} title
 * @property {string} addr1
 * @property {string} firstImage1
 * @property {string} categoryCode1
 * @property {string} categoryCode2
 * @property {number} likeCount
 */

/**
 * GET /api/v1/places 응답 래퍼
 * @typedef {Object} PlaceListResult
 * @property {PlaceItem[]} content
 * @property {boolean}     hasNext
 */

export const placeService = {
  /**
   * 장소 목록 검색. 모든 파라미터 optional.
   * undefined/null/빈 문자열 필드는 쿼리스트링에서 자동 제외.
   *
   * @param {PlaceSearchParams} params
   * @returns {Promise<PlaceListResult>}
   */
  async searchPlaces(params = {}) {
    // undefined / 빈 문자열 필드 제거 → 불필요한 쿼리스트링 방지
    const query = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    )

    const { data } = await http.get(ENDPOINTS.tourism.places, query)

    // 응답 구조: { success, message, data: { content, hasNext } }
    if (!data?.success) {
      return Promise.reject({
        ok: false,
        message: data?.message ?? 'Unknown error from /api/v1/places',
        data: null,
      })
    }

    return {
      content: data.data?.content ?? [],
      hasNext: data.data?.hasNext ?? false,
    }
  },

  /**
   * 관광지 상세 조회. GET /api/v1/places/{placeId}
   * @returns {Promise<Object|null>} PlaceDetailResponse (overview, tel, addr1, firstImage1, latitude, longitude …)
   */
  async detail(placeId) {
    const { data } = await http.get(ENDPOINTS.tourism.detail(placeId))
    return data?.data ?? null
  },

  /**
   * 관광지 좋아요 토글. POST /api/v1/places/{placeId}/likes
   * @returns {Promise<{liked: boolean, likeCount: number|null}>} 토글 후 좋아요 여부 + 갱신된 좋아요 수
   */
  async toggleLike(placeId) {
    const { data } = await http.post(ENDPOINTS.tourism.like(placeId), {})
    return {
      liked: data?.data?.liked ?? false,
      likeCount: data?.data?.likeCount ?? null,
    }
  },

  /**
   * 내 좋아요 목록. GET /api/v1/places/likes?size=1000
   * @returns {Promise<Array>} PlaceResponse 배열 (placeId, title, addr1, firstImage1, categoryCode1/2, likeCount, liked)
   */
  async fetchLikes(size = 1000) {
    const { data } = await http.get(ENDPOINTS.tourism.likes, { size })
    return data?.data?.content ?? []
  },

  /**
   * AI 관광지 추천. POST /api/v1/places/ai
   * persona(자유 텍스트) + text(요청 문장)를 보내고, 추천 멘트와 관광지 0~5건을 받는다.
   *
   * @param {{ persona: string, text: string }} payload
   * @returns {Promise<{ text: string, content: PlaceItem[] }>}
   *   text     - AI 추천 멘트
   *   content  - PlaceResponse 배열 (placeId, title, addr1, firstImage1, categoryCode1/2, likeCount, liked)
   */
  async recommendAi({ persona, text }) {
    const { data } = await http.post(ENDPOINTS.tourism.ai, { persona, text })

    // 응답 구조: { success, message, data: { text, content } }
    if (!data?.success) {
      return Promise.reject({
        ok: false,
        message: data?.message ?? 'AI 추천 요청에 실패했습니다.',
        data: null,
      })
    }

    return {
      text: data.data?.text ?? '',
      content: data.data?.content ?? [],
    }
  },
}
