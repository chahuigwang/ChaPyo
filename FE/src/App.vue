<script setup>
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { useTripStore } from '@/stores/tripStore'
import { useTheme } from '@/composables/useTheme'
import ToastHost from '@/components/common/ToastHost.vue'

useTheme()
const auth = useAuthStore()
const trip = useTripStore()
const { isAuthed, initializing } = storeToRefs(auth)

watch(isAuthed, (v) => {
  if (v) trip.fetchTrips()
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

    <RouterView v-else>
      <template #default="{ Component }">
        <Transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </template>
    </RouterView>

    <ToastHost />
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
