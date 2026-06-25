import { defineStore } from 'pinia'
import { placeService } from '@/api/placeService'

// 검색 패널 전용 상태.
// 개인 상태(Personal State): 다른 사용자와 동기화되지 않음.
// 사이드바 검색 패널에서 사용하는 필터, 결과는 본인 화면에서만 의미가 있다.
// 보관함(StorageStore)으로 보낸 뒤에야 워크스페이스 흐름에 진입한다.

// 시/도 → 구/군 매핑 (init_data.json hierarchicalAreas 기반)
export const PROVINCES = [
  { id: '11', label: '서울특별시', districts: [{ id: '110', label: '종로구' }, { id: '140', label: '중구' }, { id: '170', label: '용산구' }, { id: '200', label: '성동구' }, { id: '215', label: '광진구' }, { id: '230', label: '동대문구' }, { id: '260', label: '중랑구' }, { id: '290', label: '성북구' }, { id: '305', label: '강북구' }, { id: '320', label: '도봉구' }, { id: '350', label: '노원구' }, { id: '380', label: '은평구' }, { id: '410', label: '서대문구' }, { id: '440', label: '마포구' }, { id: '470', label: '양천구' }, { id: '500', label: '강서구' }, { id: '530', label: '구로구' }, { id: '545', label: '금천구' }, { id: '560', label: '영등포구' }, { id: '590', label: '동작구' }, { id: '620', label: '관악구' }, { id: '650', label: '서초구' }, { id: '680', label: '강남구' }, { id: '710', label: '송파구' }, { id: '740', label: '강동구' }] },
  { id: '26', label: '부산광역시', districts: [{ id: '110', label: '중구' }, { id: '140', label: '서구' }, { id: '170', label: '동구' }, { id: '200', label: '영도구' }, { id: '230', label: '부산진구' }, { id: '260', label: '동래구' }, { id: '290', label: '남구' }, { id: '320', label: '북구' }, { id: '350', label: '해운대구' }, { id: '380', label: '사하구' }, { id: '410', label: '금정구' }, { id: '440', label: '강서구' }, { id: '470', label: '연제구' }, { id: '500', label: '수영구' }, { id: '530', label: '사상구' }, { id: '710', label: '기장군' }] },
  { id: '27', label: '대구광역시', districts: [{ id: '110', label: '중구' }, { id: '140', label: '동구' }, { id: '170', label: '서구' }, { id: '200', label: '남구' }, { id: '230', label: '북구' }, { id: '260', label: '수성구' }, { id: '290', label: '달서구' }, { id: '710', label: '달성군' }, { id: '720', label: '군위군' }] },
  { id: '28', label: '인천광역시', districts: [{ id: '110', label: '중구' }, { id: '140', label: '동구' }, { id: '177', label: '미추홀구' }, { id: '185', label: '연수구' }, { id: '200', label: '남동구' }, { id: '237', label: '부평구' }, { id: '245', label: '계양구' }, { id: '260', label: '서구' }, { id: '710', label: '강화군' }, { id: '720', label: '옹진군' }] },
  { id: '29', label: '광주광역시', districts: [{ id: '110', label: '동구' }, { id: '140', label: '서구' }, { id: '155', label: '남구' }, { id: '170', label: '북구' }, { id: '200', label: '광산구' }] },
  { id: '30', label: '대전광역시', districts: [{ id: '110', label: '동구' }, { id: '140', label: '중구' }, { id: '170', label: '서구' }, { id: '200', label: '유성구' }, { id: '230', label: '대덕구' }] },
  { id: '31', label: '울산광역시', districts: [{ id: '110', label: '중구' }, { id: '140', label: '남구' }, { id: '170', label: '동구' }, { id: '200', label: '북구' }, { id: '710', label: '울주군' }] },
  { id: '36110', label: '세종특별자치시', districts: [{ id: '36110', label: '세종특별자치시' }] },
  { id: '41', label: '경기도', districts: [{ id: '110', label: '수원시' }, { id: '111', label: '수원시 장안구' }, { id: '113', label: '수원시 권선구' }, { id: '115', label: '수원시 팔달구' }, { id: '117', label: '수원시 영통구' }, { id: '130', label: '성남시' }, { id: '131', label: '성남시 수정구' }, { id: '133', label: '성남시 중원구' }, { id: '135', label: '성남시 분당구' }, { id: '150', label: '의정부시' }, { id: '170', label: '안양시' }, { id: '171', label: '안양시 만안구' }, { id: '173', label: '안양시 동안구' }, { id: '190', label: '부천시' }, { id: '192', label: '부천시 원미구' }, { id: '194', label: '부천시 소사구' }, { id: '196', label: '부천시 오정구' }, { id: '210', label: '광명시' }, { id: '220', label: '평택시' }, { id: '250', label: '동두천시' }, { id: '270', label: '안산시' }, { id: '271', label: '안산시 상록구' }, { id: '273', label: '안산시 단원구' }, { id: '280', label: '고양시' }, { id: '281', label: '고양시 덕양구' }, { id: '285', label: '고양시 일산동구' }, { id: '287', label: '고양시 일산서구' }, { id: '290', label: '과천시' }, { id: '310', label: '구리시' }, { id: '360', label: '남양주시' }, { id: '370', label: '오산시' }, { id: '390', label: '시흥시' }, { id: '410', label: '군포시' }, { id: '430', label: '의왕시' }, { id: '450', label: '하남시' }, { id: '460', label: '용인시' }, { id: '461', label: '용인시 처인구' }, { id: '463', label: '용인시 기흥구' }, { id: '465', label: '용인시 수지구' }, { id: '480', label: '파주시' }, { id: '500', label: '이천시' }, { id: '550', label: '안성시' }, { id: '570', label: '김포시' }, { id: '590', label: '화성시' }, { id: '591', label: '화성시 만세구' }, { id: '593', label: '화성시 효행구' }, { id: '595', label: '화성시 병점구' }, { id: '597', label: '화성시 동탄구' }, { id: '610', label: '광주시' }, { id: '630', label: '양주시' }, { id: '650', label: '포천시' }, { id: '670', label: '여주시' }, { id: '800', label: '연천군' }, { id: '820', label: '가평군' }, { id: '830', label: '양평군' }] },
  { id: '43', label: '충청북도', districts: [{ id: '110', label: '청주시' }, { id: '111', label: '청주시 상당구' }, { id: '112', label: '청주시 서원구' }, { id: '113', label: '청주시 흥덕구' }, { id: '114', label: '청주시 청원구' }, { id: '130', label: '충주시' }, { id: '150', label: '제천시' }, { id: '720', label: '보은군' }, { id: '730', label: '옥천군' }, { id: '740', label: '영동군' }, { id: '745', label: '증평군' }, { id: '750', label: '진천군' }, { id: '760', label: '괴산군' }, { id: '770', label: '음성군' }, { id: '800', label: '단양군' }] },
  { id: '44', label: '충청남도', districts: [{ id: '130', label: '천안시' }, { id: '131', label: '천안시 동남구' }, { id: '133', label: '천안시 서북구' }, { id: '150', label: '공주시' }, { id: '180', label: '보령시' }, { id: '200', label: '아산시' }, { id: '210', label: '서산시' }, { id: '230', label: '논산시' }, { id: '250', label: '계룡시' }, { id: '270', label: '당진시' }, { id: '710', label: '금산군' }, { id: '760', label: '부여군' }, { id: '770', label: '서천군' }, { id: '790', label: '청양군' }, { id: '800', label: '홍성군' }, { id: '810', label: '예산군' }, { id: '825', label: '태안군' }] },
  { id: '46', label: '전라남도', districts: [{ id: '110', label: '목포시' }, { id: '130', label: '여수시' }, { id: '150', label: '순천시' }, { id: '170', label: '나주시' }, { id: '230', label: '광양시' }, { id: '710', label: '담양군' }, { id: '720', label: '곡성군' }, { id: '730', label: '구례군' }, { id: '770', label: '고흥군' }, { id: '780', label: '보성군' }, { id: '790', label: '화순군' }, { id: '800', label: '장흥군' }, { id: '810', label: '강진군' }, { id: '820', label: '해남군' }, { id: '830', label: '영암군' }, { id: '840', label: '무안군' }, { id: '860', label: '함평군' }, { id: '870', label: '영광군' }, { id: '880', label: '장성군' }, { id: '890', label: '완도군' }, { id: '900', label: '진도군' }, { id: '910', label: '신안군' }] },
  { id: '47', label: '경상북도', districts: [{ id: '110', label: '포항시' }, { id: '111', label: '포항시 남구' }, { id: '113', label: '포항시 북구' }, { id: '130', label: '경주시' }, { id: '150', label: '김천시' }, { id: '170', label: '안동시' }, { id: '190', label: '구미시' }, { id: '210', label: '영주시' }, { id: '230', label: '영천시' }, { id: '250', label: '상주시' }, { id: '280', label: '문경시' }, { id: '290', label: '경산시' }, { id: '730', label: '의성군' }, { id: '750', label: '청송군' }, { id: '760', label: '영양군' }, { id: '770', label: '영덕군' }, { id: '820', label: '청도군' }, { id: '830', label: '고령군' }, { id: '840', label: '성주군' }, { id: '850', label: '칠곡군' }, { id: '900', label: '예천군' }, { id: '920', label: '봉화군' }, { id: '930', label: '울진군' }, { id: '940', label: '울릉군' }] },
  { id: '48', label: '경상남도', districts: [{ id: '120', label: '창원시' }, { id: '121', label: '창원시 의창구' }, { id: '123', label: '창원시 성산구' }, { id: '125', label: '창원시 마산합포구' }, { id: '127', label: '창원시 마산회원구' }, { id: '129', label: '창원시 진해구' }, { id: '170', label: '진주시' }, { id: '220', label: '통영시' }, { id: '240', label: '사천시' }, { id: '250', label: '김해시' }, { id: '270', label: '밀양시' }, { id: '310', label: '거제시' }, { id: '330', label: '양산시' }, { id: '720', label: '의령군' }, { id: '730', label: '함안군' }, { id: '740', label: '창녕군' }, { id: '820', label: '고성군' }, { id: '840', label: '남해군' }, { id: '850', label: '하동군' }, { id: '860', label: '산청군' }, { id: '870', label: '함양군' }, { id: '880', label: '거창군' }, { id: '890', label: '합천군' }] },
  { id: '50', label: '제주특별자치도', districts: [{ id: '110', label: '제주시' }, { id: '130', label: '서귀포시' }] },
  { id: '51', label: '강원특별자치도', districts: [{ id: '110', label: '춘천시' }, { id: '130', label: '원주시' }, { id: '150', label: '강릉시' }, { id: '170', label: '동해시' }, { id: '190', label: '태백시' }, { id: '210', label: '속초시' }, { id: '230', label: '삼척시' }, { id: '720', label: '홍천군' }, { id: '730', label: '횡성군' }, { id: '750', label: '영월군' }, { id: '760', label: '평창군' }, { id: '770', label: '정선군' }, { id: '780', label: '철원군' }, { id: '790', label: '화천군' }, { id: '800', label: '양구군' }, { id: '810', label: '인제군' }, { id: '820', label: '고성군' }, { id: '830', label: '양양군' }] },
  { id: '52', label: '전북특별자치도', districts: [{ id: '110', label: '전주시' }, { id: '111', label: '전주시 완산구' }, { id: '113', label: '전주시 덕진구' }, { id: '130', label: '군산시' }, { id: '140', label: '익산시' }, { id: '180', label: '정읍시' }, { id: '190', label: '남원시' }, { id: '210', label: '김제시' }, { id: '710', label: '완주군' }, { id: '720', label: '진안군' }, { id: '730', label: '무주군' }, { id: '740', label: '장수군' }, { id: '750', label: '임실군' }, { id: '770', label: '순창군' }, { id: '790', label: '고창군' }, { id: '800', label: '부안군' }] },
]

