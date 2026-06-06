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
    list: '/trips',
    create: '/trips',
    detail: (id) => `/trips/${id}`,
    update: (id) => `/trips/${id}`,
    remove: (id) => `/trips/${id}`,
    sync: (id) => `/trips/${id}/sync`,
    stream: (id) => `/trips/${id}/stream`,
    items: (id) => `/trips/${id}/items`,
    item: (id, itemId) => `/trips/${id}/items/${itemId}`,
    invite: (id) => `/trips/${id}/invite`,
  },
  users: {
    me: '/api/v1/users/me',
  },
  tourism: {
    places: '/api/v1/places',
    detail: (contentId) => `/tourism/detail/${contentId}`,
    keyword: '/tourism/search',
  },
  ai: {
    recommend: '/ai/recommend',
  },
}
