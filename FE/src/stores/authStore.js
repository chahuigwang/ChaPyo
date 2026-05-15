import { defineStore } from 'pinia'

// Mock 인증. 백엔드 연동 전까지 어떤 id/pw도 통과시킨다.
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null, // { id, name } | null
    loginOpen: false,
  }),
  getters: {
    isAuthed: (s) => !!s.user,
  },
  actions: {
    openLogin() { this.loginOpen = true },
    closeLogin() { this.loginOpen = false },
    async login({ id, password }) {
      if (!id?.trim() || !password?.trim()) {
        return { ok: false, message: '아이디와 비밀번호를 입력해 주세요.' }
      }
      await new Promise((r) => setTimeout(r, 300))
      this.user = { id: id.trim(), name: id.trim() }
      this.loginOpen = false
      return { ok: true }
    },
    logout() {
      this.user = null
    },
  },
})
