<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import {
  Wallet, MapPin, BedDouble, Utensils, Train,
  TrendingUp, CalendarRange, Sparkles, Trophy,
} from 'lucide-vue-next'
import { useTripStore } from '@/stores/tripStore'
import { enumerateDays, findCategory } from '@/domain/itinerary'
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui'

const trip = useTripStore()
const { currentTrip, startDate, endDate } = storeToRefs(trip)

const allItems = computed(() => {
  const t = currentTrip.value
  if (!t) return []
  return Object.values(t.itemsByDay).flat()
})

const totalCost = computed(() =>
  allItems.value.reduce((sum, i) => sum + (Number(i.cost) || 0), 0)
)

const dayCount = computed(() => enumerateDays(startDate.value, endDate.value).length || 1)
const avgPerDay = computed(() => Math.round(totalCost.value / dayCount.value))

const countBy = (cat) => allItems.value.filter((i) => i.category === cat).length
const lodgingCount = computed(() => countBy('lodging'))
const foodCount = computed(() => countBy('food'))
const placeCount = computed(() => countBy('place'))
const transportCount = computed(() => countBy('transport'))

// 카테고리 분포 비율 (시각화용)
const distribution = computed(() => {
  const total = allItems.value.length || 1
  return ['place', 'food', 'lodging', 'transport'].map((id) => ({
    id,
    label: findCategory(id).label,
    emoji: findCategory(id).emoji,
    count: countBy(id),
    pct: Math.round((countBy(id) / total) * 100),
  }))
})

// 가장 비싼 일정
const topCost = computed(() => {
  const items = allItems.value.filter((i) => Number(i.cost) > 0)
  if (!items.length) return null
  return items.reduce((a, b) => (Number(b.cost) > Number(a.cost) ? b : a))
})

// 가장 바쁜 날
const busiestDay = computed(() => {
  const t = currentTrip.value
  if (!t) return null
  let best = null
  for (const [date, list] of Object.entries(t.itemsByDay)) {
    if (!best || list.length > best.count) best = { date, count: list.length }
  }
  return best?.count ? best : null
})

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'
const md = (iso) => {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${Number(m)}/${Number(d)}`
}
</script>

<template>
  <Card class="h-full">
    <CardHeader>
      <CardTitle class="inline-flex items-center gap-1.5">
        <Sparkles :size="14" class="text-primary" /> 여행 요약
      </CardTitle>
    </CardHeader>

    <CardContent>
      <!-- 5% accent: 핵심 비용 카드 (flat) -->
      <div class="rounded-md border border-border bg-muted/40 p-3 mb-3">
        <div class="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Wallet :size="12" /> 예상 총 비용
        </div>
        <div class="mt-0.5 text-xl font-bold tracking-tight text-foreground">{{ won(totalCost) }}</div>
        <div class="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span class="inline-flex items-center gap-1">
            <CalendarRange :size="11" /> {{ dayCount }}일 · {{ allItems.length }}건
          </span>
          <span class="inline-flex items-center gap-1">
            <TrendingUp :size="11" /> 1일 {{ won(avgPerDay) }}
          </span>
        </div>
      </div>

      <!-- 25% secondary: 카테고리 카운트 -->
      <div class="grid grid-cols-4 gap-1.5 text-[11px] mb-3">
        <div class="rounded-md border border-border p-2 text-center">
          <BedDouble :size="12" class="mx-auto text-muted-foreground" />
          <div class="mt-0.5 text-sm font-semibold text-foreground">{{ lodgingCount }}</div>
          <div class="text-muted-foreground">숙소</div>
        </div>
        <div class="rounded-md border border-border p-2 text-center">
          <MapPin :size="12" class="mx-auto text-muted-foreground" />
          <div class="mt-0.5 text-sm font-semibold text-foreground">{{ placeCount }}</div>
          <div class="text-muted-foreground">관광</div>
        </div>
        <div class="rounded-md border border-border p-2 text-center">
          <Utensils :size="12" class="mx-auto text-muted-foreground" />
          <div class="mt-0.5 text-sm font-semibold text-foreground">{{ foodCount }}</div>
          <div class="text-muted-foreground">식당</div>
        </div>
        <div class="rounded-md border border-border p-2 text-center">
          <Train :size="12" class="mx-auto text-muted-foreground" />
          <div class="mt-0.5 text-sm font-semibold text-foreground">{{ transportCount }}</div>
          <div class="text-muted-foreground">이동</div>
        </div>
      </div>

      <!-- 카테고리 분포 막대 -->
      <div class="mb-3">
        <div class="text-[11px] font-medium text-muted-foreground mb-1.5">카테고리 분포</div>
        <div v-if="allItems.length" class="space-y-1">
          <div v-for="d in distribution" :key="d.id" class="flex items-center gap-2 text-[11px]">
            <span class="w-12 text-muted-foreground">{{ d.emoji }} {{ d.label }}</span>
            <div class="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                class="h-full bg-brand-500 transition-all"
                :style="{ width: d.pct + '%' }"
              />
            </div>
            <span class="w-8 text-right font-medium text-foreground">{{ d.pct }}%</span>
          </div>
        </div>
        <div v-else class="text-[11px] text-muted-foreground italic">아직 일정이 없어요</div>
      </div>

      <!-- 하이라이트 -->
      <div class="space-y-1.5 text-[11px]">
        <div v-if="topCost" class="flex items-center justify-between rounded-md bg-muted/60 px-2 py-1.5">
          <span class="inline-flex items-center gap-1 text-muted-foreground">
            <Trophy :size="11" /> 최고 비용
          </span>
          <span class="font-medium text-foreground truncate ml-2">
            {{ topCost.name }} · {{ won(topCost.cost) }}
          </span>
        </div>
        <div v-if="busiestDay" class="flex items-center justify-between rounded-md bg-muted/60 px-2 py-1.5">
          <span class="inline-flex items-center gap-1 text-muted-foreground">
            <CalendarRange :size="11" /> 가장 바쁜 날
          </span>
          <Badge variant="brand">{{ md(busiestDay.date) }} · {{ busiestDay.count }}건</Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
