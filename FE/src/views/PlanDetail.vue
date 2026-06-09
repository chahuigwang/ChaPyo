<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTripStore } from '@/stores/tripStore'
import { useSearchStore } from '@/stores/searchStore'
import { useToastStore } from '@/stores/toastStore'
import SidebarContainer from '@/components/sidebar/SidebarContainer.vue'
import TripDetailPanel from '@/components/workspace/TripDetailPanel.vue'
import HistoryDrawer from '@/components/workspace/HistoryDrawer.vue'

const route = useRoute()
const router = useRouter()
const trip = useTripStore()
const search = useSearchStore()
const toast = useToastStore()

const SYNC_INTERVAL_MS = 15_000
let syncTimer = null

onMounted(async () => {
  const plan = await trip.fetchDetail(route.params.id)
  if (!plan) {
    toast.error('여행 정보를 불러올 수 없습니다.')
    router.replace('/list')
    return
  }
  syncTimer = setInterval(() => trip.syncCurrent(), SYNC_INTERVAL_MS)
  if (!search.searched) search.search(0)
})
onBeforeUnmount(() => {
  clearInterval(syncTimer)
})
</script>

<template>
  <div class="flex-1 flex overflow-hidden relative">
    <SidebarContainer />
    <main class="flex-1 h-full overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <TripDetailPanel />
    </main>
    <HistoryDrawer />
  </div>
</template>
