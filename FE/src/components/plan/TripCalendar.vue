<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useTripStore } from '@/stores/tripStore'
import { useStorageStore } from '@/stores/storageStore'
import { useChatStore } from '@/stores/chatStore'
import { useUiStore } from '@/stores/uiStore'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/common'
import { formatDayLabel } from '@/types/itinerary'

const trip = useTripStore()
const storage = useStorageStore()
const chat = useChatStore()
const ui = useUiStore()
const dropTarget = ref(null) // iso string when dragging over an in-range cell
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
  if (cell?.inRange) {
    trip.selectDate(cell.iso)
    ui.setCurrentView('daily')
  }
}

function onCellDragOver(e, cell) {
  if (!cell?.inRange || !storage.dragging) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'copy'
  dropTarget.value = cell.iso
}
function onCellDragLeave(cell) {
  if (dropTarget.value === cell?.iso) dropTarget.value = null
}
function onCellDrop(e, cell) {
  if (!cell?.inRange) return
  e.preventDefault()
  const payload = storage.dragging
  dropTarget.value = null
  if (!payload?.item) return
  if (payload.source === 'timeline' && payload.fromDate === cell.iso) {
    storage.clearDragging()
    return
  }
  const days = trip.days
  const idx = days.indexOf(cell.iso)
  const label = idx >= 0 ? formatDayLabel(cell.iso, idx) : cell.iso
  trip.addItemToDate(cell.iso, payload.item)
  if (payload.source === 'storage') storage.removeItem(payload.item.id)
  else if (payload.source === 'timeline') trip.removeItemFromDate(payload.fromDate, payload.item.id)
  chat.pushSystemNotice(`"${payload.item.name}"을(를) ${label}에 추가했어요.`)
  storage.clearDragging()
}
</script>

<template>
  <Card>
    <CardHeader>
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
            @dragover="onCellDragOver($event, cell)"
            @dragleave="onCellDragLeave(cell)"
            @drop="onCellDrop($event, cell)"
            :disabled="!cell.inRange"
            :class="[
              'h-8 rounded-md text-[12px] flex items-center justify-center transition-all',
              dropTarget === cell.iso
                ? 'ring-2 ring-primary ring-offset-1 ring-offset-white dark:ring-offset-slate-900 bg-primary/10 text-primary font-semibold scale-105'
                : cell.selected
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