// 관광 카테고리 (init_data.json hierarchicalCategories 기반)
// 부모 카테고리 + 자식 카테고리를 플랫하게 노출. label은 부모 prefix 없이 원본 유지.
export const PLACE_TYPES = [
  // 숙박
  { id: 'AC', label: '숙박', category: 'lodging', isParent: true },
  { id: 'AC01', label: '호텔', category: 'lodging', parentId: 'AC' },
  { id: 'AC02', label: '콘도미니엄', category: 'lodging', parentId: 'AC' },
  { id: 'AC03', label: '펜션/민박', category: 'lodging', parentId: 'AC' },
  { id: 'AC04', label: '모텔', category: 'lodging', parentId: 'AC' },
  { id: 'AC05', label: '캠핑', category: 'lodging', parentId: 'AC' },
  { id: 'AC06', label: '호스텔', category: 'lodging', parentId: 'AC' },
  // 추천코스
  { id: 'C01', label: '추천코스', category: 'place', isParent: true },
  { id: 'C0112', label: '가족코스', category: 'place', parentId: 'C01' },
  { id: 'C0113', label: '나홀로코스', category: 'place', parentId: 'C01' },
  { id: 'C0114', label: '힐링코스', category: 'place', parentId: 'C01' },
  { id: 'C0115', label: '도보코스', category: 'place', parentId: 'C01' },
  { id: 'C0116', label: '캠핑코스', category: 'place', parentId: 'C01' },
  { id: 'C0117', label: '맛코스', category: 'place', parentId: 'C01' },
  // 축제/공연/행사
  { id: 'EV', label: '축제/공연/행사', category: 'place', isParent: true },
  { id: 'EV01', label: '축제', category: 'place', parentId: 'EV' },
  { id: 'EV02', label: '공연', category: 'place', parentId: 'EV' },
  { id: 'EV03', label: '행사', category: 'place', parentId: 'EV' },
  // 체험관광
  { id: 'EX', label: '체험관광', category: 'place', isParent: true },
  { id: 'EX01', label: '전통체험', category: 'place', parentId: 'EX' },
  { id: 'EX02', label: '공예체험', category: 'place', parentId: 'EX' },
  { id: 'EX03', label: '농.산.어촌 체험', category: 'place', parentId: 'EX' },
  { id: 'EX04', label: '산사체험', category: 'place', parentId: 'EX' },
  { id: 'EX05', label: '웰니스관광', category: 'place', parentId: 'EX' },
  { id: 'EX06', label: '산업관광', category: 'place', parentId: 'EX' },
  { id: 'EX07', label: '기타체험', category: 'place', parentId: 'EX' },
  // 음식
  { id: 'FD', label: '음식', category: 'food', isParent: true },
  { id: 'FD01', label: '한식', category: 'food', parentId: 'FD' },
  { id: 'FD02', label: '외국식', category: 'food', parentId: 'FD' },
  { id: 'FD03', label: '간이음식', category: 'food', parentId: 'FD' },
  { id: 'FD04', label: '주점', category: 'food', parentId: 'FD' },
  { id: 'FD05', label: '카페/ 찻집', category: 'food', parentId: 'FD' },
  // 역사관광
  { id: 'HS', label: '역사관광', category: 'place', isParent: true },
  { id: 'HS01', label: '역사유적지', category: 'place', parentId: 'HS' },
  { id: 'HS02', label: '역사유물', category: 'place', parentId: 'HS' },
  { id: 'HS03', label: '종교성지', category: 'place', parentId: 'HS' },
  { id: 'HS04', label: '안보관광지', category: 'place', parentId: 'HS' },
  // 레저스포츠
  { id: 'LS', label: '레저스포츠', category: 'place', isParent: true },
  { id: 'LS01', label: '육상레저스포츠', category: 'place', parentId: 'LS' },
  { id: 'LS02', label: '수상레저스포츠', category: 'place', parentId: 'LS' },
  { id: 'LS03', label: '항공레저스포츠', category: 'place', parentId: 'LS' },
  { id: 'LS04', label: '복합레저스포츠', category: 'place', parentId: 'LS' },
  // 자연관광
  { id: 'NA', label: '자연관광', category: 'place', isParent: true },
  { id: 'NA01', label: '자연경관(산)', category: 'place', parentId: 'NA' },
  { id: 'NA02', label: '자연경관(하천‧해양)', category: 'place', parentId: 'NA' },
  { id: 'NA03', label: '자연생태', category: 'place', parentId: 'NA' },
  { id: 'NA04', label: '자연공원', category: 'place', parentId: 'NA' },
  { id: 'NA05', label: '기타자연관광', category: 'place', parentId: 'NA' },
  // 쇼핑
  { id: 'SH', label: '쇼핑', category: 'place', isParent: true },
  { id: 'SH01', label: '백화점', category: 'place', parentId: 'SH' },
  { id: 'SH02', label: '쇼핑몰', category: 'place', parentId: 'SH' },
  { id: 'SH03', label: '대형마트', category: 'place', parentId: 'SH' },
  { id: 'SH04', label: '면세점', category: 'place', parentId: 'SH' },
  { id: 'SH05', label: '전문매장/상가', category: 'place', parentId: 'SH' },
  { id: 'SH06', label: '시장', category: 'place', parentId: 'SH' },
  { id: 'SH07', label: '기타쇼핑시설', category: 'place', parentId: 'SH' },
  // 문화관광
  { id: 'VE', label: '문화관광', category: 'place', isParent: true },
  { id: 'VE01', label: '랜드마크관광', category: 'place', parentId: 'VE' },
  { id: 'VE02', label: '테마공원', category: 'place', parentId: 'VE' },
  { id: 'VE03', label: '도시공원', category: 'place', parentId: 'VE' },
  { id: 'VE04', label: '도시.지역문화관광', category: 'place', parentId: 'VE' },
  { id: 'VE05', label: '복합관광시설', category: 'place', parentId: 'VE' },
  { id: 'VE06', label: '공연시설', category: 'place', parentId: 'VE' },
  { id: 'VE07', label: '전시시설', category: 'place', parentId: 'VE' },
  { id: 'VE08', label: '행사시설', category: 'place', parentId: 'VE' },
  { id: 'VE09', label: '교육시설', category: 'place', parentId: 'VE' },
  { id: 'VE10', label: '레저스포츠시설', category: 'place', parentId: 'VE' },
  { id: 'VE11', label: '교통시설', category: 'place', parentId: 'VE' },
  { id: 'VE12', label: '기타문화관광지', category: 'place', parentId: 'VE' },
]

