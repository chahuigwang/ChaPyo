<script setup>
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronDown, Eye, EyeOff, Play, Square, MapPin, CalendarDays, Wallet, Users } from 'lucide-vue-next'
import TripMap from './TripMap.vue'
import DayTimeline from './DayTimeline.vue'
import { useTripStore } from '@/stores/tripStore'
import { useUiStore } from '@/stores/uiStore'
import { dayColorFor } from '@/composables/useDayColor'
import { findCategory } from '@/types/itinerary'
import { colorForUser } from '@/composables/useUserColor'

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
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}-${dd} (${WEEKDAYS[d.getDay()]})`
}

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'

const tripTotalDays = computed(() => {
  const t = currentTrip.value
  if (!t?.startDate || !t?.endDate) return 0
  const s = new Date(t.startDate), e = new Date(t.endDate)
  if (Number.isNaN(s.getTime()) || e < s) return 0
  return Math.round((e - s) / 86_400_000) + 1
})

const tripTotalCost = computed(() => {
  const t = currentTrip.value
  if (!t) return 0
  return Object.values(t.itemsByDay).flat().reduce((s, i) => s + (Number(i.cost) || 0), 0)
})

const tripMembers = computed(() => currentTrip.value?.members ?? [])

// 금액 드롭다운
const costOpen = ref(false)
function toggleCostOpen(e) { e.stopPropagation(); costOpen.value = !costOpen.value; membersOpen.value = false; daysOpen.value = false }
function closeCost() { costOpen.value = false }

// 인원 드롭다운
const membersOpen = ref(false)
function toggleMembersOpen(e) { e.stopPropagation(); membersOpen.value = !membersOpen.value; costOpen.value = false; daysOpen.value = false }
function closeMembers() { membersOpen.value = false }

// 날짜 드롭다운 + 루트 포커스
const daysOpen = ref(false)
function toggleDaysOpen(e) { e.stopPropagation(); daysOpen.value = !daysOpen.value; costOpen.value = false; membersOpen.value = false }
function closeDays() { daysOpen.value = false }

// 둘러보기 현재 아이템의 전체 순번
const activeEntryIndex = computed(() => tourItems.value.findIndex((e) => e.item.id === ui.tourActiveId))

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

const allDayIsos = computed(() => allDays.value.map((d) => d.iso))
const focusDayIso = computed(() => {
  const isos = allDayIsos.value
  const hiddenCount = isos.filter((iso) => ui.routeHiddenDays[iso]).length
  if (hiddenCount > 0 && hiddenCount === isos.length - 1) {
    return isos.find((iso) => !ui.routeHiddenDays[iso]) ?? null
  }
  return null
})

function selectDayFocus(iso) {
  ui.setDayFocus(focusDayIso.value === iso ? null : iso, allDayIsos.value)
  daysOpen.value = false
}

function closeAllDropdowns() {
  costOpen.value = false
  membersOpen.value = false
  daysOpen.value = false
}

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
  <div class="flex-1 h-full flex flex-col min-h-0 relative" @click="closeAllDropdowns">
    <div class="flex-1 flex min-h-0 overflow-hidden">
      <!-- Left: scrollable accordion itinerary (각 날짜 = 상세 타임라인) -->
      <div ref="listScroll" class="w-96 shrink-0 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 px-4 py-4 transition-colors">
        <div class="flex flex-col gap-3">

          <!-- Per-day accordion cards -->
          <div
            v-for="day in allDays"
            :key="day.iso"
            :ref="el => { if (el) dayRefs[day.iso] = el }"
            class="shrink-0 rounded-xl bg-white dark:bg-slate-900 shadow-sm transition-all duration-150"
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
              <div class="px-4 py-3">
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

          <!-- 지도 좌상단: 벤토 그리드 (날짜 · 인원 · 금액) -->
          <div v-if="currentTrip" class="absolute top-3 left-3 z-10 flex gap-1.5">

            <!-- 날짜 (클릭 시 일자 드롭다운 + 루트 포커스) -->
            <div class="relative">
              <button
                @click="toggleDaysOpen"
                class="flex items-center gap-1.5 h-9 px-3 rounded-xl shadow-md backdrop-blur-md transition-all hover:bg-white dark:hover:bg-slate-900"
                :class="focusDayIso
                  ? 'bg-primary text-white'
                  : 'bg-white/90 dark:bg-slate-900/90'"
              >
                <CalendarDays :size="13" class="shrink-0" :class="focusDayIso ? 'text-white' : 'text-primary'" />
                <span class="text-[12px] font-bold" :class="focusDayIso ? 'text-white' : 'text-slate-900 dark:text-slate-100'">
                  {{ focusDayIso ? `Day ${allDays.find(d=>d.iso===focusDayIso)?.dayNum}` : `${tripTotalDays}일` }}
                </span>
                <ChevronDown :size="11" class="transition-transform" :class="[daysOpen ? 'rotate-180' : '', focusDayIso ? 'text-white/70' : 'text-slate-400']" />
              </button>
              <Transition enter-active-class="transition-all duration-150 ease-out" enter-from-class="opacity-0 -translate-y-1" leave-active-class="transition-all duration-100 ease-in" leave-to-class="opacity-0 -translate-y-1">
                <div v-if="daysOpen" class="absolute top-full left-0 mt-1.5 w-52 rounded-xl bg-white dark:bg-slate-900 shadow-xl py-2 z-20">
                  <div class="px-3 pb-1.5 mb-1 border-b border-slate-100 dark:border-slate-800">
                    <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">날짜별 루트</p>
                  </div>
                  <button
                    @click.stop="selectDayFocus(null); daysOpen=false"
                    class="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    :class="!focusDayIso ? 'text-primary font-semibold' : 'text-slate-600 dark:text-slate-300'"
                  >
                    <span class="text-[12px]">전체 보기</span>
                  </button>
                  <button
                    v-for="day in allDays"
                    :key="day.iso"
                    @click.stop="selectDayFocus(day.iso)"
                    class="w-full flex items-center justify-between px-3 py-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    :class="focusDayIso === day.iso ? 'bg-primary/5 dark:bg-primary/10' : ''"
                  >
                    <div class="flex items-center gap-1.5">
                      <span class="text-[10px] font-bold px-1.5 py-0.5 rounded" :style="{ backgroundColor: day.color.bg, color: day.color.fg }">Day {{ day.dayNum }}</span>
                      <span class="text-[11px] text-slate-600 dark:text-slate-300">{{ day.dateLabel }}</span>
                    </div>
                    <span v-if="focusDayIso === day.iso" class="text-[10px] text-primary font-bold">표시 중</span>
                  </button>
                </div>
              </Transition>
            </div>

            <!-- 참여 인원 (클릭 시 멤버 목록) -->
            <div class="relative">
              <button
                @click="toggleMembersOpen"
                class="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/90 dark:bg-slate-900/90 shadow-md backdrop-blur-md transition-colors hover:bg-white dark:hover:bg-slate-900"
              >
                <Users :size="13" class="text-primary shrink-0" />
                <span class="text-[12px] font-bold text-slate-900 dark:text-slate-100">{{ tripMembers.length }}명</span>
                <ChevronDown :size="11" class="text-slate-400 transition-transform" :class="membersOpen ? 'rotate-180' : ''" />
              </button>
              <Transition enter-active-class="transition-all duration-150 ease-out" enter-from-class="opacity-0 -translate-y-1" leave-active-class="transition-all duration-100 ease-in" leave-to-class="opacity-0 -translate-y-1">
                <div v-if="membersOpen" class="absolute top-full left-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-slate-900 shadow-xl py-2 z-20">
                  <div class="px-3 pb-1.5 mb-1 border-b border-slate-100 dark:border-slate-800">
                    <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">참여 인원</p>
                  </div>
                  <div v-if="!tripMembers.length" class="px-3 py-2 text-[11px] text-slate-400">멤버 없음</div>
                  <div
                    v-for="m in tripMembers"
                    :key="m.userId ?? m.nickname"
                    class="flex items-center gap-2.5 px-3 py-1.5"
                  >
                    <span class="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      :style="{ backgroundColor: colorForUser(m.userId ?? m.nickname) }">
                      {{ (m.nickname || '?')[0] }}
                    </span>
                    <span class="text-[12px] font-medium text-slate-700 dark:text-slate-200 truncate">{{ m.nickname }}</span>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- 총 금액 (클릭 시 일자별 드롭다운) -->
            <div class="relative">
              <button
                @click="toggleCostOpen"
                class="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/90 dark:bg-slate-900/90 shadow-md backdrop-blur-md transition-colors hover:bg-white dark:hover:bg-slate-900"
              >
                <Wallet :size="13" class="text-primary shrink-0" />
                <span class="text-[12px] font-bold text-slate-900 dark:text-slate-100">{{ won(tripTotalCost) }}</span>
                <ChevronDown :size="11" class="text-slate-400 transition-transform" :class="costOpen ? 'rotate-180' : ''" />
              </button>
              <Transition enter-active-class="transition-all duration-150 ease-out" enter-from-class="opacity-0 -translate-y-1" leave-active-class="transition-all duration-100 ease-in" leave-to-class="opacity-0 -translate-y-1">
                <div v-if="costOpen" class="absolute top-full left-0 mt-1.5 w-52 rounded-xl bg-white dark:bg-slate-900 shadow-xl py-2 z-20">
                  <div class="px-3 pb-1.5 mb-1 border-b border-slate-100 dark:border-slate-800">
                    <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">일자별 비용</p>
                  </div>
                  <div v-for="day in allDays" :key="day.iso" class="flex items-center justify-between px-3 py-1.5">
                    <div class="flex items-center gap-1.5">
                      <span class="text-[10px] font-bold px-1.5 py-0.5 rounded" :style="{ backgroundColor: day.color.bg, color: day.color.fg }">Day {{ day.dayNum }}</span>
                      <span class="text-[11px] text-slate-500 dark:text-slate-400">{{ day.dateLabel }}</span>
                    </div>
                    <span class="text-[11px] font-bold" :class="day.cost ? 'text-primary' : 'text-slate-300 dark:text-slate-600'">{{ day.cost ? won(day.cost) : '—' }}</span>
                  </div>
                  <div class="mx-3 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">합계</span>
                    <span class="text-[12px] font-bold text-primary">{{ won(tripTotalCost) }}</span>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

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
              class="absolute bottom-4 right-4 z-10 w-[336px] max-w-[86%] rounded-2xl bg-white/95 dark:bg-slate-900/95 shadow-xl backdrop-blur-md overflow-hidden"
            >
              <!-- 진행 헤더: Day · 순번 · 전체 진행바 -->
              <div class="px-4 py-2.5 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700/60">
                <div class="flex items-center gap-2">
                  <span
                    class="px-2 py-0.5 rounded-md text-[11px] font-bold border"
                    :style="{ backgroundColor: activeEntry.color.bg, borderColor: activeEntry.color.pin, color: activeEntry.color.fg }"
                  >Day {{ activeEntry.dayNum }}</span>
                  <span class="text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                    {{ activeEntryIndex + 1 }}번째 일정
                  </span>
                </div>
                <span class="text-[11px] text-slate-400 tabular-nums">{{ activeEntryIndex + 1 }} / {{ tourItems.length }}</span>
              </div>
              <!-- 진행 바 -->
              <div class="h-1 bg-slate-100 dark:bg-slate-800">
                <div
                  class="h-full bg-primary transition-all duration-700 ease-out"
                  :style="{ width: `${((activeEntryIndex + 1) / tourItems.length) * 100}%` }"
                />
              </div>
              <!-- 이미지 -->
              <div class="h-36 w-full bg-slate-100 dark:bg-slate-800">
                <img
                  v-if="activeEntry.item.firstImage"
                  :src="activeEntry.item.firstImage"
                  :alt="activeEntry.item.name"
                  class="w-full h-full object-cover"
                  draggable="false"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-[12px] text-slate-400">이미지 없음</div>
              </div>
              <!-- 내용 -->
              <div class="p-4">
                <div class="flex items-center gap-1.5 mb-1.5">
                  <span class="text-[13px] text-slate-400">{{ findCategory(activeEntry.item.category).emoji }} {{ findCategory(activeEntry.item.category).label }}</span>
                </div>
                <h3 class="text-[16px] font-bold text-slate-900 dark:text-slate-100 leading-snug">{{ activeEntry.item.name }}</h3>
                <div v-if="activeEntry.item.address" class="mt-1.5 flex items-center gap-1 text-[12px] text-slate-400">
                  <MapPin :size="12" class="shrink-0" />
                  <span class="truncate">{{ activeEntry.item.address }}</span>
                </div>
                <p v-if="activeEntry.item.memo" class="mt-2 text-[12px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">{{ activeEntry.item.memo }}</p>
                <div v-if="activeEntry.item.cost" class="mt-2 text-[13px] font-bold text-primary">{{ won(activeEntry.item.cost) }}</div>
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
  /* 드래그 ghost가 카드 하단에서 잘리지 않도록 */
  overflow: visible;
  padding-bottom: 8px;
}

/* 둘러보기 정보 패널 전환 (장소 바뀔 때) */
.tour-info-enter-active { transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.22,1,0.36,1); }
.tour-info-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; position: absolute; }
.tour-info-enter-from { opacity: 0; transform: translateY(12px) scale(0.97); }
.tour-info-leave-to { opacity: 0; transform: translateY(-8px) scale(0.98); }
</style>
