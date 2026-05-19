<script setup>
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import LoginPage from '@/pages/Login.vue'
import DashboardPage from '@/pages/Dashboard.vue'
import PlanDetailPage from '@/pages/PlanDetail.vue'
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
    <template v-else>
      <PlanDetailPage v-if="currentTripId" />
      <DashboardPage v-else />
    </template>
  </div>
</template>
