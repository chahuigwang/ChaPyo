<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTripStore } from '@/stores/tripStore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common'

const trip = useTripStore()
const { currentTrip, startDate, endDate } = storeToRefs(trip)

const totalCost = computed(() => {
  const t = currentTrip.value
  if (!t) return 0
  return Object.values(t.itemsByDay)
    .flat()
    .reduce((sum, i) => sum + (Number(i.cost) || 0), 0)
})

const totalDays = computed(() => {
  if (!startDate.value || !endDate.value) return 0
  const s = new Date(startDate.value)
  const e = new Date(endDate.value)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return 0
  return Math.round((e - s) / 86_400_000) + 1
})

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'

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
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>여행 요약</CardTitle>
    </CardHeader>

    <CardContent>
      <div class="flex flex-col gap-4">
        <!-- Date range inline: [label] left, [date] right -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between gap-4">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">출발</span>
            <input
              type="date"
              :value="startDate"
              @change="onStartChange"
              class="bg-transparent text-[13px] font-medium text-slate-900 dark:text-slate-100 outline-none cursor-pointer text-right"
            />
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">도착</span>
            <input
              type="date"
              :value="endDate"
              :min="startDate"
              @change="onEndChange"
              class="bg-transparent text-[13px] font-medium text-slate-900 dark:text-slate-100 outline-none cursor-pointer text-right"
            />
          </div>
        </div>

        <span class="h-px w-full bg-slate-200 dark:bg-slate-700" />

        <div class="flex items-center justify-between gap-4">
          <div class="flex flex-col">
            <span class="text-[10px] uppercase tracking-wider text-slate-400">기간</span>
            <span class="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">{{ totalDays }}일</span>
          </div>
          <div class="flex flex-col items-end">
            <span class="text-[10px] uppercase tracking-wider text-slate-400">총 비용</span>
            <span class="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">{{ won(totalCost) }}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
