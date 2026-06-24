import { defineStore } from 'pinia'
import { libraryService } from '@/api/libraryService'
import { useToastStore } from '@/stores/toastStore'

const PAGE_SIZE = 10

export const useLibraryStore = defineStore('library', {
  state: () => ({
    items: [],
    page: 0,
    hasNext: false,
    loading: false,
    loadingMore: false,
    publishing: false,
    importingId: null,
    // 상세
    detail: null,
    detailLoading: false,
  }),
  actions: {
    // 목록 첫 페이지 조회
    async fetchList() {
      this.loading = true
      try {
        const { items, hasNext } = await libraryService.list(0, PAGE_SIZE)
        this.items = items
        this.page = 0
        this.hasNext = hasNext
      } catch (err) {
        useToastStore().error('라이브러리를 불러오지 못했습니다.')
      } finally {
        this.loading = false
      }
    },

    // 다음 페이지 누적
    async loadMore() {
      if (!this.hasNext || this.loadingMore || this.loading) return
      this.loadingMore = true
      try {
        const next = this.page + 1
        const { items, hasNext } = await libraryService.list(next, PAGE_SIZE)
        this.items = [...this.items, ...items]
        this.page = next
        this.hasNext = hasNext
      } catch (err) {
        useToastStore().error('더 불러오지 못했습니다.')
      } finally {
        this.loadingMore = false
      }
    },

    // 내 여행을 게시
    async publish({ planId, title, description }) {
      this.publishing = true
      try {
        await libraryService.post({ planId, title, description })
        useToastStore().success('라이브러리에 게시했습니다.')
        return { ok: true }
      } catch (err) {
        const message = err?.response?.data?.message ?? '게시에 실패했습니다.'
        useToastStore().error(message)
        return { ok: false, message }
      } finally {
        this.publishing = false
      }
    },

    // 상세 조회
    async fetchDetail(id) {
      this.detailLoading = true
      this.detail = null
      try {
        this.detail = await libraryService.detail(id)
        // 목록의 조회수도 즉시 반영(서버는 상세 진입 시 +1)
        const row = this.items.find((x) => x.libraryId === Number(id) || x.libraryId === id)
        if (row && this.detail) row.viewCount = this.detail.viewCount
        return this.detail
      } catch (err) {
        useToastStore().error('상세 정보를 불러오지 못했습니다.')
        return null
      } finally {
        this.detailLoading = false
      }
    },

    clearDetail() { this.detail = null },

    // 내가 게시한 항목 삭제(낙관적)
    async remove(id) {
      const prev = this.items
      this.items = this.items.filter((x) => x.libraryId !== id)
      try {
        await libraryService.remove(id)
        useToastStore().success('게시물을 삭제했습니다.')
        return { ok: true }
      } catch (err) {
        this.items = prev
        const message = err?.response?.data?.message ?? '삭제에 실패했습니다.'
        useToastStore().error(message)
        return { ok: false, message }
      }
    },

    // 내 여행으로 불러오기(새 여행 생성). 성공 시 importCount 증가 반영.
    async importLibrary(id) {
      this.importingId = id
      try {
        await libraryService.import(id)
        const row = this.items.find((x) => x.libraryId === id)
        if (row) row.importCount = (row.importCount ?? 0) + 1
        if (this.detail?.libraryId === id) this.detail.importCount = (this.detail.importCount ?? 0) + 1
        useToastStore().success('내 여행으로 불러왔습니다.')
        return { ok: true }
      } catch (err) {
        const message = err?.response?.data?.message ?? '불러오기에 실패했습니다.'
        useToastStore().error(message)
        return { ok: false, message }
      } finally {
        this.importingId = null
      }
    },
  },
})
