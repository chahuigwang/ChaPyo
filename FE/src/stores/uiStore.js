import { defineStore } from 'pinia'

// activePanel: null | 'chat' | 'search' | 'storage' | 'profile'
// 모든 사이드바 패널은 PERSONAL(개인) 상태에 해당한다.
// 즉, 다른 협업 사용자와 동기화되지 않는다. 실시간 동기는 워크스페이스(SHARED) 영역에서만 발생한다.
export const useUiStore = defineStore('ui', {
  state: () => ({
    activePanel: 'chat',
    hoveredItemId: null,
    viewMode: 'split', // 'map' | 'split' | 'timeline'
    currentView: 'total', // 'total' | 'daily'
  }),
  getters: {
    sidebarOpen: (s) => s.activePanel !== null,
  },
  actions: {
    setViewMode(mode) {
      if (['map', 'split', 'timeline'].includes(mode)) this.viewMode = mode
    },
    setCurrentView(view) {
      if (['total', 'daily'].includes(view)) this.currentView = view
    },
    setHoveredItem(id) { this.hoveredItemId = id ?? null },
    clearHoveredItem(id) {
      if (id == null || this.hoveredItemId === id) this.hoveredItemId = null
    },
    openPanel(name) { this.activePanel = name },
    closePanel() { this.activePanel = null },
    togglePanel(name) {
      this.activePanel = this.activePanel === name ? null : name
    },
    // 호환용 (기존 호출처 대응)
    openSidebar() { if (!this.activePanel) this.activePanel = 'chat' },
    closeSidebar() { this.activePanel = null },
    toggleSidebar() {
      this.activePanel = this.activePanel ? null : 'chat'
    },
  },
})
