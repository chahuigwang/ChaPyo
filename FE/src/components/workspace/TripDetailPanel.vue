<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronDown, ArrowRight } from 'lucide-vue-next'
import TripMap from './TripMap.vue'
import DayTimeline from './DayTimeline.vue'
import DateNavigator from './DateNavigator.vue'
import { useTripStore } from '@/stores/tripStore'
import { useUiStore } from '@/stores/uiStore'
import { useStorageStore } from '@/stores/storageStore'
import { useCollabStore } from '@/stores/collabStore'
import { findCategory, formatDayLabel } from '@/types/itinerary'
import { dayColorFor } from '@/composables/useDayColor'

const trip = useTripStore()
const ui = useUiStore()
const storage = useStorageStore()
const collab = useCollabStore()
const { currentView, sidebarOpen } = storeToRefs(ui)
const { currentTrip, days, selectedDate } = storeToRefs(trip)

// ── Total-view day drop zones ────────────────────────────────
const dropTargetDay = ref(null)

function onDayDragOver(e, iso) {
  if (!storage.dragging) return
  e.preventDefault()
  e.dataTransfer.dropEffect = storage.dragging.source === 'timeline' ? 'move' : 'copy'
  dropTargetDay.value = iso
}
function onDayDragLeave(e) {
  if (e.currentTarget.contains(e.relatedTarget)) return
  dropTargetDay.value = null
}
function onDayDrop(e, iso) {
  e.preventDefault()
  const p = storage.dragging
  dropTargetDay.value = null
  if (!p?.item) { storage.clearDragging(); return }

  if (p.source === 'timeline') {
    // 다른 날짜의 기존 일정 → 이 날짜로 이동 (PATCH visitDate)
    trip.moveItemToDate(p.fromDate, iso, p.item.id)
  } else {
    trip.addItemToDate(iso, p.item)
    // 보관함(좋아요)에서 가져와도 좋아요는 유지(복사)
  }
  collab.pushHistory({ type: 'add', itemName: p.item.name, byName: collab.me.name })

  storage.clearDragging()
}

const dailyMapRef = ref(null)
const totalMapRef = ref(null)

watch(sidebarOpen, () => {
  nextTick(() => {
    if (currentView.value === 'daily') dailyMapRef.value?.onRelayout()
    else totalMapRef.value?.onRelayout()
  })
})

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

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
function dateWithWeekday(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${iso}(${WEEKDAYS[d.getDay()]})`
}

const allDays = computed(() => {
  const t = currentTrip.value
  if (!t) return []
  return (days.value || []).map((iso, idx) => ({
    iso,
    dayNum: idx + 1,
    dateLabel: dateWithWeekday(iso),
    color: dayColorFor(idx),
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

    <!-- Daily view: flex (timeline fixed-width left, map fluid right) -->
    <div v-if="currentView === 'daily'" class="flex-1 flex min-h-0 overflow-hidden">
      <div class="w-96 shrink-0 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 px-4 py-4 transition-colors">
        <!-- Bento navigator -->
        <div class="mb-3">
          <DateNavigator />
        </div>
        <DayTimeline />
      </div>
      <div class="flex-1 h-full overflow-hidden bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
        <TripMap ref="dailyMapRef" class="h-full w-full rounded-2xl shadow-sm overflow-hidden" />
      </div>
    </div>

    <!-- Total view: flex (accordion fixed-width left, map fluid right) -->
    <div v-else class="flex-1 flex min-h-0 overflow-hidden">
      <!-- Left: scrollable accordion itinerary -->
      <div class="w-96 shrink-0 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 px-4 py-4 transition-colors">
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
              <div class="text-[11px] text-slate-400">일정 수</div>
              <div class="text-[13px] font-bold text-slate-900 dark:text-slate-100">
                {{ allDays.reduce((s, d) => s + d.items.length, 0) }}건
              </div>
            </div>
            <div class="text-right">
              <div class="text-[11px] text-slate-400">총 비용</div>
              <div class="text-[13px] font-bold text-slate-900 dark:text-slate-100">{{ won(totalCost) }}</div>
            </div>
          </div>
        </div>

        <!-- Per-day accordion cards -->
        <div
          v-for="day in allDays"
          :key="day.iso"
          class="shrink-0 rounded-xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all duration-150"
          :class="dropTargetDay === day.iso
            ? 'ring-2 ring-primary ring-dashed bg-primary/5 dark:bg-primary/10'
            : ''"
          @dragover="onDayDragOver($event, day.iso)"
          @dragleave="onDayDragLeave"
          @drop="onDayDrop($event, day.iso)"
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
            <div class="flex-1 min-w-0 flex items-center gap-2.5">
              <span
                class="px-2.5 py-1 rounded-lg text-[13px] font-bold border shrink-0"
                :style="{ backgroundColor: day.color.bg, borderColor: day.color.pin, color: day.color.fg }"
              >Day {{ day.dayNum }}</span>
              <span class="text-[15px] font-bold text-slate-900 dark:text-slate-100 truncate">{{ day.dateLabel }}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span
                v-if="dropTargetDay === day.iso"
                class="text-[11px] font-semibold text-primary animate-pulse"
              >여기에 추가</span>
              <span v-else class="text-[13px] font-semibold text-slate-600 dark:text-slate-300">{{ day.items.length }}건</span>
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
                <span class="shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-white text-[11px] font-bold">
                  {{ dayOffset[day.iso] + idx + 1 }}
                </span>
                <span class="text-sm shrink-0">{{ findCategory(item.category).emoji }}</span>
                <div class="flex-1 min-w-0">
                  <div class="text-[12px] font-semibold text-slate-900 dark:text-slate-100">{{ item.name }}</div>
                  <div class="text-[11px] text-slate-400">
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

      <!-- Right: map showing ALL trip pins (fluid) -->
      <div class="flex-1 h-full overflow-hidden bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
        <TripMap ref="totalMapRef" class="h-full w-full rounded-2xl shadow-sm overflow-hidden" :show-all="true" />
      </div>
    </div>

  </div>
</template>

<style scoped>
/* 접힘 상태에서는 높이 0으로 완전히 숨김(초기엔 안 보임). 펼칠 때만 슬라이드. */
.accordion-wrap {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.25s ease;
}
.accordion-open {
  max-height: 1000px;
  opacity: 1;
}
</style>
