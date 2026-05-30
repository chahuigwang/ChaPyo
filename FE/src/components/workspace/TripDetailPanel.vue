<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronDown, ArrowRight } from 'lucide-vue-next'
import TripMap from './TripMap.vue'
import DayTimeline from './DayTimeline.vue'
import DateNavigator from './DateNavigator.vue'
import { useTripStore } from '@/stores/tripStore'
import { useUiStore } from '@/stores/uiStore'
import { findCategory, formatDayLabel } from '@/types/itinerary'

const trip = useTripStore()
const ui = useUiStore()
const { currentView } = storeToRefs(ui)
const { currentTrip, days, selectedDate } = storeToRefs(trip)

// Auto-select first day if none selected when switching to daily view
watch(currentView, (v) => {
  if (v === 'daily' && !selectedDate.value && days.value.length) {
    trip.selectDate(days.value[0])
  }
}, { immediate: true })

// Accordion state: set of expanded day ISO strings
const expanded = ref(new Set())
function toggleDay(iso) {
  const s = new Set(expanded.value)
  s.has(iso) ? s.delete(iso) : s.add(iso)
  expanded.value = s
}

const allDays = computed(() => {
  const t = currentTrip.value
  if (!t) return []
  return (days.value || []).map((iso, idx) => ({
    iso,
    label: formatDayLabel(iso, idx),
    items: t.itemsByDay?.[iso] ?? [],
  }))
})

// Continuous global index offset per day for total view
const dayOffset = computed(() => {
  const offsets = {}
  let counter = 0
  for (const day of allDays.value) {
    offsets[day.iso] = counter
    counter += day.items.length
  }
  return offsets
})

const totalCost = computed(() => {
  const t = currentTrip.value
  if (!t) return 0
  return Object.values(t.itemsByDay).flat().reduce((sum, i) => {
    return sum + (Number(i.cost) || 0) + (Number(i.transitAfter?.cost) || 0)
  }, 0)
})

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'

function goDaily(iso) {
  trip.selectDate(iso)
  ui.setCurrentView('daily')
}
</script>

<template>
  <div class="flex-1 h-full flex flex-col min-h-0 relative">

    <!-- Daily view: 3:7 grid (timeline left, map right) -->
    <div v-if="currentView === 'daily'" class="flex-1 grid grid-cols-10 min-h-0 overflow-hidden">
      <div class="col-span-3 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 px-4 py-4 transition-colors">
        <!-- Bento navigator -->
        <div class="mb-3">
          <DateNavigator />
        </div>
        <DayTimeline />
      </div>
      <div class="col-span-7 h-full overflow-hidden bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
        <TripMap class="h-full w-full rounded-2xl shadow-sm overflow-hidden" />
      </div>
    </div>

    <!-- Total view: 3:7 grid (all-days accordion left, full-trip map right) -->
    <div v-else class="flex-1 grid grid-cols-10 min-h-0 overflow-hidden">
      <!-- Left: scrollable accordion itinerary -->
      <div class="col-span-3 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 px-4 py-4 transition-colors">
        <div class="flex flex-col gap-3">
        <!-- Bento navigator -->
        <div class="shrink-0">
          <DateNavigator />
        </div>
        <!-- Summary bar -->
        <div class="shrink-0 rounded-xl bg-white dark:bg-slate-900 shadow-sm px-4 py-4 flex flex-col gap-2">
          <div class="text-[11px] uppercase tracking-wider text-slate-400">전체 여행</div>
          <div class="text-[14px] font-bold text-slate-900 dark:text-slate-100">
            {{ currentTrip?.title || '여행 계획' }}
          </div>
          <div class="flex items-center justify-between mt-1">
            <div>
              <div class="text-[10px] text-slate-400">일정 수</div>
              <div class="text-[13px] font-bold text-slate-900 dark:text-slate-100">
                {{ allDays.reduce((s, d) => s + d.items.length, 0) }}건
              </div>
            </div>
            <div class="text-right">
              <div class="text-[10px] text-slate-400">총 비용</div>
              <div class="text-[13px] font-bold text-slate-900 dark:text-slate-100">{{ won(totalCost) }}</div>
            </div>
          </div>
        </div>

        <!-- Per-day accordion cards -->
        <div
          v-for="day in allDays"
          :key="day.iso"
          class="shrink-0 rounded-xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
        >
          <!-- Day header -->
          <div
            class="px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors select-none"
            @click="toggleDay(day.iso)"
          >
            <ChevronDown
              :size="14"
              class="text-slate-400 shrink-0 transition-transform duration-300"
              :class="expanded.has(day.iso) ? 'rotate-0' : '-rotate-90'"
            />
            <div class="flex-1 min-w-0">
              <div class="text-[10px] text-slate-400">{{ day.iso }}</div>
              <div class="text-[13px] font-bold text-slate-900 dark:text-slate-100">{{ day.label }}</div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-[11px] text-slate-400">{{ day.items.length }}건</span>
              <button
                @click.stop="goDaily(day.iso)"
                class="bg-cyan-50 dark:bg-cyan-900/20 text-cyan-500 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 rounded-xl p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                title="일별 상세 보기"
              >
                <ArrowRight :size="13" />
              </button>
            </div>
          </div>

          <!-- Accordion content with slide animation -->
          <div class="accordion-wrap" :class="expanded.has(day.iso) ? 'accordion-open' : ''">
            <div class="px-4 pb-3 flex flex-col gap-1.5">
              <div v-if="!day.items.length" class="text-[11px] text-slate-400 py-1">아직 일정 없음</div>
              <div
                v-for="(item, idx) in day.items"
                :key="item.id"
                class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60"
              >
                <span class="shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold">
                  {{ dayOffset[day.iso] + idx + 1 }}
                </span>
                <span class="text-sm shrink-0">{{ findCategory(item.category).emoji }}</span>
                <div class="flex-1 min-w-0">
                  <div class="text-[12px] font-semibold text-slate-900 dark:text-slate-100">{{ item.name }}</div>
                  <div class="text-[10px] text-slate-400">
                    {{ findCategory(item.category).label }}<span v-if="item.time"> · {{ item.time }}</span>
                    <span v-if="item.cost"> · {{ won(item.cost) }}</span>
                  </div>
                  <p v-if="item.memo" class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{{ item.memo }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!allDays.length" class="shrink-0 rounded-xl bg-white dark:bg-slate-900 shadow-sm p-8 text-center text-[12px] text-slate-400">
          여행 날짜를 설정하면 전체 일정이 표시됩니다.
        </div>
        </div>
      </div>

      <!-- Right: map showing ALL trip pins (continuous numbering) -->
      <div class="col-span-7 h-full overflow-hidden bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
        <TripMap class="h-full w-full rounded-2xl shadow-sm overflow-hidden" :show-all="true" />
      </div>
    </div>

  </div>
</template>

<style scoped>
.accordion-wrap {
  display: grid;
  grid-template-rows: 0fr;
  overflow: hidden;
  transition: grid-template-rows 0.3s ease, opacity 0.25s ease;
  opacity: 0;
}
.accordion-wrap > div { min-height: 0; }
.accordion-open {
  grid-template-rows: 1fr;
  opacity: 1;
}
</style>
