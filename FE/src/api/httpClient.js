import axios from 'axios'
import { API_BASE, ENDPOINTS } from './endpoints'

const REFRESH_TOKEN_KEY = 'chapyo_refresh_token'

// Access token lives in memory. authStore calls setAccessToken() after login/refresh.
// This avoids a circular import: httpClient never imports authStore.
let _accessToken = null
export function setAccessToken(token) { _accessToken = token }

export const httpClient = axios.create({
  baseURL: API_BASE,
  timeout: 10_000,
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

  // Attempt silent token refresh on first 401
  if (err.response?.status === 401 && !original._retry) {
    original._retry = true
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

    if (storedRefreshToken) {
      try {
        // Call refresh directly via axios to bypass the normalizer wrapping
        const res = await axios.post(
          `${API_BASE}${ENDPOINTS.auth.refresh}`,
          { refreshToken: storedRefreshToken },
          { headers: { 'Content-Type': 'application/json' } },
        )
        const { accessToken, refreshToken: newRefresh } = res.data
        setAccessToken(accessToken)
        if (newRefresh) localStorage.setItem(REFRESH_TOKEN_KEY, newRefresh)

        original.headers.Authorization = `Bearer ${accessToken}`
        return httpClient(original)
      } catch {
        setAccessToken(null)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        // Dynamic import to avoid circular dependency
        const { useAuthStore } = await import('@/stores/authStore')
        useAuthStore().clearSession()
      }
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
