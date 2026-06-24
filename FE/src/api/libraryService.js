import { http } from './httpClient'
import { ENDPOINTS } from './endpoints'

// BaseResponse<T> 래퍼를 벗겨 data만 반환.
function unwrap(res) {
  return res?.data?.data ?? null
}

export const libraryService = {
  // GET /api/v1/library?page&size&keyword → PageResponse<LibraryResponse> { content, hasNext }
  async list(page = 0, size = 10, keyword = '') {
    const params = { page, size }
    if (keyword) params.keyword = keyword
    const res = await http.get(ENDPOINTS.library.list, params)
    const data = unwrap(res) ?? {}
    return {
      items: data.content ?? [],
      hasNext: !!data.hasNext,
    }
  },

  // GET /api/v1/library/me?page&size&keyword → 내가 게시한 목록
  async listMine(page = 0, size = 10, keyword = '') {
    const params = { page, size }
    if (keyword) params.keyword = keyword
    const res = await http.get(ENDPOINTS.library.listMine, params)
    const data = unwrap(res) ?? {}
    return {
      items: data.content ?? [],
      hasNext: !!data.hasNext,
    }
  },

  // POST /api/v1/library → 내 여행을 라이브러리에 게시
  async post({ planId, title, description }) {
    await http.post(ENDPOINTS.library.post, { planId, title, description })
  },

  // GET /api/v1/library/{id} → 상세(아이템 + 이동 정보). 조회 시 viewCount 증가.
  async detail(id) {
    const res = await http.get(ENDPOINTS.library.detail(id))
    return unwrap(res)
  },

  // DELETE /api/v1/library/{id} → 내가 게시한 항목 삭제
  async remove(id) {
    await http.delete(ENDPOINTS.library.remove(id))
  },

  // POST /api/v1/library/{id}/import → 내 여행으로 불러오기(새 여행 생성)
  async import(id) {
    await http.post(ENDPOINTS.library.import(id))
  },
}
