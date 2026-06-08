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

  // 내 정보 수정: { nickname, email }
  async updateProfile({ nickname, email }) {
    const { data } = await http.patch(ENDPOINTS.users.profile, { nickname, email })
    return data
  },

  // 비밀번호 변경: { currentPassword, newPassword }
  async updatePassword({ currentPassword, newPassword }) {
    const { data } = await http.patch(ENDPOINTS.users.password, { currentPassword, newPassword })
    return data
  },

  // 회원 탈퇴
  async deleteAccount() {
    await http.delete(ENDPOINTS.users.me)
  },

  async logout() {
    await http.post(ENDPOINTS.auth.logout, {}).catch(() => {})
  },

  // 비밀번호 재설정 (미로그인 상태)
  async resetPassword({ nickname, email, newPassword }) {
    await http.post(ENDPOINTS.auth.password, { nickname, email, newPassword })
  },
}
