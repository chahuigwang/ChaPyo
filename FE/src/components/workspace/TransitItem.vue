<script setup>
import { computed } from 'vue'
import { Car, Navigation } from 'lucide-vue-next'

const props = defineProps({
  item: { type: Object, required: true },
  next: { type: Object, default: null },
  autoKm: { type: String, default: null },
  autoMins: { type: Number, default: null },
})

const canRoute = computed(() => {
  const a = props.item, b = props.next
  return a?.lat != null && a?.lng != null && b?.lat != null && b?.lng != null
})
const directionsUrl = computed(() => {
  if (!canRoute.value) return ''
  const a = props.item, b = props.next
  const from = `${encodeURIComponent(a.name || '출발')},${a.lat},${a.lng}`
  const to = `${encodeURIComponent(b.name || '도착')},${b.lat},${b.lng}`
  return `https://map.kakao.com/link/from/${from}/to/${to}`
})
function openDirections(e) {
  e.stopPropagation()
  if (directionsUrl.value) window.open(directionsUrl.value, '_blank', 'noopener,noreferrer')
}

const emit = defineEmits(['hover-transit', 'leave-transit'])

const displayKm = computed(() => props.autoKm ?? '?')
</script>

<template>
  <div class="w-full py-1 flex flex-col">
    <div
      class="w-full flex items-center gap-2 px-4 py-2 rounded-xl
             bg-slate-50 dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800
             transition-all duration-200"
      @mouseenter="emit('hover-transit')"
      @mouseleave="emit('leave-transit')"
    >
      <Car :size="18" class="text-primary shrink-0" />
      <div class="flex-1 min-w-0">
        <div class="text-[12px] font-medium text-slate-600 dark:text-slate-300">
          {{ displayKm }}km
        </div>
      </div>
      <button
        v-if="canRoute"
        @click.stop="openDirections"
        class="shrink-0 inline-flex items-center gap-1 px-2.5 h-7 rounded-lg text-[11px] font-semibold
               text-primary bg-primary/10 hover:bg-primary hover:text-white transition-colors"
        title="카카오맵에서 길찾기"
      >
        <Navigation :size="12" /> 길찾기
      </button>
    </div>
  </div>
</template>
