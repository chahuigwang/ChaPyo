<script setup>
import { X } from 'lucide-vue-next'

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
})
const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-slate-950/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        @click.self="emit('close')"
      >
        <div class="w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl shadow-xl overflow-hidden transition-colors">
          <div class="flex items-center justify-between px-6 py-4">
            <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">{{ title }}</h3>
            <button
              class="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              @click="emit('close')"
            >
              <X :size="16" />
            </button>
          </div>
          <div class="px-6 pb-6">
            <slot />
          </div>
          <div
            v-if="$slots.footer"
            class="px-6 py-4 bg-slate-50 dark:bg-slate-950/40 flex justify-end gap-2"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
