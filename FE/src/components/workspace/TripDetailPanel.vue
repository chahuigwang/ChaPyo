<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronDown, Eye, EyeOff } from 'lucide-vue-next'
import TripMap from './TripMap.vue'
import DayTimeline from './DayTimeline.vue'
import { useTripStore } from '@/stores/tripStore'
import { useUiStore } from '@/stores/uiStore'
import { useStorageStore } from '@/stores/storageStore'
import { useCollabStore } from '@/stores/collabStore'
import { dayColorFor } from '@/composables/useDayColor'

const trip = useTripStore()
const ui = useUiStore()
const storage = useStorageStore()
const collab = useCollabStore()
const { sidebarOpen } = storeToRefs(ui)
const { currentTrip, days, selectedDate } = storeToRefs(trip)

// ── Day-level drop zone (collapsed/expanded 날짜 카드에 보관함/다른 날 아이템 드롭) ──
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
  // 펼쳐진 날짜의 내부 타임라인이 이미 처리(stopPropagation)한 경우 dragging 은 비어 있다 → 무시
  if (!p?.item) { storage.clearDragging(); return }

  if (p.source === 'timeline' && p.fromDate === iso) {
    // 같은 날 내 순서 변경은 내부 타임라인이 담당 — 여기선 무시
  } else if (p.source === 'timeline') {
    trip.moveItemToDate(p.fromDate, iso, p.item.id)
    collab.pushHistory({ type: 'add', itemName: p.item.name, byName: collab.me.name })
  } else {
    trip.addItemToDate(iso, p.item)
    collab.pushHistory({ type: 'add', itemName: p.item.name, byName: collab.me.name })
  }
  storage.clearDragging()
}

// 드래그가 끝나면(드롭 완료/취소) 외부 날짜 카드의 "여기에 추가" 하이라이트를 항상 해제.
// (펼쳐진 날짜의 내부 타임라인이 stopPropagation으로 처리한 경우 외부 drop/dragleave가
//  호출되지 않아 dropTargetDay 가 남는 버그 방지)
watch(() => storage.dragging, (v) => {
  if (!v) dropTargetDay.value = null
})

const mapRef = ref(null)

watch(sidebarOpen, () => {
  nextTick(() => mapRef.value?.onRelayout())
})

// ── Accordion state: 펼쳐진 날짜 ISO 집합 ────────────────────
const expanded = ref(new Set())
const dayRefs = ref({})
let seeded = false

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

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'

const allDays = computed(() => {
  const t = currentTrip.value
  if (!t) return []
  return (days.value || []).map((iso, idx) => {
    const items = t.itemsByDay?.[iso] ?? []
    const cost = items.reduce((s, i) => s + (Number(i.cost) || 0) + (Number(i.transitAfter?.cost) || 0), 0)
    return {
      iso,
      dayNum: idx + 1,
      dateLabel: dateWithWeekday(iso),
      color: dayColorFor(idx),
      count: items.length,
      cost,
    }
  })
})

// 날짜 데이터가 처음 로드되면 전체 일정을 모두 펼쳐 바로 상세 일정이 보이게 한다.
watch(allDays, (list) => {
  if (!seeded && list.length) {
    expanded.value = new Set(list.map((d) => d.iso))
    seeded = true
  }
}, { immediate: true })

// 사이드바 달력에서 날짜를 고르면(selectedDate) 해당 날짜를 펼치고 스크롤한다.
watch(selectedDate, (iso) => {
  if (!iso) return
  if (!expanded.value.has(iso)) {
    const s = new Set(expanded.value)
    s.add(iso)
    expanded.value = s
  }
  nextTick(() => {
    dayRefs.value[iso]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
})

function toggleRoute(iso) {
  ui.toggleRouteDay(iso)
}
</script>

<template>
  <div class="flex-1 h-full flex flex-col min-h-0 relative">
    <div class="flex-1 flex min-h-0 overflow-hidden">
      <!-- Left: scrollable accordion itinerary (각 날짜 = 상세 타임라인) -->
      <div class="w-96 shrink-0 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 px-4 py-4 transition-colors">
        <div class="flex flex-col gap-3">

          <!-- Per-day accordion cards -->
          <div
            v-for="day in allDays"
            :key="day.iso"
            :ref="el => { if (el) dayRefs[day.iso] = el }"
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
                <template v-else>
                  <span class="text-[12px] font-semibold text-slate-600 dark:text-slate-300">{{ day.count }}건</span>
                  <span v-if="day.cost" class="text-[12px] font-semibold text-primary">{{ won(day.cost) }}</span>
                </template>
                <!-- 경로/핀 표시·숨김 토글 (눈 모양) -->
                <button
                  @click.stop="toggleRoute(day.iso)"
                  class="rounded-xl p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  :class="ui.isRouteHidden(day.iso)
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    : 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-500 hover:bg-cyan-100 dark:hover:bg-cyan-900/40'"
                  :title="ui.isRouteHidden(day.iso) ? '지도에 표시' : '지도에서 숨김'"
                >
                  <EyeOff v-if="ui.isRouteHidden(day.iso)" :size="13" />
                  <Eye v-else :size="13" />
                </button>
              </div>
            </div>

            <!-- Accordion content: 해당 날짜의 상세 타임라인 -->
            <div class="accordion-wrap" :class="expanded.has(day.iso) ? 'accordion-open' : ''">
              <div class="px-4 pb-3">
                <DayTimeline :date="day.iso" />
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
        <TripMap ref="mapRef" class="h-full w-full rounded-2xl shadow-sm overflow-hidden" :show-all="true" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 접힘 상태에서는 높이 0으로 완전히 숨김. 펼칠 때만 슬라이드. */
.accordion-wrap {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.25s ease;
}
.accordion-open {
  max-height: 4000px;
  opacity: 1;
}
</style>
