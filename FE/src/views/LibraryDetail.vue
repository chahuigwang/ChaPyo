<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  ChevronLeft, ChevronDown, Download, Trash2, Loader2, Eye,
  MapPin, Clock, CalendarDays, MapPinned, Wallet, Play, Square, Navigation, Heart,
} from 'lucide-vue-next'
import { useLibraryStore } from '@/stores/libraryStore'
import { useTripStore } from '@/stores/tripStore'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { useStorageStore } from '@/stores/storageStore'
import { dayColorFor } from '@/composables/useDayColor'
import { colorForUser } from '@/composables/useUserColor'
import { haversineKm } from '@/composables/useTimelineLogic'
import LibraryMap from '@/components/library/LibraryMap.vue'
import PlaceFocusPanel from '@/components/workspace/PlaceFocusPanel.vue'

const TOUR_INTERVAL_MS = 2000

const route = useRoute()
const router = useRouter()
const library = useLibraryStore()
const trip = useTripStore()
const auth = useAuthStore()
const ui = useUiStore()
const storage = useStorageStore()
const { detail, detailLoading, importingId } = storeToRefs(library)
const { user } = storeToRefs(auth)
const { focusedPlace } = storeToRefs(ui)

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'
const fmt = (n) => (Number(n) || 0).toLocaleString('ko-KR')
const timeLabel = (t) => (t ? String(t).slice(0, 5) : '')
const toNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null }

const libraryId = computed(() => Number(route.params.id))
const mine = computed(() => !!user.value?.nickname && detail.value?.nickname === user.value.nickname)
const importing = computed(() => importingId.value === libraryId.value)
const authorColor = computed(() => colorForUser(detail.value?.nickname ?? '?'))