// 카테고리 계층 구조 (SearchFlyout의 <optgroup> 렌더링용)
export const PLACE_TYPE_GROUPS = [
  { id: 'AC', label: '숙박', children: PLACE_TYPES.filter((t) => t.parentId === 'AC') },
  { id: 'C01', label: '추천코스', children: PLACE_TYPES.filter((t) => t.parentId === 'C01') },
  { id: 'EV', label: '축제/공연/행사', children: PLACE_TYPES.filter((t) => t.parentId === 'EV') },
  { id: 'EX', label: '체험관광', children: PLACE_TYPES.filter((t) => t.parentId === 'EX') },
  { id: 'FD', label: '음식', children: PLACE_TYPES.filter((t) => t.parentId === 'FD') },
  { id: 'HS', label: '역사관광', children: PLACE_TYPES.filter((t) => t.parentId === 'HS') },
  { id: 'LS', label: '레저스포츠', children: PLACE_TYPES.filter((t) => t.parentId === 'LS') },
  { id: 'NA', label: '자연관광', children: PLACE_TYPES.filter((t) => t.parentId === 'NA') },
  { id: 'SH', label: '쇼핑', children: PLACE_TYPES.filter((t) => t.parentId === 'SH') },
  { id: 'VE', label: '문화관광', children: PLACE_TYPES.filter((t) => t.parentId === 'VE') },
]

