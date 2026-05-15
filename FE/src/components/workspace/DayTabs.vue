<script setup>
import { storeToRefs } from 'pinia'
import { useTripStore } from '@/stores/tripStore'
import { formatDayLabel } from '@/domain/itinerary'

const trip = useTripStore()
const { days, selectedDate } = storeToRefs(trip)
</script>

<template>
  <div class="px-6 pt-4 pb-2 bg-background border-b border-border">
    <div class="flex gap-1.5 overflow-x-auto pb-1">
      <button
        v-for="(d, i) in days"
        :key="d"
        @click="trip.selectDate(d)"
        :class="[
          'px-3 py-1.5 rounded-md text-xs whitespace-nowrap border transition-colors',
          selectedDate === d
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-foreground',
        ]"
      >
        {{ formatDayLabel(d, i) }}
      </button>

      <div v-if="!days.length" class="text-xs text-slate-400 py-1.5">
        시작/종료일을 선택하면 일자가 표시됩니다.
      </div>
    </div>
  </div>
</template>