function hexToRgba(hex, alpha = 1) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '')
  if (!m) return `rgba(0,0,0,${alpha})`
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`
}

const routesByFrom = computed(() => {
  const map = {}
  for (const r of (detail.value?.routes ?? [])) {
    if (r?.fromItemId != null) map[r.fromItemId] = r
  }
  return map
})

const dayGroups = computed(() => {
  const items = [...(detail.value?.items ?? [])]
  items.sort((a, b) => (a.dayNumber - b.dayNumber) || ((a.itemOrder ?? 0) - (b.itemOrder ?? 0)))
  const byDay = new Map()
  for (const it of items) {
    const d = it.dayNumber ?? 1
    if (!byDay.has(d)) byDay.set(d, [])
    byDay.get(d).push(it)
  }
  let globalNum = 0
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([dayNumber, list], idx) => ({
      dayNumber,
      color: dayColorFor(idx),
      items: list.map((it) => ({ ...it, _num: ++globalNum })),
    }))
})

const allDayNumbers = computed(() => dayGroups.value.map((g) => g.dayNumber))
const tourList = computed(() => dayGroups.value.flatMap((g) => g.items))

const totalDays = computed(() => dayGroups.value.length)
const totalPlaces = computed(() => (detail.value?.items ?? []).length)
const totalCost = computed(() => {
  const itemCost = (detail.value?.items ?? []).reduce((s, i) => s + (Number(i.cost) || 0), 0)
  const routeCost = (detail.value?.routes ?? []).reduce((s, r) => s + (Number(r.cost) || 0), 0)
  return itemCost + routeCost
})

const TRANSPORT_LABEL = { walk: '도보', bus: '버스', subway: '지하철', car: '자동차', taxi: '택시', train: '기차' }
const transportLabel = (t) => TRANSPORT_LABEL[t] ?? (t || '이동')

// 두 아이템 사이 거리(km)
function kmBetween(a, b) {
  const km = haversineKm(
    { lat: toNum(a.latitude), lng: toNum(a.longitude) },
    { lat: toNum(b.latitude), lng: toNum(b.longitude) },
  )
  return km != null ? km.toFixed(1) : null
}

// ── 아이템 클릭 → 상세 패널(읽기 전용) + 지도 펄스 ─────────────
function focusItemFrom(it) {
  return {
    id: it.itemId,
    itemId: it.itemId,
    placeId: it.placeId,
    name: it.title,
    category: it.category ?? 'place',
    address: it.addr1,
    firstImage: it.img,
    lat: toNum(it.latitude),
    lng: toNum(it.longitude),
    cost: it.cost,
    memo: it.memo,
  }
}
function selectItem(it) {
  ui.setFocusedPlace(focusItemFrom(it), { editable: false })
}
const activeId = computed(() => focusedPlace.value?.item?.itemId ?? null)

// ── Day 아코디언 ──────────────────────────────────────────────
const collapsed = ref(new Set())
function toggleDay(dayNumber) {
  const s = new Set(collapsed.value)
  s.has(dayNumber) ? s.delete(dayNumber) : s.add(dayNumber)
  collapsed.value = s
}

// ── 지도 Day 포커스 드롭다운 ──────────────────────────────────
const dayMenuOpen = ref(false)
const focusDay = ref(null) // null = 전체
const hiddenDays = computed(() => (focusDay.value == null ? [] : allDayNumbers.value.filter((d) => d !== focusDay.value)))
function selectFocusDay(d) { focusDay.value = d; dayMenuOpen.value = false }
function closeMenus() { dayMenuOpen.value = false }

// ── 둘러보기 ──────────────────────────────────────────────────
const touring = ref(false)
const tourEnabled = computed(() => tourList.value.length >= 2)
let tourTimer = null
function stopTourTimer() { if (tourTimer) { clearInterval(tourTimer); tourTimer = null } }
function advanceTour() {
  const list = tourList.value
  const idx = list.findIndex((it) => it.itemId === activeId.value)
  const next = idx + 1
  if (next >= list.length) { exitTour(); return }
  selectItem(list[next])
}
function enterTour() {
  if (!tourEnabled.value) return
  touring.value = true
  selectItem(tourList.value[0])
  stopTourTimer()
  tourTimer = setInterval(advanceTour, TOUR_INTERVAL_MS)
}
function exitTour() {
  stopTourTimer()
  touring.value = false
}
function toggleTour() { touring.value ? exitTour() : enterTour() }

// ── 상단 액션 ─────────────────────────────────────────────────
function goBack() { router.push('/list?tab=library') }
async function doImport() {
  const res = await library.importLibrary(libraryId.value)
  if (res.ok) { await trip.fetchTrips(); router.push('/list') }
}
const deleting = ref(false)
async function doDelete() {
  deleting.value = true
  const res = await library.remove(libraryId.value)
  deleting.value = false
  if (res.ok) router.push('/list?tab=library')
}

onMounted(() => {
  ui.clearFocusedPlace()
  library.fetchDetail(libraryId.value)
})
onBeforeUnmount(() => {
  stopTourTimer()
  ui.clearFocusedPlace()
})
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors" @click="closeMenus">
    <!-- 상단 바 -->
    <header class="shrink-0 flex items-center gap-3 px-5 h-16 bg-white dark:bg-slate-900 shadow-sm">
      <button
        @click="goBack"
        class="h-10 w-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
        title="라이브러리로"
      >
        <ChevronLeft :size="20" />
      </button>

      <div v-if="detail" class="min-w-0 flex-1">
        <h1 class="text-[16px] font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">{{ detail.title }}</h1>
        <div class="flex items-center gap-2 mt-0.5">
          <span class="h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
            :style="{ backgroundColor: authorColor }">{{ (detail.nickname || '?')[0] }}</span>
          <span class="text-[12px] text-slate-500 dark:text-slate-400 truncate">{{ detail.nickname }}</span>
          <span class="inline-flex items-center gap-1 text-[11px] text-slate-400"><Eye :size="12" /> {{ fmt(detail.viewCount) }}</span>
          <span class="inline-flex items-center gap-1 text-[11px] text-slate-400"><Download :size="12" /> {{ fmt(detail.importCount) }}</span>
        </div>
      </div>
      <div v-else class="flex-1" />

      <button
        v-if="mine"
        @click="doDelete"
        :disabled="deleting"
        class="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-[13px] font-medium text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 transition-colors shrink-0"
      >
        <Loader2 v-if="deleting" :size="15" class="animate-spin" />
        <Trash2 v-else :size="15" /> 삭제
      </button>
      <button
        @click="doImport"
        :disabled="importing"
        class="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all hover:-translate-y-0.5 shrink-0"
      >
        <Loader2 v-if="importing" :size="15" class="animate-spin" />
        <Download v-else :size="15" />
        내 여행으로 불러오기
      </button>
    </header>

    <!-- 로딩 -->
    <div v-if="detailLoading || !detail" class="flex-1 flex items-center justify-center text-slate-400">
      <Loader2 :size="28" class="animate-spin" />
    </div>

    <!-- 본문: 좌 Day 목록 / 우 지도 -->
    <div v-else class="flex-1 flex min-h-0 overflow-hidden">
      <!-- 좌측: Day 아코디언 -->
      <div class="w-[27rem] shrink-0 h-full overflow-y-auto px-4 py-4">
        <div v-if="detail.description" class="mb-3 rounded-xl bg-white dark:bg-slate-900 shadow-sm px-4 py-3 text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
          {{ detail.description }}
        </div>

        <div class="flex flex-col gap-3">
          <div
            v-for="group in dayGroups"
            :key="group.dayNumber"
            class="rounded-xl bg-white dark:bg-slate-900 shadow-sm"
            :style="{ backgroundColor: hexToRgba(group.color.pin, 0.05) }"
          >
            <!-- Day 헤더 -->
            <div
              class="px-4 py-3 flex items-center gap-2 cursor-pointer select-none rounded-t-xl"
              :style="{ backgroundColor: hexToRgba(group.color.pin, 0.09) }"
              @click="toggleDay(group.dayNumber)"
            >
              <ChevronDown
                :size="14"
                class="text-slate-400 shrink-0 transition-transform duration-300"
                :class="collapsed.has(group.dayNumber) ? '-rotate-90' : 'rotate-0'"
              />
              <span class="px-2.5 py-1 rounded-lg text-[13px] font-bold"
                :style="{ backgroundColor: group.color.bg, color: group.color.fg }">Day {{ group.dayNumber }}</span>
              <span class="text-[12px] font-semibold text-slate-500 dark:text-slate-400 ml-auto">{{ group.items.length }}곳</span>
            </div>

            <!-- 아이템 -->
            <div class="accordion-wrap" :class="collapsed.has(group.dayNumber) ? '' : 'accordion-open'">
              <div class="px-3 py-3 space-y-0.5">
                <template v-for="(it, i) in group.items" :key="it.itemId">
                  <div
                    class="flex gap-3 rounded-xl bg-white dark:bg-slate-800/50 shadow-sm p-2.5 cursor-pointer transition-all hover:shadow-md"
                    :class="activeId === it.itemId ? 'ring-2 ring-primary/50' : ''"
                    @click="selectItem(it)"
                  >
                    <div class="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img v-if="it.img" :src="it.img" :alt="it.title" class="w-full h-full object-cover" />
                      <div v-else class="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                        <MapPin :size="20" />
                      </div>
                      <span class="absolute top-1 left-1 inline-flex items-center justify-center h-5 w-5 rounded-full text-white text-[11px] font-bold shadow ring-2 ring-white dark:ring-slate-900"
                        :style="{ backgroundColor: group.color.pin }">{{ it._num }}</span>
                    </div>
                    <div class="min-w-0 flex-1 py-0.5">
                      <div class="flex items-start justify-between gap-1.5">
                        <h4 class="text-[14px] font-semibold text-slate-900 dark:text-slate-100 truncate">{{ it.title }}</h4>
                        <button
                          @click.stop="storage.toggleLike(it)"
                          class="shrink-0 -mt-0.5 -mr-0.5 h-6 w-6 rounded-lg flex items-center justify-center transition-colors"
                          :class="storage.isLiked(it)
                            ? 'text-red-500'
                            : 'text-slate-300 dark:text-slate-600 hover:text-red-400'"
                          :title="storage.isLiked(it) ? '좋아요 취소' : '좋아요'"
                        >
                          <Heart :size="15" :class="storage.isLiked(it) ? 'fill-red-500' : ''" />
                        </button>
                      </div>
                      <p v-if="it.addr1" class="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400 truncate">
                        <MapPin :size="11" class="shrink-0" /><span class="truncate">{{ it.addr1 }}</span>
                      </p>
                      <div class="mt-1 flex items-center gap-3 text-[11px]">
                        <span v-if="timeLabel(it.visitTime)" class="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Clock :size="11" /> {{ timeLabel(it.visitTime) }}
                        </span>
                        <span v-if="it.cost" class="font-semibold text-primary">{{ won(it.cost) }}</span>
                      </div>
                      <p v-if="it.memo" class="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{{ it.memo }}</p>
                    </div>
                  </div>

                  <!-- 이동: 거리 + (이동 정보) -->
                  <div
                    v-if="i < group.items.length - 1 && (kmBetween(it, group.items[i + 1]) || routesByFrom[it.itemId])"
                    class="flex items-center gap-2 pl-8 py-1 text-[11px] text-slate-400"
                  >
                    <span class="h-3 w-px bg-slate-200 dark:bg-slate-700" />
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                      <Navigation :size="10" class="text-primary" />
                      <template v-if="kmBetween(it, group.items[i + 1])">{{ kmBetween(it, group.items[i + 1]) }}km</template>
                      <template v-if="routesByFrom[it.itemId]">
                        · {{ transportLabel(routesByFrom[it.itemId].transport) }}
                        <template v-if="routesByFrom[it.itemId].moveTime"> · {{ routesByFrom[it.itemId].moveTime }}분</template>
                        <template v-if="routesByFrom[it.itemId].cost"> · {{ won(routesByFrom[it.itemId].cost) }}</template>
                      </template>
                    </span>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <div v-if="!dayGroups.length" class="rounded-xl bg-white dark:bg-slate-900 shadow-sm p-8 text-center text-[12px] text-slate-400">
            등록된 일정이 없습니다.
          </div>
        </div>
      </div>

      <!-- 우측: 지도 + 요약 칩 + 상세 패널 + 둘러보기 -->
      <div class="flex-1 h-full overflow-hidden p-4">
        <div class="relative h-full w-full">
          <div class="h-full w-full rounded-2xl shadow-sm overflow-hidden">
            <LibraryMap
              :day-groups="dayGroups"
              :active-id="activeId"
              :hidden-days="hiddenDays"
              @pin-click="selectItem"
            />
          </div>

          <!-- 좌상단: 요약 칩 + Day 포커스 드롭다운 -->
          <div class="absolute top-3 left-3 z-10 flex gap-2">
            <div class="relative">
              <button
                @click.stop="dayMenuOpen = !dayMenuOpen"
                class="inline-flex items-center gap-2 h-10 px-4 rounded-xl shadow-md backdrop-blur-md transition-all"
                :class="focusDay != null ? 'bg-primary text-white' : 'bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900'"
              >
                <CalendarDays :size="15" :class="focusDay != null ? 'text-white' : 'text-primary'" />
                <span class="text-[13px] font-bold" :class="focusDay != null ? 'text-white' : 'text-slate-900 dark:text-slate-100'">
                  {{ focusDay != null ? `Day ${focusDay}` : `${totalDays}일` }}
                </span>
                <ChevronDown :size="13" class="transition-transform" :class="[dayMenuOpen ? 'rotate-180' : '', focusDay != null ? 'text-white/70' : 'text-slate-400']" />
              </button>
              <Transition enter-active-class="transition-all duration-150 ease-out" enter-from-class="opacity-0 -translate-y-1" leave-active-class="transition-all duration-100 ease-in" leave-to-class="opacity-0 -translate-y-1">
                <div v-if="dayMenuOpen" class="absolute top-full left-0 mt-2 w-44 rounded-xl bg-white dark:bg-slate-900 shadow-xl py-2 z-20" @click.stop>
                  <button
                    @click="selectFocusDay(null)"
                    class="w-full flex items-center px-4 py-2 text-left text-[13px] transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    :class="focusDay == null ? 'text-primary font-semibold' : 'text-slate-600 dark:text-slate-300'"
                  >전체 보기</button>
                  <button
                    v-for="g in dayGroups"
                    :key="g.dayNumber"
                    @click="selectFocusDay(g.dayNumber)"
                    class="w-full flex items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    :class="focusDay === g.dayNumber ? 'bg-primary/5 dark:bg-primary/10' : ''"
                  >
                    <span class="text-[11px] font-bold px-2 py-0.5 rounded" :style="{ backgroundColor: g.color.bg, color: g.color.fg }">Day {{ g.dayNumber }}</span>
                    <span class="text-[12px] text-slate-600 dark:text-slate-300">{{ g.items.length }}곳</span>
                  </button>
                </div>
              </Transition>
            </div>

            <span class="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white/90 dark:bg-slate-900/90 shadow-md backdrop-blur-md text-[13px] font-bold text-slate-900 dark:text-slate-100">
              <MapPinned :size="15" class="text-primary" /> {{ totalPlaces }}곳
            </span>
            <span v-if="totalCost" class="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white/90 dark:bg-slate-900/90 shadow-md backdrop-blur-md text-[13px] font-bold text-primary">
              <Wallet :size="15" /> {{ won(totalCost) }}
            </span>
          </div>

          <!-- 좌하단: 둘러보기 -->
          <button
            @click.stop="toggleTour"
            :disabled="!touring && !tourEnabled"
            class="absolute bottom-3 left-3 z-10 inline-flex items-center gap-2 h-11 px-5 rounded-xl text-[14px] font-semibold shadow-md backdrop-blur-md transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
            :class="touring ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white/90 dark:bg-slate-900/90 text-primary hover:bg-white'"
            :title="touring ? '둘러보기 종료' : '일정 둘러보기'"
          >
            <component :is="touring ? Square : Play" :size="17" :class="touring ? 'fill-white' : 'fill-primary'" />
            {{ touring ? '둘러보기 종료' : '둘러보기' }}
          </button>

          <!-- 우측: 상세 패널(읽기 전용) -->
          <PlaceFocusPanel
            :item="focusedPlace?.item ?? null"
            :editable="false"
            :reviews-writable="false"
            @close="ui.clearFocusedPlace()"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.accordion-wrap {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.25s ease;
}
.accordion-open {
  max-height: 4000px;
  opacity: 1;
  overflow: visible;
}
</style>
