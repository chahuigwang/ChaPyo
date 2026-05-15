<script setup>
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { useTripStore } from '@/stores/tripStore'
import IntroPanel from './IntroPanel.vue'
import TripListPanel from './TripListPanel.vue'
import TripDetailPanel from './TripDetailPanel.vue'

const auth = useAuthStore()
const trip = useTripStore()
const { isAuthed } = storeToRefs(auth)
const { currentTripId } = storeToRefs(trip)

// 로그인 상태 변화에 따라 데이터 시드/리셋
watch(isAuthed, (v) => {
  if (v) trip.ensureSeed()
  else trip.resetForLogout()
}, { immediate: true })

const view = computed(() => {
  if (!isAuthed.value) return 'intro'
  if (!currentTripId.value) return 'list'
  return 'detail'
})
</script>

<template>
  <main class="flex-1 h-full overflow-hidden flex flex-col bg-background">
    <IntroPanel v-if="view === 'intro'" />
    <TripListPanel v-else-if="view === 'list'" />
    <TripDetailPanel v-else />
  </main>
</template>
