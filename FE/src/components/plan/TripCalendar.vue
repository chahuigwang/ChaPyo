<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useTripStore } from '@/stores/tripStore'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/common'

const trip = useTripStore()
const { startDate, endDate, selectedDate, currentTrip } = storeToRefs(trip)

function onStartChange(e) {
  const v = e.target.value
  if (!v) return
  const end = v > endDate.value ? v : endDate.value
  trip.setRange(v, end)
}
function onEndChange(e) {
  const v = e.target.value
  if (!v) return
  if (v < startDate.value) return
  trip.setRange(startDate.value, v)
}

const cursor = ref(null)

function parseISO(s) {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  return { y, m, d }
}
function toISO(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function initCursor() {
  const base = parseISO(selectedDate.value) ?? parseISO(startDate.value)
  if (base) cursor.value = { year: base.y, month: base.m }
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
    arr.push({
      day: d,
      iso,
      inRange,
      isStart: iso === startISO,
      isEnd: iso === endISO,
      selected: iso === selectedDate.value,
    })
  }
  while (arr.length % 7 !== 0) arr.push(null)
  return arr
})

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

function pick(cell) {
  if (cell?.inRange) trip.selectDate(cell.iso)
}
</script>

<template>
  <Card>
    <CardHeader>
      <div class="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
        <input
          type="date"
          :value="startDate"
          @change="onStartChange"
          class="h-8 px-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs ring-1 ring-transparent focus:ring-primary outline-none shrink-0"
        />
        <span class="text-slate-400 dark:text-slate-500 shrink-0">→</span>
        <input
          type="date"
          :value="endDate"
          :min="startDate"
          @change="onEndChange"
          class="h-8 px-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs ring-1 ring-transparent focus:ring-primary outline-none shrink-0"
        />
      </div>
      <div class="flex items-center justify-between">
        <CardTitle>{{ monthLabel }}</CardTitle>
        <div class="flex gap-1">
          <Button variant="ghost" size="icon" @click="prev">
            <ChevronLeft :size="14" />
          </Button>
          <Button variant="ghost" size="icon" @click="next">
            <ChevronRight :size="14" />
          </Button>
        </div>
      </div>
    </CardHeader>

    <CardContent>
      <div class="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-2">
        <div v-for="w in weekdays" :key="w">{{ w }}</div>
      </div>

      <div class="grid grid-cols-7 gap-1">
        <template v-for="(cell, i) in cells" :key="i">
          <div v-if="!cell" class="h-8" />
          <button
            v-else
            @click="pick(cell)"
            :disabled="!cell.inRange"
            :class="[
              'h-8 rounded-md text-[12px] flex items-center justify-center transition-colors',
              cell.selected
                ? 'bg-primary text-primary-foreground font-semibold'
                : cell.inRange
                  ? 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                  : 'text-slate-300 dark:text-slate-600 cursor-not-allowed',
            ]"
          >
            {{ cell.day }}
          </button>
        </template>
      </div>
    </CardContent>
  </Card>
</template>