export function typeToCategory(categoryCode) {
  // categoryCode2(서브) → categoryCode1(부모) 순으로 매칭해 category 반환
  const t = PLACE_TYPES.find((x) => x.id === categoryCode)
  return t?.category ?? 'place'
}

export const SORT_OPTIONS = [
  { value: 'LIKES', label: '좋아요순' },
  { value: 'RATING', label: '평점순' },
  { value: 'REVIEWS', label: '리뷰순' },
]

export const useSearchStore = defineStore('search', {
  state: () => ({
    keyword: '',
    provinceId: '',
    districtId: '',
    typeId: '',       // category2 코드 (e.g. 'AC01'). 부모 코드(e.g. 'AC') 선택 시 category1로 전송.
    sortBy: 'LIKES',
    results: [],
    hasNext: false,
    loading: false,
    searched: false,
    searchError: null,
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
    setSortBy(v) { this.sortBy = v },
    resetFilters() {
      this.keyword = ''
      this.provinceId = ''
      this.districtId = ''
      this.typeId = ''
      this.sortBy = 'LIKES'
    },

    async search(page = 0) {
      this.loading = true
      this.searchError = null
      try {
        const selected = PLACE_TYPES.find((t) => t.id === this.typeId)

        // 부모 카테고리 선택 → category1, 자식 카테고리 선택 → category2로 분리
        const category1 = selected?.isParent ? selected.id : (selected?.parentId ?? undefined)
        const category2 = selected && !selected.isParent ? selected.id : undefined

        const { content, hasNext } = await placeService.searchPlaces({
          keyword: this.keyword || undefined,
          areaCode: this.provinceId || undefined,
          districtCode: this.districtId || undefined,
          category1: category1 || undefined,
          category2: category2 || undefined,
          sort: this.sortBy,
          page,
          size: 10,
        })

        if(page === 0) {
          this.results = content.map((item) => ({
            id: String(item.placeId),
            name: item.title,
            address: item.addr1,
            firstImage: item.firstImage1,
            categoryCode1: item.categoryCode1,
            categoryCode2: item.categoryCode2,
            likeCount: item.likeCount,
            avgRating: item.avgRating ?? null,
            reviewCount: item.reviewCount ?? null,
            category: typeToCategory(item.categoryCode2 ?? item.categoryCode1),
          }))
        } else {
          this.results = [...this.results, ...content.map((item) => ({
            id: String(item.placeId),
            name: item.title,
            address: item.addr1,
            firstImage: item.firstImage1,
            categoryCode1: item.categoryCode1,
            categoryCode2: item.categoryCode2,
            likeCount: item.likeCount,
            avgRating: item.avgRating ?? null,
            reviewCount: item.reviewCount ?? null,
            category: typeToCategory(item.categoryCode2 ?? item.categoryCode1),
          }))]
        }

        this.hasNext = hasNext
        this.searched = true
      } catch (err) {
        this.searchError = err?.message ?? '검색에 실패했습니다.'
      } finally {
        this.loading = false
      }
    },
  },
})
