<script setup>
import { onMounted, watch } from 'vue'
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
const { isAuthed, initializing } = storeToRefs(auth)
const { currentTripId } = storeToRefs(trip)

onMounted(() => auth.initAuth())

watch(isAuthed, (v) => {
  if (v) trip.ensureSeed()
  else trip.resetForLogout()
})
</script>

<template>
  <div class="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
    <div
      v-if="initializing"
      class="flex-1 flex items-center justify-center"
    >
      <span class="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
    </div>

    <template v-else>
      <LoginPage v-if="!isAuthed" />
      <Transition v-else name="page-fade" mode="out-in">
        <PlanDetailPage v-if="currentTripId" key="plan" />
        <DashboardPage v-else key="dashboard" />
      </Transition>
    </template>
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
