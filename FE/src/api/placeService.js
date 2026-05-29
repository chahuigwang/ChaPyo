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
}
