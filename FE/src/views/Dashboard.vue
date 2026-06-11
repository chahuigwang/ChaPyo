<script setup>
import { onMounted } from 'vue'
import { useTripStore } from '@/stores/tripStore'
import TripListPanel from '@/components/tripList/TripListPanel.vue'

const trip = useTripStore()
onMounted(() => {
  trip.exitTrip()
  trip.fetchTrips() // 리스트로 돌아올 때마다 최신 목록 재조회
})
</script>

<template>
  <main class="flex-1 h-full overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
    <TripListPanel />
  </main>
</template>
