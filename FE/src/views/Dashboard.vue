<script setup>
import { onMounted } from 'vue'
import { useTripStore } from '@/stores/tripStore'
import TripListPanel from '@/components/tripList/TripListPanel.vue'

const trip = useTripStore()
onMounted(() => trip.exitTrip())
</script>

<template>
  <main class="flex-1 h-full overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
    <TripListPanel />
  </main>
</template>
