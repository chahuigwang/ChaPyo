import { defineStore } from 'pinia'
import { authService } from '@/api/authService'
import { setAccessToken } from '@/api/httpClient'

const USER_KEY = 'chapyo_user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: null,
    loginOpen: false,
    initializing: true,
    _pendingLogin: null,
  }),
  getters: {
    isAuthed: (s) => !!s.user,
  },
  actions: {
    // Called by httpClient 401 interceptor (dynamic import) and by logout
    clearSession() {
      this.user = null
      this.accessToken = null
      this._pendingLogin = null
      setAccessToken(null)
      localStorage.removeItem(USER_KEY)
    },

    _applyTokens({ accessToken, user }) {
      this.accessToken = accessToken
      this.user = user
      setAccessToken(accessToken)
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    },

    // Runs once on App mount — HttpOnly 쿠키로 Access Token 재발급 후 유저 정보 복원
    async initAuth() {
      try {
        const accessToken = await authService.reissue()
        setAccessToken(accessToken)

        let user = null
        try {
          user = await authService.getMe()
        } catch {
          const stored = localStorage.getItem(USER_KEY)
          user = stored ? JSON.parse(stored) : null
        }

        if (!user) throw new Error('no user info')
        this._applyTokens({ accessToken, user })
      } catch {
        this.clearSession()
      }
      this.initializing = false
    },

    async login({ id, password }) {
      if (!id?.trim() || !password?.trim()) {
        return { ok: false, message: '이메일과 비밀번호를 입력해 주세요.' }
      }
      try {
        const data = await authService.login(id.trim(), password.trim())
        // 즉시 커밋하지 않고 pendingLogin에 저장 — 폼 애니메이션 후 commitLogin()으로 적용
        this._pendingLogin = {
          accessToken: data.accessToken,
          user: { nickname: data.nickname, email: data.email ?? id.trim() },
        }
        return { ok: true }
      } catch (err) {
        return { ok: false, message: err?.message ?? '로그인에 실패했습니다.' }
      }
    },

    commitLogin() {
      if (!this._pendingLogin) return
      this._applyTokens(this._pendingLogin)
      this._pendingLogin = null
      this.loginOpen = false
    },

    // id(email), name(nickname) → BE SignupRequest { nickname, email, password }
    async register({ id, password, name }) {
      try {
        await authService.signup({ nickname: name.trim(), email: id.trim(), password })
        return { ok: true }
      } catch (err) {
        return { ok: false, message: err?.message ?? '회원가입에 실패했습니다.' }
      }
    },

    async logout() {
      await authService.logout()
      this.clearSession()
    },

    // BE PasswordResetRequest { nickname, email, newPassword }
    async resetPassword({ nickname, email, newPassword }) {
      try {
        await authService.resetPassword({ nickname, email, newPassword })
        return { ok: true }
      } catch (err) {
        return { ok: false, message: err?.message ?? '비밀번호 재설정에 실패했습니다.' }
      }
    },

    updateUser(patch) {
      if (!this.user) return
      this.user = { ...this.user, ...patch }
    },

    openLogin() { this.loginOpen = true },
    closeLogin() { this.loginOpen = false },
  },
})
