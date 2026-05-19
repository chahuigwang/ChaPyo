<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTripStore } from '@/stores/tripStore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common'

const trip = useTripStore()
const { currentTrip } = storeToRefs(trip)

const totalCost = computed(() => {
  const t = currentTrip.value
  if (!t) return 0
  return Object.values(t.itemsByDay)
    .flat()
    .reduce((sum, i) => sum + (Number(i.cost) || 0), 0)
})

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>여행 요약</CardTitle>
    </CardHeader>

    <CardContent>
      <div class="text-[12px] text-slate-500 dark:text-slate-400">총 비용</div>
      <div class="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{{ won(totalCost) }}</div>
    </CardContent>
  </Card>
</template>
