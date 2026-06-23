<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight, Pencil, Check, Trash2, Loader2 } from 'lucide-vue-next'
import { useTripStore } from '@/stores/tripStore'
import { CATEGORIES } from '@/types/itinerary'
import { computeCostSplit } from '@/composables/useCostSplit'
import CustomCalendar from '@/components/common/CustomCalendar.vue'

const router = useRouter()
const trip = useTripStore()
const { startDate, endDate, selectedDate, currentTrip, title } = storeToRefs(trip)

const titleEditing = ref(false)
const titleDraft = ref('')
function startTitleEdit() { titleDraft.value = title.value; titleEditing.value = true }
function saveTitle() { trip.setTitle(titleDraft.value); titleEditing.value = false }
function onTitleKeydown(e) { if (e.key === 'Enter') saveTitle(); else if (e.key === 'Escape') titleEditing.value = false }

// ── Date inputs ──────────────────────────────────────────────
// 기간을 줄여 범위를 벗어나는 일정이 있으면 삭제 경고 후 진행
function applyRange(start, end) {
  const removed = trip.itemsOutsideRange(start, end)
  if (removed > 0 && !window.confirm(
    `여행 기간을 줄이면 범위를 벗어나는 일정 ${removed}개가 삭제됩니다.\n계속하시겠습니까?`,
  )) return
  trip.setRange(start, end)
}
function onStartChange(v) {
  if (!v) return
  const end = v > endDate.value ? v : endDate.value
  applyRange(v, end)
}
function onEndChange(v) {
  if (!v || v < startDate.value) return
  applyRange(startDate.value, v)
}

// ── Calendar ─────────────────────────────────────────────────
function parseISO(s) {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  return { y, m, d }
}
function toISO(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

const cursor = ref(null)
function initCursor() {
  const base = parseISO(selectedDate.value) ?? parseISO(startDate.value)
  if (base) cursor.value = { year: base.y, month: base.m }
  else cursor.value = { year: new Date().getFullYear(), month: new Date().getMonth() + 1 }
}
initCursor()
watch(() => currentTrip.value?.id, () => { initCursor(); deletePending.value = false })
watch(selectedDate, (v) => {
  const p = parseISO(v)
  if (p) cursor.value = { year: p.y, month: p.m }
})

const monthLabel = computed(() => `${cursor.value.year}년 ${cursor.value.month}월`)
function prev() {
  let { year, month } = cursor.value
  if (month === 1) { year--; month = 12 } else month--
  cursor.value = { year, month }
}
function next() {
  let { year, month } = cursor.value
  if (month === 12) { year++; month = 1 } else month++
  cursor.value = { year, month }
}

const cells = computed(() => {
  const { year, month } = cursor.value
  const first = new Date(year, month - 1, 1)
  const startDow = first.getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const startISO = startDate.value
  const endISO = endDate.value
  const arr = []
  for (let i = 0; i < startDow; i++) arr.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toISO(year, month, d)
    const inRange = !!startISO && !!endISO && iso >= startISO && iso <= endISO
    arr.push({ day: d, iso, inRange, isStart: iso === startISO, isEnd: iso === endISO, selected: iso === selectedDate.value })
  }
  while (arr.length % 7 !== 0) arr.push(null)
  return arr
})

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

function pick(cell) {
  if (!cell?.inRange) return
  // 날짜 선택 → 전체 일정에서 해당 날짜가 자동으로 펼쳐지고 스크롤된다.
  trip.selectDate(cell.iso)
}

// ── Summary stats ─────────────────────────────────────────────
const totalDays = computed(() => {
  if (!startDate.value || !endDate.value) return 0
  const s = new Date(startDate.value)
  const e = new Date(endDate.value)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return 0
  return Math.round((e - s) / 86_400_000) + 1
})

const totalCost = computed(() => {
  const t = currentTrip.value
  if (!t) return 0
  return Object.values(t.itemsByDay).flat().reduce((sum, i) => sum + (Number(i.cost) || 0), 0)
})

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'

// ── Category breakdown ────────────────────────────────────────
const CATEGORY_COLORS = {
  place:     { bar: 'bg-sky-400',    text: 'text-sky-600 dark:text-sky-400' },
  food:      { bar: 'bg-orange-400', text: 'text-orange-600 dark:text-orange-400' },
  lodging:   { bar: 'bg-violet-400', text: 'text-violet-600 dark:text-violet-400' },
  transport: { bar: 'bg-emerald-400',text: 'text-emerald-600 dark:text-emerald-400' },
}

