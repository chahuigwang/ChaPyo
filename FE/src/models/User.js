// 사용자 모델. 협업 시 collaboratorIds 와 매칭되는 단위.
export class User {
  constructor({ id, name = '', email = '', avatarUrl = '', role = 'member' } = {}) {
    this.id = id ?? null
    this.name = name
    this.email = email
    this.avatarUrl = avatarUrl
    this.role = role // 'owner' | 'editor' | 'member'
  }

  static fromJSON(raw = {}) { return new User(raw) }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      avatarUrl: this.avatarUrl,
      role: this.role,
    }
  }

  get isOwner() { return this.role === 'owner' }
  get canEdit() { return this.role === 'owner' || this.role === 'editor' }
  get initials() {
    return this.name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0].toUpperCase())
      .join('') || '?'
  }
}
