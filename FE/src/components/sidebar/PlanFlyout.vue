<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronLeft, ChevronRight, Pencil, Check } from 'lucide-vue-next'
import { useTripStore } from '@/stores/tripStore'
import { useUiStore } from '@/stores/uiStore'
import CustomCalendar from '@/components/common/CustomCalendar.vue'

const trip = useTripStore()
const ui = useUiStore()
const { startDate, endDate, selectedDate, currentTrip, title } = storeToRefs(trip)
const { currentView } = storeToRefs(ui)

const titleEditing = ref(false)
const titleDraft = ref('')
function startTitleEdit() { titleDraft.value = title.value; titleEditing.value = true }
function saveTitle() { trip.setTitle(titleDraft.value); titleEditing.value = false }
function onTitleKeydown(e) { if (e.key === 'Enter') saveTitle(); else if (e.key === 'Escape') titleEditing.value = false }

// ── Date inputs ──────────────────────────────────────────────
function onStartChange(v) {
  if (!v) return
  const end = v > endDate.value ? v : endDate.value
  trip.setRange(v, end)
}
function onEndChange(v) {
  if (!v || v < startDate.value) return
  trip.setRange(startDate.value, v)
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
watch(() => currentTrip.value?.id, initCursor)
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
  trip.selectDate(cell.iso)
  ui.setCurrentView('daily')
}

function clearSelection() {
  ui.setCurrentView('total')
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
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 overflow-y-auto">
    <div class="px-5 pt-5 pb-3">
      <h2 class="text-[11px] uppercase tracking-wider text-slate-400 mb-2">여행 설정</h2>

      <!-- Trip Title Edit -->
      <div class="mb-4">
        <div v-if="!titleEditing" class="group flex items-center gap-2 cursor-pointer" @click="startTitleEdit">
          <span class="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight truncate flex-1">
            {{ title || '여행 제목 없음' }}
          </span>
          <Pencil :size="14" class="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
        </div>
        <div v-else class="flex items-center gap-1.5">
          <input
            v-model="titleDraft"
            @keydown="onTitleKeydown"
            autofocus
            class="flex-1 text-xl font-bold text-slate-900 dark:text-slate-100 bg-transparent border-b-2 border-primary outline-none leading-tight py-0.5"
          />
          <button @click="saveTitle" class="h-7 w-7 rounded-md bg-primary text-white flex items-center justify-center hover:bg-primary/90">
            <Check :size="13" />
          </button>
        </div>
      </div>
    </div>

    <!-- 1. 출발 -->
    <div class="mx-5 mb-3 flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
      <span class="text-lg font-semibold text-gray-900 dark:text-slate-100">출발</span>
      <CustomCalendar :model-value="startDate" @update:model-value="onStartChange" />
    </div>

    <!-- 2. 캘린더 -->
    <div class="px-4 pb-4">
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
        <div class="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-1">
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

        <!-- 전체 일정 보기 -->
        <button
          v-if="currentView === 'daily'"
          @click="clearSelection"
          class="mt-3 w-full text-center text-[11px] text-primary hover:underline transition-all"
        >
          ← 전체 일정 보기
        </button>
      </div>
    </div>

    <!-- 3. 도착 -->
    <div class="mx-5 mb-5 flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
      <span class="text-lg font-semibold text-gray-900 dark:text-slate-100">도착</span>
      <CustomCalendar :model-value="endDate" :min-date="startDate" @update:model-value="onEndChange" />
    </div>

    <!-- 4. 요약 (총 기간 + 총 비용) -->
    <div class="px-5 pb-6">
      <div class="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-4 flex items-center justify-between">
        <div class="flex flex-col">
          <span class="text-[10px] uppercase tracking-wider text-slate-400">총 기간</span>
          <span class="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">{{ totalDays }}일</span>
        </div>
        <div class="flex flex-col items-end">
          <span class="text-[10px] uppercase tracking-wider text-slate-400">총 비용</span>
          <span class="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">{{ won(totalCost) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
