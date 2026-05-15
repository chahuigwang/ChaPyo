<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { MapPin } from 'lucide-vue-next'
import { useTripStore } from '@/stores/tripStore'
import { findCategory } from '@/domain/itinerary'
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui'

const trip = useTripStore()
const { itemsOfSelectedDay, selectedDate } = storeToRefs(trip)

// 결정적 해시: 같은 이름은 항상 같은 좌표 → 화면이 흔들리지 않음
function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const sortedItems = computed(() =>
  [...itemsOfSelectedDay.value].sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
)

const pins = computed(() =>
  sortedItems.value.map((item, idx) => {
    const h = hash(item.id || item.name)
    const x = 12 + (h % 76)
    const y = 14 + ((h >> 8) % 70)
    return { item, idx, x, y, cat: findCategory(item.category) }
  })
)

const path = computed(() => {
  if (pins.value.length < 2) return ''
  return pins.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
})
</script>

<template>
  <Card class="h-full flex flex-col">
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="inline-flex items-center gap-1.5">
          <MapPin :size="14" class="text-primary" /> 동선 지도
        </CardTitle>
        <Badge variant="outline">{{ selectedDate || '—' }}</Badge>
      </div>
    </CardHeader>

    <CardContent class="flex-1 min-h-[260px]">
      <div class="relative w-full h-full min-h-[240px] rounded-md overflow-hidden border border-border bg-brand-50/40">
        <!-- 격자 배경 -->
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" stroke-width="0.2" class="text-border" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />

          <!-- 동선 경로 -->
          <path
            v-if="path"
            :d="path"
            fill="none"
            stroke="hsl(var(--primary))"
            stroke-width="0.6"
            stroke-dasharray="1.2 1.2"
            stroke-linecap="round"
          />
        </svg>

        <!-- 핀 -->
        <button
          v-for="p in pins"
          :key="p.item.id"
          :style="{ left: p.x + '%', top: p.y + '%' }"
          class="absolute -translate-x-1/2 -translate-y-full group"
          :title="`${p.item.time || ''} ${p.item.name}`"
        >
          <div class="flex flex-col items-center">
            <div
              class="w-7 h-7 rounded-full bg-primary text-primary-foreground text-[11px] font-bold
                     flex items-center justify-center shadow-md ring-2 ring-card group-hover:scale-110 transition"
            >
              {{ p.idx + 1 }}
            </div>
            <div class="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-primary -mt-0.5" />
            <div
              class="mt-0.5 px-1.5 py-0.5 rounded bg-card border border-border text-[10px] font-medium
                     whitespace-nowrap shadow-sm opacity-0 group-hover:opacity-100 transition"
            >
              {{ p.cat.emoji }} {{ p.item.name }}
            </div>
          </div>
        </button>

        <!-- 빈 상태 -->
        <div
          v-if="!pins.length"
          class="absolute inset-0 flex items-center justify-center text-[12px] text-muted-foreground"
        >
          이 날짜에 표시할 장소가 없습니다.
        </div>
      </div>
    </CardContent>
  </Card>
</template>
