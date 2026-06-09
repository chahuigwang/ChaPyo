<script setup>
import { storeToRefs } from 'pinia'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next'
import { useToastStore } from '@/stores/toastStore'

const toast = useToastStore()
const { items } = storeToRefs(toast)

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info }
const TONE = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-primary',
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="t in items"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-2.5 min-w-[260px] max-w-sm px-4 py-3
                 rounded-xl bg-white dark:bg-slate-900 shadow-lg ring-1 ring-black/5 dark:ring-white/10"
        >
          <component :is="ICONS[t.type] ?? Info" :size="18" :class="['shrink-0 mt-0.5', TONE[t.type] ?? TONE.info]" />
          <p class="flex-1 text-[13px] text-slate-700 dark:text-slate-200 leading-snug">{{ t.message }}</p>
          <button
            @click="toast.remove(t.id)"
            class="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 280ms ease, transform 280ms ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(24px);
}
.toast-move {
  transition: transform 280ms ease;
}
</style>