const categoryStats = computed(() => {
  const t = currentTrip.value
  if (!t) return []
  const allItems = Object.values(t.itemsByDay).flat()
  const total = allItems.length
  return CATEGORIES.map((cat) => {
    const count = allItems.filter((i) => i.category === cat.id).length
    const pct = total > 0 ? Math.round((count / total) * 100) : 0
    return { ...cat, count, pct, color: CATEGORY_COLORS[cat.id] }
  })
})

const hasAnyItem = computed(() => categoryStats.value.some((s) => s.count > 0))

// ── 유저별 비용 분담 ──────────────────────────────────────────
const costSplit = computed(() => {
  const t = currentTrip.value
  if (!t) return { rows: [], total: 0, perShare: 0 }
  const items = Object.values(t.itemsByDay).flat()
  return computeCostSplit(items, t.members ?? [])
})

// ── 여행 삭제 (2단계 확인) ───────────────────────────────────
const deletePending = ref(false)
const deleting = ref(false)
async function confirmDeleteTrip() {
  const id = currentTrip.value?.id
  if (!id || deleting.value) return
  deleting.value = true
  await trip.deleteTrip(id)
  deleting.value = false
  deletePending.value = false
  router.push('/list')
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 overflow-y-auto">
    <div class="px-5 pt-5 pb-3">
      <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">여행 요약</h2>

      <!-- Trip Title Edit -->
      <div class="mb-4">
        <p class="text-sm font-medium text-slate-400 mb-1.5">여행 이름</p>
        <div
          v-if="!titleEditing"
          class="group flex items-center justify-between gap-2 cursor-pointer rounded-xl
                 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5
                 ring-1 ring-transparent hover:ring-primary/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          @click="startTitleEdit"
          title="클릭해서 이름 수정"
        >
          <span class="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight truncate flex-1">
            {{ title || '여행 제목 없음' }}
          </span>
          <Pencil :size="18" class="shrink-0 text-primary" />
        </div>
        <div v-else class="flex items-stretch gap-2">
          <input
            v-model="titleDraft"
            @keydown="onTitleKeydown"
            autofocus
            class="flex-1 min-w-0 text-lg font-bold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800
                   rounded-xl px-3.5 py-2 border-2 border-primary outline-none leading-tight"
          />
          <button @click="saveTitle" class="w-11 shrink-0 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90">
            <Check :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- 1. 출발 -->
    <div class="mx-5 mb-2 flex items-center justify-between rounded-lg px-4 py-3
                bg-sky-50 dark:bg-sky-900/15 transition-colors">
      <span class="text-[15px] font-bold uppercase tracking-widest text-sky-500 dark:text-sky-400">FROM</span>
      <CustomCalendar :model-value="startDate" @update:model-value="onStartChange" />
    </div>

    <!-- 2. 캘린더 -->
    <div class="px-4 pb-2">
      <div class="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
        <!-- Month nav -->
        <div class="flex items-center justify-between mb-3">
          <span class="text-[13px] font-semibold text-slate-900 dark:text-slate-100">{{ monthLabel }}</span>
          <div class="flex gap-0.5">
            <button @click="prev" class="h-7 w-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <ChevronLeft :size="14" />
            </button>
            <button @click="next" class="h-7 w-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <ChevronRight :size="14" />
            </button>
          </div>
        </div>

        <!-- Weekdays -->
        <div class="grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1">
          <div v-for="w in weekdays" :key="w">{{ w }}</div>
        </div>

        <!-- Cells -->
        <div class="grid grid-cols-7 gap-0.5">
          <template v-for="(cell, i) in cells" :key="i">
            <div v-if="!cell" class="h-7" />
            <button
              v-else
              @click="pick(cell)"
              :disabled="!cell.inRange"
              :class="[
                'h-7 rounded-md text-[11px] flex items-center justify-center transition-all',
                cell.selected
                  ? 'bg-primary text-white font-semibold'
                  : cell.inRange
                    ? 'text-slate-900 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-700 cursor-pointer font-medium'
                    : 'text-slate-300 dark:text-slate-600 cursor-not-allowed',
              ]"
            >{{ cell.day }}</button>
          </template>
        </div>
      </div>
    </div>

    <!-- 3. 도착 -->
    <div class="mx-5 mb-5 flex items-center justify-between rounded-lg px-4 py-3
                bg-sky-50 dark:bg-sky-900/15 transition-colors">
      <span class="text-[15px] font-bold uppercase tracking-widest text-sky-500 dark:text-sky-400">TO</span>
      <CustomCalendar :model-value="endDate" :min-date="startDate" @update:model-value="onEndChange" />
    </div>

    <!-- 4. 요약 (총 기간 + 총 비용) -->
    <div class="px-5 pb-2">
      <div class="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-4 flex items-center justify-between">
        <div class="flex flex-col">
          <span class="text-[13px] font-semibold text-slate-500 dark:text-slate-400">총 기간</span>
          <span class="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">{{ totalDays }}일</span>
        </div>
        <div class="flex flex-col items-end">
          <span class="text-[13px] font-semibold text-slate-500 dark:text-slate-400">총 비용</span>
          <span class="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">{{ won(totalCost) }}</span>
        </div>
      </div>
    </div>


    <!-- 5-1. 유저별 비용 분담 -->
    <div v-if="costSplit.rows.length" class="px-5 pb-2">
      <div class="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-4">
        <div class="flex items-center justify-between mb-3">
          <p class="text-[13px] font-semibold text-slate-500 dark:text-slate-400">멤버별 정산</p>
        </div>
        <div class="space-y-2.5">
          <div
            v-for="row in costSplit.rows"
            :key="row.userId ?? row.nickname"
            class="flex items-center gap-2.5"
          >
            <span class="h-2.5 w-2.5 rounded-full shrink-0" :style="{ backgroundColor: row.color }" />
            <span class="text-[12px] font-medium text-slate-700 dark:text-slate-200 truncate flex-1">{{ row.nickname }}</span>
            <span class="text-[12px] font-bold text-slate-900 dark:text-slate-100 shrink-0">{{ won(row.amount) }}</span>
          </div>
        </div>
      </div>
    </div>
    <!-- 5. 카테고리 분포 -->
    <div class="px-5 pb-6">
      <div class="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-4">
        <p class="text-[13px] font-semibold text-slate-500 dark:text-slate-400 mb-3">일정 구성</p>

        <div v-if="hasAnyItem" class="space-y-2.5">
          <div
            v-for="cat in categoryStats"
            :key="cat.id"
            class="flex items-center gap-2.5"
          >
            <span class="text-base w-5 shrink-0 leading-none">{{ cat.emoji }}</span>
            <div class="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="cat.color.bar"
                :style="{ width: cat.pct + '%' }"
              />
            </div>
            <span class="text-[11px] font-semibold w-4 text-right shrink-0"
                  :class="cat.count > 0 ? cat.color.text : 'text-slate-300 dark:text-slate-600'">
              {{ cat.count }}
            </span>
          </div>
        </div>

        <p v-else class="text-[11px] text-slate-400 dark:text-slate-500 text-center py-1">
          아직 일정이 없습니다.
        </p>
      </div>
    </div>

    <!-- 6. 여행 삭제 (소유자만) -->
    <div v-if="currentTrip?.isOwner" class="px-5 pb-6 mt-auto">
      <button
        v-if="!deletePending"
        @click="deletePending = true"
        class="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-[12px] font-medium
               text-red-500 bg-red-50/70 dark:bg-red-900/15 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
      >
        <Trash2 :size="14" /> 여행 삭제
      </button>
      <div v-else class="flex flex-col gap-2">
        <p class="text-[13px] text-red-500 font-semibold text-center">
          이 여행을 삭제할까요? 되돌릴 수 없습니다.
        </p>
        <div class="flex gap-2">
          <button
            @click="deletePending = false"
            :disabled="deleting"
            class="flex-1 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-[12px] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >취소</button>
          <button
            @click="confirmDeleteTrip"
            :disabled="deleting"
            class="flex-1 h-9 rounded-xl bg-red-500 text-white text-[12px] font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Loader2 v-if="deleting" :size="13" class="animate-spin" />
            <Trash2 v-else :size="13" />
            삭제
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
