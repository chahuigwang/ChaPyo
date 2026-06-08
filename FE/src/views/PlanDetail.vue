<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTripStore } from '@/stores/tripStore'
import { useSearchStore } from '@/stores/searchStore'
import SidebarContainer from '@/components/sidebar/SidebarContainer.vue'
import TripDetailPanel from '@/components/workspace/TripDetailPanel.vue'
import HistoryDrawer from '@/components/workspace/HistoryDrawer.vue'

const route = useRoute()
const router = useRouter()
const trip = useTripStore()
const search = useSearchStore()

const SYNC_INTERVAL_MS = 15_000
let syncTimer = null

onMounted(() => {
  trip.selectTrip(route.params.id)
  if (!trip.currentTripId) {
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
