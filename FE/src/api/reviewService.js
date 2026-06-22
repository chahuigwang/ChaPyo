import { http } from './httpClient'
import { ENDPOINTS } from './endpoints'

/**
 * 장소 리뷰 단건
 * @typedef {Object} ReviewItem
 * @property {number} reviewId
 * @property {number} placeId
 * @property {number} userId
 * @property {string} nickname
 * @property {string} content
 * @property {number} rating    - 1~5 별점
 * @property {string} createdAt
 */

export const reviewService = {
  /**
   * 리뷰 목록 조회. GET /api/v1/places/{placeId}/reviews
   * @returns {Promise<{ content: ReviewItem[], hasNext: boolean }>}
   */
  async list(placeId, { page = 0, size = 10 } = {}) {
    const { data } = await http.get(ENDPOINTS.reviews.list(placeId), { page, size })
    return {
      content: data?.data?.content ?? [],
      hasNext: data?.data?.hasNext ?? false,
    }
  },

  /**
   * 리뷰 작성. POST /api/v1/places/{placeId}/reviews
   * @param {{ content: string, rating: number }} body
   */
  async create(placeId, { content, rating }) {
    await http.post(ENDPOINTS.reviews.create(placeId), { content, rating })
  },

  /**
   * 리뷰 수정. PUT /api/v1/places/{placeId}/reviews/{reviewId}
   */
  async update(placeId, reviewId, { content, rating }) {
    await http.put(ENDPOINTS.reviews.update(placeId, reviewId), { content, rating })
  },

  /**
   * 리뷰 삭제. DELETE /api/v1/places/{placeId}/reviews/{reviewId}
   */
  async remove(placeId, reviewId) {
    await http.delete(ENDPOINTS.reviews.remove(placeId, reviewId))
  },

  /**
   * 내가 쓴 리뷰 목록. GET /api/v1/reviews/me?page&size
   * @returns {Promise<{ content: Array, hasNext: boolean }>}
   *   content: { reviewId, placeId, placeTitle, placeImage, content, rating, createdAt }
   */
  async mine({ page = 0, size = 50 } = {}) {
    const { data } = await http.get(ENDPOINTS.reviews.mine, { page, size })
    return {
      content: data?.data?.content ?? [],
      hasNext: data?.data?.hasNext ?? false,
    }
  },
}
