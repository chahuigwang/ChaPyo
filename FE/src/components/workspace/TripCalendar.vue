<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-vue-next'
import { useTripStore } from '@/stores/tripStore'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'

const trip = useTripStore()
const { startDate, endDate, selectedDate, currentTrip } = storeToRefs(trip)

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
  <Card class="max-w-[340px] w-full">
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="inline-flex items-center gap-1.5">
          <CalendarDays :size="14" class="text-primary" />
          {{ monthLabel }}
        </CardTitle>
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
      <!-- 컴팩트 사이즈: 셀 28px(h-7) -->
      <div class="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-muted-foreground mb-1">
        <div v-for="(w, i) in weekdays" :key="w" :class="[i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : '']">
          {{ w }}
        </div>
      </div>

      <div class="grid grid-cols-7 gap-0.5">
        <template v-for="(cell, i) in cells" :key="i">
          <div v-if="!cell" class="h-7" />
          <button
            v-else
            @click="pick(cell)"
            :disabled="!cell.inRange"
            :class="[
              'h-7 rounded-md text-[11px] flex items-center justify-center relative transition-colors',
              cell.selected
                ? 'bg-primary text-primary-foreground font-semibold'
                : cell.inRange
                  ? 'bg-brand-50 text-brand-700 hover:bg-brand-100 cursor-pointer font-medium'
                  : 'text-slate-300 cursor-not-allowed',
            ]"
          >
            {{ cell.day }}
            <span
              v-if="(cell.isStart || cell.isEnd) && !cell.selected"
              class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-500"
            />
          </button>
        </template>
      </div>
    </CardContent>
  </Card>
</template>
