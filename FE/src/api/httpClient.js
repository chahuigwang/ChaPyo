import axios from 'axios'
import { API_BASE, ENDPOINTS } from './endpoints'

// Access token lives in memory. authStore calls setAccessToken() after login/refresh.
// This avoids a circular import: httpClient never imports authStore.
let _accessToken = null
export function setAccessToken(token) { _accessToken = token }

export const httpClient = axios.create({
  baseURL: API_BASE,
  timeout: 10_000,
  withCredentials: true, // refreshToken HttpOnly 쿠키 자동 전송
  headers: { 'Content-Type': 'application/json' },
})

httpClient.interceptors.request.use((config) => {
  if (_accessToken) config.headers.Authorization = `Bearer ${_accessToken}`
  return config
})

function normalizeSuccess(res) {
  return {
    data: res.data,
    sync: {
      version: res.headers['x-resource-version'] ?? null,
      lastSyncTime: res.headers['x-last-sync-time'] ?? null,
    },
    status: res.status,
  }
}

function normalizeError(err) {
  return Promise.reject({
    ok: false,
    status: err.response?.status ?? 0,
    message: err.response?.data?.message ?? err.message ?? 'Network Error',
    data: err.response?.data ?? null,
  })
}

httpClient.interceptors.response.use(normalizeSuccess, async (err) => {
  const original = err.config

  // 401 시 HttpOnly 쿠키로 Access Token 재발급 시도
  if (err.response?.status === 401 && !original._retry) {
    original._retry = true
    try {
      const res = await axios.post(
        `${API_BASE}${ENDPOINTS.auth.reissue}`,
        {},
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true },
      )
      const accessToken = res.data?.data?.accessToken
      setAccessToken(accessToken)
      original.headers.Authorization = `Bearer ${accessToken}`
      return httpClient(original)
    } catch {
      setAccessToken(null)
      // Dynamic import to avoid circular dependency
      const { useAuthStore } = await import('@/stores/authStore')
      useAuthStore().clearSession()
    }
  }

  return normalizeError(err)
})

export const http = {
  get: (url, params) => httpClient.get(url, { params }),
  post: (url, body) => httpClient.post(url, body),
  put: (url, body) => httpClient.put(url, body),
  patch: (url, body) => httpClient.patch(url, body),
  delete: (url) => httpClient.delete(url),
}
