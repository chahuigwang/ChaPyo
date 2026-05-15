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
        class="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4"
        @click.self="emit('close')"
      >
        <div class="w-full max-w-md bg-card text-card-foreground rounded-md border border-border overflow-hidden">
          <div class="flex items-center justify-between px-5 py-3 border-b border-border">
            <h3 class="text-sm font-semibold text-foreground">{{ title }}</h3>
            <button
              class="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              @click="emit('close')"
            >
              <X :size="15" />
            </button>
          </div>
          <div class="p-5">
            <slot />
          </div>
          <div
            v-if="$slots.footer"
            class="px-5 py-3 border-t border-border flex justify-end gap-2"
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
