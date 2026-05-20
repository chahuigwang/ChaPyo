import axios from 'axios'
import { API_BASE } from './endpoints'

// 베이스 Axios 인스턴스. UI/Store 는 절대 axios 를 직접 import 하지 않는다.
export const httpClient = axios.create({
  baseURL: API_BASE,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// 인증 토큰 주입 (추후 authStore 연동)
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 응답 표준화: data 만 unwrap, 협업용 동기 메타(version, lastSyncTime) 는 보존
httpClient.interceptors.response.use(
  (res) => {
    const sync = {
      version: res.headers['x-resource-version'] ?? null,
      lastSyncTime: res.headers['x-last-sync-time'] ?? null,
    }
    return { data: res.data, sync, status: res.status }
  },
  (err) => {
    const payload = {
      ok: false,
      status: err.response?.status ?? 0,
      message: err.response?.data?.message ?? err.message ?? 'Network Error',
      data: err.response?.data ?? null,
    }
    return Promise.reject(payload)
  }
)

// 편의 메서드. 모든 서비스 모듈은 이걸 통해서만 요청한다.
export const http = {
  get: (url, params) => httpClient.get(url, { params }),
  post: (url, body) => httpClient.post(url, body),
  put: (url, body) => httpClient.put(url, body),
  patch: (url, body) => httpClient.patch(url, body),
  delete: (url) => httpClient.delete(url),
}
