import axios from 'axios'
import { API_BASE } from './endpoints'

export const httpClient = axios.create({
  baseURL: API_BASE,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

httpClient.interceptors.response.use(
  (res) => ({
    data: res.data,
    sync: {
      version: res.headers['x-resource-version'] ?? null,
      lastSyncTime: res.headers['x-last-sync-time'] ?? null,
    },
    status: res.status,
  }),
  (err) => Promise.reject({
    ok: false,
    status: err.response?.status ?? 0,
    message: err.response?.data?.message ?? err.message ?? 'Network Error',
    data: err.response?.data ?? null,
  })
)

export const http = {
  get: (url, params) => httpClient.get(url, { params }),
  post: (url, body) => httpClient.post(url, body),
  put: (url, body) => httpClient.put(url, body),
  patch: (url, body) => httpClient.patch(url, body),
  delete: (url) => httpClient.delete(url),
}
