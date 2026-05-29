// API 엔드포인트 상수. 모든 호출은 이 파일을 통해서만 URI 를 알 수 있다.
// 백엔드(Spring Boot) 와 협업 시 단일 소스 오브 트루스 역할.

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://chapyo.duckdns.org'

export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  trips: {
    list: '/trips',
    create: '/trips',
    detail: (id) => `/trips/${id}`,
    update: (id) => `/trips/${id}`,
    remove: (id) => `/trips/${id}`,
    // 협업 동기화 (SSE/Smart Polling 후보 엔드포인트)
    sync: (id) => `/trips/${id}/sync`,
    stream: (id) => `/trips/${id}/stream`,
    items: (id) => `/trips/${id}/items`,
    item: (id, itemId) => `/trips/${id}/items/${itemId}`,
    invite: (id) => `/trips/${id}/invite`,
  },
  tourism: {
    // 한국관광공사 API 프록시 경로 (백엔드 서버 경유)
    places: '/api/v1/places',
    detail: (contentId) => `/tourism/detail/${contentId}`,
    keyword: '/tourism/search',
  },
  ai: {
    recommend: '/ai/recommend',
  },
}
