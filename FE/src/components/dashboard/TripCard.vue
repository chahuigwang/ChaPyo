<script setup>
import { computed, onBeforeUnmount, ref, toRef, watch, useTemplateRef } from 'vue'
import { Trash2 } from 'lucide-vue-next'
import { enumerateDays } from '@/types/itinerary'
import { useTripStatus } from '@/composables/useTripStatus'

const props = defineProps({
  trip: { type: Object, required: true },
})
const emit = defineEmits(['open', 'delete'])

const { status, daysUntilStart, currentDay } = useTripStatus(
  toRef(() => props.trip.startDate),
  toRef(() => props.trip.endDate),
)
const isPast = computed(() => status.value === 'past')
const isOngoing = computed(() => status.value === 'ongoing')

const itemCount = computed(() =>
  Object.values(props.trip.itemsByDay).reduce((sum, list) => sum + list.length, 0),
)
const totalCost = computed(() =>
  Object.values(props.trip.itemsByDay).reduce(
    (sum, list) => sum + list.reduce((s, it) => s + (Number(it.cost) || 0), 0),
    0,
  ),
)
const dayCount = computed(() =>
  enumerateDays(props.trip.startDate, props.trip.endDate).length,
)
const costLabel = computed(() => totalCost.value.toLocaleString('ko-KR'))

const confirming = ref(false)
let revertTimer = null
function clearRevertTimer() {
  if (revertTimer) {
    clearTimeout(revertTimer)
    revertTimer = null
  }
}
function startConfirm() {
  confirming.value = true
  clearRevertTimer()
  revertTimer = setTimeout(() => {
    confirming.value = false
    revertTimer = null
  }, 3000)
}
function cancelConfirm() {
  if (!confirming.value) return
  confirming.value = false
  clearRevertTimer()
}
function onTrashClick() {
  if (!confirming.value) startConfirm()
}
function onConfirmDelete() {
  clearRevertTimer()
  confirming.value = false
  emit('delete', props.trip)
}
function onCardClick() {
  if (confirming.value) {
    cancelConfirm()
    return
  }
  emit('open', props.trip.id)
}
const rootRef = useTemplateRef('rootRef')
function onDocClick(e) {
  if (!confirming.value) return
  if (rootRef.value && !rootRef.value.contains(e.target)) cancelConfirm()
}
watch(confirming, (v) => {
  if (v) document.addEventListener('click', onDocClick, true)
  else document.removeEventListener('click', onDocClick, true)
})
onBeforeUnmount(() => {
  clearRevertTimer()
  document.removeEventListener('click', onDocClick, true)
})
</script>

