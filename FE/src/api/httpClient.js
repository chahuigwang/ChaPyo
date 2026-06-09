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

// Access Token 재발급을 single-flight 로 묶는다.
// 동시에 여러 요청이 401을 받아도 reissue 는 한 번만 호출 → refresh 토큰 회전 경합 방지.
let _refreshPromise = null
function reissueAccessToken() {
  if (!_refreshPromise) {
    _refreshPromise = axios
      .post(
        `${API_BASE}${ENDPOINTS.auth.reissue}`,
        {},
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true },
      )
      .then((res) => {
        const token = res.data?.data?.accessToken ?? null
        setAccessToken(token)
        return token
      })
      .finally(() => { _refreshPromise = null })
  }
  return _refreshPromise
}

httpClient.interceptors.response.use(normalizeSuccess, async (err) => {
  const original = err.config

  // 401 시 HttpOnly 쿠키로 Access Token 재발급 시도 (동시 401 은 하나의 reissue 를 공유)
  if (err.response?.status === 401 && original && !original._retry) {
    original._retry = true
    try {
      const accessToken = await reissueAccessToken()
      if (!accessToken) throw new Error('reissue failed')
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
