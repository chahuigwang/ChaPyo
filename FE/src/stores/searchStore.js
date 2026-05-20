import { defineStore } from 'pinia'

// 검색 패널 전용 상태.
// 개인 상태(Personal State): 다른 사용자와 동기화되지 않음.
// 사이드바 검색 패널에서 사용하는 필터, 결과는 본인 화면에서만 의미가 있다.
// 보관함(StorageStore)으로 보낸 뒤에야 워크스페이스 흐름에 진입한다.

// 시/도 → 구/군 매핑 (Mock)
export const PROVINCES = [
  {
    id: 'seoul',
    label: '서울특별시',
    districts: [
      { id: 'jongno', label: '종로구' },
      { id: 'jung', label: '중구' },
      { id: 'mapo', label: '마포구' },
      { id: 'gangnam', label: '강남구' },
    ],
  },
  {
    id: 'busan',
    label: '부산광역시',
    districts: [
      { id: 'haeundae', label: '해운대구' },
      { id: 'suyeong', label: '수영구' },
      { id: 'jung-bs', label: '중구' },
    ],
  },
  {
    id: 'jeju',
    label: '제주특별자치도',
    districts: [
      { id: 'jeju-city', label: '제주시' },
      { id: 'seogwipo', label: '서귀포시' },
    ],
  },
  {
    id: 'gangwon',
    label: '강원특별자치도',
    districts: [
      { id: 'gangneung', label: '강릉시' },
      { id: 'sokcho', label: '속초시' },
      { id: 'pyeongchang', label: '평창군' },
    ],
  },
]

export const PLACE_TYPES = [
  { id: 'attraction', label: '관광지', category: 'place' },
  { id: 'culture', label: '문화시설', category: 'place' },
  { id: 'festival', label: '축제·공연', category: 'place' },
  { id: 'food', label: '음식점', category: 'food' },
  { id: 'lodging', label: '숙소', category: 'lodging' },
  { id: 'shopping', label: '쇼핑', category: 'place' },
]

// Mock 데이터: 한국관광공사 API 응답을 흉내내는 형식
const MOCK_RESULTS = [
  { id: 'p1', name: '경복궁', province: 'seoul', district: 'jongno', type: 'attraction', address: '서울 종로구 사직로 161', cost: 3000 },
  { id: 'p2', name: '북촌 한옥마을', province: 'seoul', district: 'jongno', type: 'culture', address: '서울 종로구 계동길', cost: 0 },
  { id: 'p3', name: '광장시장', province: 'seoul', district: 'jung', type: 'food', address: '서울 종로구 창경궁로 88', cost: 15000 },
  { id: 'p4', name: 'N서울타워', province: 'seoul', district: 'jung', type: 'attraction', address: '서울 용산구 남산공원길 105', cost: 16000 },
  { id: 'p5', name: '롯데월드몰', province: 'seoul', district: 'gangnam', type: 'shopping', address: '서울 송파구 올림픽로 300', cost: 0 },
  { id: 'p6', name: '해운대 해수욕장', province: 'busan', district: 'haeundae', type: 'attraction', address: '부산 해운대구 해운대해변로', cost: 0 },
  { id: 'p7', name: '광안리 더베이101', province: 'busan', district: 'suyeong', type: 'food', address: '부산 수영구 광안해변로 219', cost: 25000 },
  { id: 'p8', name: '성산일출봉', province: 'jeju', district: 'seogwipo', type: 'attraction', address: '제주 서귀포시 성산읍', cost: 5000 },
  { id: 'p9', name: '제주 흑돼지 거리', province: 'jeju', district: 'jeju-city', type: 'food', address: '제주 제주시 관덕로', cost: 35000 },
  { id: 'p10', name: '강릉 안목해변 카페거리', province: 'gangwon', district: 'gangneung', type: 'food', address: '강원 강릉시 창해로', cost: 8000 },
  { id: 'p11', name: '속초 중앙시장', province: 'gangwon', district: 'sokcho', type: 'food', address: '강원 속초시 중앙로147번길', cost: 12000 },
  { id: 'p12', name: '오대산 월정사', province: 'gangwon', district: 'pyeongchang', type: 'culture', address: '강원 평창군 진부면', cost: 0 },
]

function typeToCategory(typeId) {
  const t = PLACE_TYPES.find((x) => x.id === typeId)
  return t?.category ?? 'place'
}

export const useSearchStore = defineStore('search', {
  state: () => ({
    keyword: '',
    provinceId: '',
    districtId: '',
    typeId: '',
    results: [],
    loading: false,
    searched: false,
  }),
  getters: {
    districts(state) {
      const p = PROVINCES.find((x) => x.id === state.provinceId)
      return p?.districts ?? []
    },
  },
  actions: {
    setProvince(id) {
      this.provinceId = id
      this.districtId = ''
    },
    setDistrict(id) { this.districtId = id },
    setType(id) { this.typeId = id },
    setKeyword(v) { this.keyword = v },
    resetFilters() {
      this.keyword = ''
      this.provinceId = ''
      this.districtId = ''
      this.typeId = ''
    },
    // Mock 검색. 백엔드 연동 시 tripService.searchPlaces 등으로 교체.
    async search() {
      this.loading = true
      try {
        await new Promise((r) => setTimeout(r, 250))
        const kw = this.keyword.trim().toLowerCase()
        this.results = MOCK_RESULTS.filter((r) => {
          if (this.provinceId && r.province !== this.provinceId) return false
          if (this.districtId && r.district !== this.districtId) return false
          if (this.typeId && r.type !== this.typeId) return false
          if (kw && !r.name.toLowerCase().includes(kw) && !r.address.toLowerCase().includes(kw)) return false
          return true
        }).map((r) => ({ ...r, category: typeToCategory(r.type) }))
        this.searched = true
      } finally {
        this.loading = false
      }
    },
  },
})
