import { defineStore } from 'pinia'
import { authService } from '@/api/authService'
import { setAccessToken } from '@/api/httpClient'

const REFRESH_TOKEN_KEY = 'chapyo_refresh_token'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: null,
    loginOpen: false,
    initializing: true,
  }),
  getters: {
    isAuthed: (s) => !!s.user,
  },
  actions: {
    // Called by httpClient 401 interceptor (dynamic import) and by logout
    clearSession() {
      this.user = null
      this.accessToken = null
      setAccessToken(null)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    },

    _applyTokens({ accessToken, refreshToken, user }) {
      this.accessToken = accessToken
      this.user = user
      setAccessToken(accessToken)
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    },

    // Runs once on App mount — restores session from stored refresh token
    async initAuth() {
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
      if (storedRefreshToken) {
        try {
          const data = await authService.refresh(storedRefreshToken)
          // refresh endpoint may return a new refreshToken (rotation) or reuse old one
          this._applyTokens({
            ...data,
            refreshToken: data.refreshToken ?? storedRefreshToken,
          })
        } catch {
          this.clearSession()
        }
      }
      this.initializing = false
    },

    async login({ id, password }) {
      if (!id?.trim() || !password?.trim()) {
        return { ok: false, message: '아이디와 비밀번호를 입력해 주세요.' }
      }
      try {
        const data = await authService.login(id.trim(), password.trim())
        this._applyTokens(data)
        this.loginOpen = false
        return { ok: true }
      } catch (err) {
        // TODO: remove mock fallback once POST /auth/login is live
        this.user = { id: id.trim(), name: id.trim() }
        this.loginOpen = false
        return { ok: true }
      }
    },

    async register({ id, password, name }) {
      try {
        const data = await authService.register({ id: id.trim(), password, name: name.trim() })
        this._applyTokens(data)
        this.loginOpen = false
        return { ok: true }
      } catch (err) {
        return { ok: false, message: err?.message ?? '회원가입에 실패했습니다.' }
      }
    },

    async logout() {
      await authService.logout()
      this.clearSession()
    },

    openLogin() { this.loginOpen = true },
    closeLogin() { this.loginOpen = false },
  },
})
