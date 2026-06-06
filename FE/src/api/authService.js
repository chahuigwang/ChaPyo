import { http } from './httpClient'
import { ENDPOINTS } from './endpoints'

export const authService = {
  // 로그인: BaseResponse { data: { accessToken, nickname, email } }
  async login(email, password) {
    const { data } = await http.post(ENDPOINTS.auth.login, { email, password })
    return data?.data // { accessToken, nickname, email }
  },

  // 회원가입: 201 + BaseResponse { success, data: { nickname, email } }
  async signup({ nickname, email, password }) {
    const { data } = await http.post(ENDPOINTS.auth.signup, { nickname, email, password })
    return data?.data
  },

  // Access Token 재발급: HttpOnly 쿠키의 refreshToken 자동 전송
  // 응답: BaseResponse { success, data: { accessToken } }
  async reissue() {
    const { data } = await http.post(ENDPOINTS.auth.reissue, {})
    return data?.data?.accessToken
  },

  async getMe() {
    const { data } = await http.get(ENDPOINTS.users.me)
    return data?.data // { nickname, email }
  },

  async logout() {
    await http.post(ENDPOINTS.auth.logout, {}).catch(() => {})
  },

  // 비밀번호 재설정
  async resetPassword({ nickname, email, newPassword }) {
    await http.post(ENDPOINTS.auth.password, { nickname, email, newPassword })
  },
}
