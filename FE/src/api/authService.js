import { http } from './httpClient'
import { ENDPOINTS } from './endpoints'

export const authService = {
  async login(id, password) {
    const { data } = await http.post(ENDPOINTS.auth.login, { id, password })
    return data // { accessToken, refreshToken, user: { id, name, email } }
  },

  async register({ id, password, name }) {
    const { data } = await http.post(ENDPOINTS.auth.register, { id, password, name })
    return data // { accessToken, refreshToken, user }
  },

  async refresh(refreshToken) {
    const { data } = await http.post(ENDPOINTS.auth.refresh, { refreshToken })
    return data // { accessToken, refreshToken? }
  },

  async me() {
    const { data } = await http.get(ENDPOINTS.auth.me)
    return data // user object
  },

  async logout() {
    await http.post(ENDPOINTS.auth.logout, {}).catch(() => {})
  },
}
