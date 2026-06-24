export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://chapyo.duckdns.org'

export const ENDPOINTS = {
  auth: {
    login: '/api/v1/auth/login',
    logout: '/api/v1/auth/logout',
    reissue: '/api/v1/auth/reissue',
    signup: '/api/v1/auth/signup',
    password: '/api/v1/auth/password',
  },
  trips: {
    list: '/api/v1/trips',
    create: '/api/v1/trips',
    detail: (id) => `/api/v1/trips/${id}`,
    update: (id) => `/api/v1/trips/${id}`,
    remove: (id) => `/api/v1/trips/${id}`,
    items: (id) => `/api/v1/trips/${id}/items`,
    item: (id, itemId) => `/api/v1/trips/${id}/items/${itemId}`,
    itemOrders: (id) => `/api/v1/trips/${id}/items/orders`,
    itemPayer: (id, itemId) => `/api/v1/trips/${id}/items/${itemId}/payer`, // 비용 담당자 지정(BE 구현 예정)
    routes: (id) => `/api/v1/trips/${id}/routes`, // 아이템 간 이동 정보(소요시간/비용) 저장
    members: (id) => `/api/v1/trips/${id}/members`,
    member: (id, userId) => `/api/v1/trips/${id}/members/${userId}`,
    aiChat: (id) => `/api/v1/trips/${id}/ai/chat`,
  },
  library: {
    list: '/api/v1/library',
    listMine: '/api/v1/library/me',
    post: '/api/v1/library',
    detail: (id) => `/api/v1/library/${id}`,
    remove: (id) => `/api/v1/library/${id}`,
    import: (id) => `/api/v1/library/${id}/import`,
  },
  users: {
    me: '/api/v1/users/me',
    profile: '/api/v1/users/me/profile',
    password: '/api/v1/users/me/password',
  },
  tourism: {
    places: '/api/v1/places',
    detail: (placeId) => `/api/v1/places/${placeId}`,
    like: (placeId) => `/api/v1/places/${placeId}/likes`,
    likes: '/api/v1/places/likes',
    ai: '/api/v1/places/ai',
  },
  reviews: {
    list: (placeId) => `/api/v1/places/${placeId}/reviews`,
    create: (placeId) => `/api/v1/places/${placeId}/reviews`,
    update: (placeId, reviewId) => `/api/v1/places/${placeId}/reviews/${reviewId}`,
    remove: (placeId, reviewId) => `/api/v1/places/${placeId}/reviews/${reviewId}`,
    mine: '/api/v1/reviews/me',
  },
}
