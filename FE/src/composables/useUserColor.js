// 사용자별 결정적 색상. userId(없으면 닉네임)로 해시해 팔레트에서 고른다.
// 멤버 아바타(ProfileFlyout)와 '추가한 사람' 칩(PlaceCard)이 같은 색을 쓰도록 공용.
const PALETTE = [
  '#00B7EB', '#F59E0B', '#10B981', '#A855F7',
  '#EF4444', '#3B82F6', '#EC4899', '#14B8A6',
]

export function colorForUser(key) {
  if (key == null || key === '') return PALETTE[0]
  const s = String(key)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

export function useUserColor() {
  return { colorForUser, palette: PALETTE }
}
