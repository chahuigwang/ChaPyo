<script setup>
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronDown, Eye, EyeOff, Play, Square, MapPin } from 'lucide-vue-next'
import TripMap from './TripMap.vue'
import DayTimeline from './DayTimeline.vue'
import { useTripStore } from '@/stores/tripStore'
import { useUiStore } from '@/stores/uiStore'
import { dayColorFor } from '@/composables/useDayColor'
import { findCategory } from '@/types/itinerary'

// 둘러보기 자동 재생 간격(ms). 이 숫자만 바꾸면 즉시 반영됩니다.
const TOUR_INTERVAL_MS = 2000

const trip = useTripStore()
const ui = useUiStore()
const { sidebarOpen, tourMode } = storeToRefs(ui)
const { currentTrip, days, selectedDate } = storeToRefs(trip)

const listScroll = ref(null)

// 드래그(순서변경/다른 날 이동/플라이아웃 추가)는 DayTimeline 의 vuedraggable 공유 그룹이 전담.
// (펼쳐진 날짜에 드롭 가능 — 기본적으로 모든 날이 펼쳐져 있음)

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

// ── 둘러보기(자동 재생) 모드 ──────────────────────────────
// 여정 순서(Day 순 → 그 날 순서)로 평탄화한 아이템 목록(+Day 정보)
const tourItems = computed(() => {
  const t = currentTrip.value
  if (!t) return []
  const out = []
  ;(days.value || []).forEach((iso, idx) => {
    for (const it of (t.itemsByDay?.[iso] ?? [])) {
      out.push({ item: it, dayNum: idx + 1, color: dayColorFor(idx) })
    }
  })
  return out
})
const tourEnabled = computed(() => tourItems.value.length >= 2)
// 현재 active 아이템(오른쪽 정보 패널용)
const activeEntry = computed(() => tourItems.value.find((e) => e.item.id === ui.tourActiveId) ?? null)

let tourTimer = null
function stopTourTimer() { if (tourTimer) { clearInterval(tourTimer); tourTimer = null } }
function advanceTour() {
  const list = tourItems.value
  const idx = list.findIndex((e) => e.item.id === ui.tourActiveId)
  const next = idx + 1
  if (next >= list.length) {
    // 끝까지 도착 → 자동 종료
    exitTour()
    return
  }
  ui.setTourActive(list[next].item.id)
}
function enterTour() {
  if (!tourEnabled.value) return
  expanded.value = new Set((allDays.value || []).map((d) => d.iso))
  ui.setTourActive(tourItems.value[0].item.id)
  ui.setTourMode(true)
  nextTick(() => {
    listScroll.value?.scrollTo({ top: 0, behavior: 'auto' })
    mapRef.value?.onRelayout()
  })
  stopTourTimer()
  tourTimer = setInterval(advanceTour, TOUR_INTERVAL_MS)
}
function exitTour() {
  stopTourTimer()
  ui.setTourMode(false)
  nextTick(() => mapRef.value?.onRelayout())
}
function toggleTour() {
  tourMode.value ? exitTour() : enterTour()
}
onBeforeUnmount(stopTourTimer)
</script>

<template>
  <div class="flex-1 h-full flex flex-col min-h-0 relative">
    <div class="flex-1 flex min-h-0 overflow-hidden">
      <!-- Left: scrollable accordion itinerary (각 날짜 = 상세 타임라인) -->
      <div ref="listScroll" class="w-96 shrink-0 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 px-4 py-4 transition-colors">
        <div class="flex flex-col gap-3">

          <!-- Per-day accordion cards -->
          <div
            v-for="day in allDays"
            :key="day.iso"
            :ref="el => { if (el) dayRefs[day.iso] = el }"
            class="shrink-0 rounded-xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all duration-150"
            :class="ui.draggingDayIso === day.iso ? 'ring-2 ring-primary/40' : ''"
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
                <span class="text-[12px] font-semibold text-slate-600 dark:text-slate-300">{{ day.count }}건</span>
                <span v-if="day.cost" class="text-[12px] font-semibold text-primary">{{ won(day.cost) }}</span>
                <!-- 경로/핀 표시·숨김 토글 (눈 모양) — 둘러보기 중엔 숨김 -->
                <button
                  v-if="!tourMode"
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
        <div class="relative h-full w-full">
          <TripMap ref="mapRef" class="h-full w-full rounded-2xl shadow-sm overflow-hidden" :show-all="true" />
          <!-- 둘러보기 모드 토글 (지도 우상단) -->
          <button
            @click="toggleTour"
            :disabled="!tourMode && !tourEnabled"
            class="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[12px] font-semibold shadow-md backdrop-blur-md transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
            :class="tourMode
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white/90 dark:bg-slate-900/90 text-primary hover:bg-white'"
            :title="tourMode ? '둘러보기 종료' : '일정 둘러보기'"
          >
            <component :is="tourMode ? Square : Play" :size="14" :class="tourMode ? 'fill-white' : 'fill-primary'" />
            {{ tourMode ? '둘러보기 종료' : '둘러보기' }}
          </button>

          <!-- 둘러보기 현재 장소 정보 패널 (지도 우하단) -->
          <Transition name="tour-info">
            <div
              v-if="tourMode && activeEntry"
              :key="activeEntry.item.id"
              class="absolute bottom-4 right-4 z-10 w-72 max-w-[80%] rounded-2xl bg-white/95 dark:bg-slate-900/95 shadow-xl backdrop-blur-md overflow-hidden"
            >
              <div class="h-28 w-full bg-slate-100 dark:bg-slate-800">
                <img
                  v-if="activeEntry.item.firstImage"
                  :src="activeEntry.item.firstImage"
                  :alt="activeEntry.item.name"
                  class="w-full h-full object-cover"
                  draggable="false"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-[12px] text-slate-400">이미지 없음</div>
              </div>
              <div class="p-3.5">
                <div class="flex items-center gap-1.5 mb-1">
                  <span
                    class="px-2 py-0.5 rounded-md text-[11px] font-bold border"
                    :style="{ backgroundColor: activeEntry.color.bg, borderColor: activeEntry.color.pin, color: activeEntry.color.fg }"
                  >Day {{ activeEntry.dayNum }}</span>
                  <span class="text-[12px] text-slate-400">{{ findCategory(activeEntry.item.category).emoji }} {{ findCategory(activeEntry.item.category).label }}</span>
                </div>
                <h3 class="text-[15px] font-bold text-slate-900 dark:text-slate-100 truncate">{{ activeEntry.item.name }}</h3>
                <div v-if="activeEntry.item.address" class="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                  <MapPin :size="11" class="shrink-0" />
                  <span class="truncate">{{ activeEntry.item.address }}</span>
                </div>
                <p v-if="activeEntry.item.memo" class="mt-1.5 text-[12px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">{{ activeEntry.item.memo }}</p>
                <div v-if="activeEntry.item.cost" class="mt-1.5 text-[12px] font-semibold text-primary">{{ won(activeEntry.item.cost) }}</div>
              </div>
            </div>
          </Transition>
        </div>
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

/* 둘러보기 정보 패널 전환 (장소 바뀔 때) */
.tour-info-enter-active { transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.22,1,0.36,1); }
.tour-info-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; position: absolute; }
.tour-info-enter-from { opacity: 0; transform: translateY(12px) scale(0.97); }
.tour-info-leave-to { opacity: 0; transform: translateY(-8px) scale(0.98); }
</style>
