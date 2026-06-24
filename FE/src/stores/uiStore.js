import { defineStore } from 'pinia'

// activePanel: null | 'chat' | 'search' | 'storage' | 'profile'
// 모든 사이드바 패널은 PERSONAL(개인) 상태에 해당한다.
// 즉, 다른 협업 사용자와 동기화되지 않는다. 실시간 동기는 워크스페이스(SHARED) 영역에서만 발생한다.
export const useUiStore = defineStore('ui', {
  state: () => ({
    activePanel: 'plan',
    hoveredItemId: null,
    hoveredTransitId: null, // hover 중인 이동거리 구간의 출발(from) 장소 id
    viewMode: 'split',
    currentView: 'total',
    routeHiddenDays: {}, // iso → true 이면 해당 날짜의 지도 경로(폴리라인) 숨김
    draggingDayIso: null, // 일정 카드 드래그 중인 날짜 ISO (지도 라이브 연출 대상)
    dragPreview: null, // 드래그 중(드롭 전) 미리보기 핀 { id, name, lat, lng, dayIso }
    tourMode: false, // 둘러보기(스크롤 매직) 모드
    tourActiveId: null, // 둘러보기에서 현재 화면 중앙에 걸린 장소 id
  }),
  getters: {
    sidebarOpen: (s) => s.activePanel !== null,
    isRouteHidden: (s) => (iso) => !!s.routeHiddenDays[iso],
  },
  actions: {
    setViewMode(mode) {
      if (['map', 'split', 'timeline'].includes(mode)) this.viewMode = mode
    },
    setCurrentView(view) {
      if (['total', 'daily'].includes(view)) this.currentView = view
    },
    setDraggingDay(iso) { this.draggingDayIso = iso ?? null },
    clearDraggingDay() { this.draggingDayIso = null },
    setDragPreview(p) {
      // 좌표 또는 주소 중 하나는 있어야 핀을 띄울 수 있다 (검색 결과는 주소만 보유)
      if (!p || (p.lat == null && !p.address)) return
      const cur = this.dragPreview
      // 같은 아이템·같은 날이면 잦은 갱신 생략 (드래그 중 onMove 가 연속 호출됨)
      if (cur && cur.id === p.id && cur.dayIso === p.dayIso) return
      this.dragPreview = {
        id: p.id, name: p.name, dayIso: p.dayIso,
        lat: p.lat ?? null, lng: p.lng ?? null, address: p.address ?? null,
      }
    },
    clearDragPreview() { this.dragPreview = null },
    setTourMode(on) {
      this.tourMode = !!on
      if (!on) this.tourActiveId = null
    },
    setTourActive(id) { this.tourActiveId = id ?? null },
    toggleRouteDay(iso) {
      if (this.routeHiddenDays[iso]) delete this.routeHiddenDays[iso]
      else this.routeHiddenDays[iso] = true
    },
    setHoveredItem(id) { this.hoveredItemId = id ?? null },
    clearHoveredItem(id) {
      if (id == null || this.hoveredItemId === id) this.hoveredItemId = null
    },
    setHoveredTransit(id) { this.hoveredTransitId = id ?? null },
    clearHoveredTransit() { this.hoveredTransitId = null },
    openPanel(name) { this.activePanel = name },
    closePanel() { this.activePanel = null },
    togglePanel(name) {
      this.activePanel = this.activePanel === name ? null : name
    },
    // 특정 날짜만 지도에 표시 (iso=null 이면 전체 표시)
    setDayFocus(iso, allIsos = []) {
      if (!iso) { this.routeHiddenDays = {}; return }
      const hidden = {}
      allIsos.forEach((d) => { if (d !== iso) hidden[d] = true })
      this.routeHiddenDays = hidden
    },
    // 호환용 (기존 호출처 대응)
    openSidebar() { if (!this.activePanel) this.activePanel = 'plan' },
    closeSidebar() { this.activePanel = null },
    toggleSidebar() {
      this.activePanel = this.activePanel ? null : 'plan'
    },
  },
})