<template>
  <div
    ref="rootRef"
    class="trip-ticket group relative cursor-pointer rounded-xl bg-white dark:bg-slate-900
           shadow-sm transition-all duration-300 ease-out
           flex flex-col overflow-hidden"
    :class="[
      isPast ? 'opacity-60 grayscale' : 'hover:shadow-md hover:-translate-y-1.5',
      isOngoing ? 'trip-ticket--ongoing' : '',
    ]"
    @click="onCardClick"
  >
    <!-- Top row: left main + right stub -->
    <div class="grid grid-cols-12">
      <!-- Main info: left ~67% -->
      <section class="col-span-8 p-6 pr-7 min-w-0">
        <div class="flex items-center gap-2">
          <p class="text-[10px] tracking-[0.2em] uppercase text-slate-400 dark:text-slate-500">
            Boarding Pass
          </p>
          <span
            v-if="isPast"
            class="px-1.5 py-0.5 rounded-full text-[9px] font-semibold tracking-wide
                   bg-slate-200/80 text-slate-600 dark:bg-slate-700/70 dark:text-slate-300"
          >종료</span>
          <span
            v-else-if="isOngoing"
            class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold tracking-wide
                   bg-[#00B7EB]/15 text-[#0891b2] dark:text-[#67e8f9]"
          >
            <span class="relative flex h-1.5 w-1.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00B7EB] opacity-75"></span>
              <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00B7EB]"></span>
            </span>
            LIVE
          </span>
          <span
            v-else
            class="px-1.5 py-0.5 rounded-full text-[9px] font-semibold tracking-wide
                   bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >D-{{ daysUntilStart }}</span>
        </div>
        <p
          v-if="isOngoing"
          class="mt-1 text-[11px] font-medium text-[#0891b2] dark:text-[#67e8f9]"
        >오늘은 Day {{ currentDay }}</p>
        <h3 class="mt-2 text-lg font-semibold text-gray-900 dark:text-slate-100 truncate">
          {{ trip.title }}
        </h3>
        <div class="mt-3 flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
          <span class="font-medium">From {{ trip.startDate }}</span>
          <span class="font-medium">To {{ trip.endDate }}</span>
        </div>
      </section>

      <!-- Stub: right ~33% — Trash top-right, vertical stacked summaries -->
      <section class="col-span-4 p-5 pl-6 flex flex-col gap-4 relative">
        <div class="absolute top-3 right-4" @click.stop>
          <button
            v-if="!confirming"
            class="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded-md
                   text-slate-400 dark:text-slate-500
                   hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            aria-label="삭제"
            @click="onTrashClick"
          >
            <Trash2 :size="14" />
          </button>
          <button
            v-else
            class="bg-red-500 text-white text-[11px] px-2 py-0.5 rounded font-medium
                   hover:bg-red-600 transition-all duration-200 shadow-sm"
            @click="onConfirmDelete"
          >
            영구 삭제
          </button>
        </div>
        <div class="flex flex-col mt-6">
          <span class="text-[11px] text-slate-400 dark:text-slate-500">기간</span>
          <span class="text-base font-semibold text-slate-900 dark:text-slate-100">{{ dayCount }}일</span>
        </div>
        <div class="flex flex-col">
          <span class="text-[11px] text-slate-400 dark:text-slate-500">일정</span>
          <span class="text-base font-semibold text-slate-900 dark:text-slate-100">{{ itemCount }}건</span>
        </div>
      </section>
    </div>

    <!-- Bottom row: total price -->
    <div class="trip-ticket-total flex items-center justify-between px-6 py-3 bg-slate-50 dark:bg-slate-800/40">
      <span class="text-[11px] text-slate-500 dark:text-slate-400">총 비용</span>
      <span class="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
        ₩{{ costLabel }}
      </span>
    </div>

    <!-- Perforated tear-off cutouts (top/bottom) -->
    <span class="trip-ticket-notch trip-ticket-notch-top" />
    <span class="trip-ticket-notch trip-ticket-notch-bottom" />
  </div>
</template>

<style scoped>
.trip-ticket {
  position: relative;
}
.trip-ticket--ongoing {
  box-shadow:
    0 0 0 1px rgba(0, 183, 235, 0.35),
    0 6px 24px -8px rgba(0, 183, 235, 0.45);
}
.trip-ticket--ongoing:hover {
  box-shadow:
    0 0 0 1px rgba(0, 183, 235, 0.55),
    0 10px 32px -8px rgba(0, 183, 235, 0.6);
  transform: translateY(-6px);
}
/* Vertical dashed perforation at the 66.66% mark (8/12 grid) */
.trip-ticket::before {
  content: '';
  position: absolute;
  top: 16px;
  bottom: 64px;
  left: 66.666%;
  width: 0;
  border-left: 2px dashed rgb(209 213 219); /* gray-300 */
  pointer-events: none;
}
.trip-ticket-total {
  border-top: 1px dashed rgb(226 232 240); /* slate-200 */
}
:global(.dark) .trip-ticket-total {
  border-top-color: rgb(51 65 85); /* slate-700 */
}

/* Semi-circle cutouts that punch through to the page background */
.trip-ticket-notch {
  position: absolute;
  left: 66.666%;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  background: rgb(248 250 252); /* slate-50, matches dashboard bg */
  transform: translateX(-50%);
  pointer-events: none;
}
.trip-ticket-notch-top { top: -9px; }
.trip-ticket-notch-bottom { bottom: 48px; }

:global(.dark) .trip-ticket-notch {
  background: rgb(2 6 23); /* slate-950 */
}
</style>
