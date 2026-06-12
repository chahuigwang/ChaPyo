<script setup>
import { computed, onBeforeUnmount, ref, toRef, watch, useTemplateRef } from 'vue'
import { Trash2, LogOut } from 'lucide-vue-next'
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

// 상세를 로드한 경우엔 itemsByDay로 계산, 목록만 받은 경우엔 응답의 itemCount/totalCost 사용
const loadedItemCount = computed(() =>
  Object.values(props.trip.itemsByDay).reduce((sum, list) => sum + list.length, 0),
)
const itemCount = computed(() =>
  loadedItemCount.value > 0 ? loadedItemCount.value : (props.trip.itemCount ?? 0),
)
const totalCost = computed(() => {
  if (loadedItemCount.value > 0) {
    return Object.values(props.trip.itemsByDay).reduce(
      (sum, list) => sum + list.reduce((s, it) => s + (Number(it.cost) || 0), 0),
      0,
    )
  }
  return props.trip.totalCost ?? 0
})
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
    class="trip-ticket group relative cursor-pointer rounded-2xl bg-white dark:bg-slate-900
           shadow-md border border-slate-200/80 dark:border-slate-700/60
           transition-all duration-300 ease-out flex flex-col overflow-hidden"
    :class="[
      isPast ? 'opacity-60 grayscale' : 'hover:shadow-xl hover:-translate-y-1.5 hover:border-slate-300 dark:hover:border-slate-600',
      isOngoing ? 'trip-ticket--ongoing' : '',
    ]"
    @click="onCardClick"
  >
    <!-- Top row: left main + right stub -->
    <div class="grid grid-cols-12">
      <!-- Main info: left ~75% -->
      <section class="col-span-9 p-6 pr-7 min-w-0 flex flex-col overflow-hidden">
        <div class="flex items-center gap-2 min-w-0">
          <p class="text-[11px] tracking-[0.2em] uppercase text-slate-400 dark:text-slate-500 shrink-0">
            Boarding Pass
          </p>
          <span
            v-if="isPast"
            class="px-1.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide
                   bg-slate-200/80 text-slate-600 dark:bg-slate-700/70 dark:text-slate-300"
          >종료</span>
          <template v-else-if="isOngoing">
            <span
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide
                     bg-[#00B7EB]/15 text-[#0891b2] dark:text-[#67e8f9]"
            >
              <span class="relative flex h-1.5 w-1.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00B7EB] opacity-75"></span>
                <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00B7EB]"></span>
              </span>
              LIVE
            </span>
            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-[#00B7EB] text-white shrink-0">
              Day {{ currentDay }}
            </span>
          </template>
          <span
            v-else
            class="px-1.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide
                   bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >D-{{ daysUntilStart }}</span>
        </div>
        <h3 class="mt-2 text-lg font-semibold text-gray-900 dark:text-slate-100 truncate leading-snug">
          {{ trip.title }}
        </h3>
        <div class="mt-auto pt-3 flex items-center justify-between gap-2 min-w-0">
          <div class="flex flex-col gap-0.5 min-w-0">
            <span class="text-[11px] uppercase tracking-wider text-slate-400 shrink-0">From</span>
            <span class="text-[12px] font-semibold text-slate-800 dark:text-slate-100 tabular-nums">{{ trip.startDate }}</span>
          </div>
          <div class="flex flex-col items-end gap-0.5 min-w-0">
            <span class="text-[11px] uppercase tracking-wider text-slate-400 shrink-0">To</span>
            <span class="text-[12px] font-semibold text-slate-800 dark:text-slate-100 tabular-nums">{{ trip.endDate }}</span>
          </div>
        </div>
      </section>

      <!-- Stub: right ~25% — Trash top-right, vertical stacked summaries -->
      <section class="col-span-3 p-5 pl-6 flex flex-col gap-4 relative">
        <div v-if="trip.isOwner" class="absolute top-3 right-3" @click.stop>
          <button
            title="삭제"
            class="flex items-center gap-1 rounded-lg transition-all duration-200"
            :class="confirming
              ? 'px-3 py-2 bg-red-500 text-white hover:bg-red-600 shadow-md'
              : 'p-2.5 opacity-0 group-hover:opacity-100 text-red-500 bg-red-50 dark:bg-red-900/25 hover:bg-red-100 dark:hover:bg-red-900/40 shadow-sm'"
            @click="confirming ? onConfirmDelete() : onTrashClick()"
          >
            <Trash2 :size="17" class="shrink-0" />
            <span v-if="confirming" class="text-[12px] font-semibold whitespace-nowrap">삭제</span>
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
      <span class="text-[14px] font-semibold text-slate-500 dark:text-slate-400">총 비용</span>
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
  left: 75%;
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
  left: 75%;
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
