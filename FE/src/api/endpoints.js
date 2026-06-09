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
    items: (id) => `/api/v1/trips/${id}/items`,
    members: (id) => `/api/v1/trips/${id}/members`,
  },
  users: {
    me: '/api/v1/users/me',
    profile: '/api/v1/users/me/profile',
    password: '/api/v1/users/me/password',
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
