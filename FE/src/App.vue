<script setup>
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import LoginPage from '@/views/Login.vue'
import DashboardPage from '@/views/Dashboard.vue'
import PlanDetailPage from '@/views/PlanDetail.vue'
import { useAuthStore } from '@/stores/authStore'
import { useTripStore } from '@/stores/tripStore'
import { useTheme } from '@/composables/useTheme'

useTheme()
const auth = useAuthStore()
const trip = useTripStore()
const { isAuthed } = storeToRefs(auth)
const { currentTripId } = storeToRefs(trip)

watch(isAuthed, (v) => {
  if (v) trip.ensureSeed()
  else trip.resetForLogout()
}, { immediate: true })
</script>

<template>
  <div class="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
    <LoginPage v-if="!isAuthed" />
    <Transition v-else name="page-fade" mode="out-in">
      <PlanDetailPage v-if="currentTripId" key="plan" />
      <DashboardPage v-else key="dashboard" />
    </Transition>
  </div>
</template>

<style>
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 280ms ease, transform 280ms ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
