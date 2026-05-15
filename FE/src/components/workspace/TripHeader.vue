<script setup>
import { storeToRefs } from 'pinia'
import { useTripStore } from '@/stores/tripStore'
import { ChevronLeft, CalendarDays } from 'lucide-vue-next'
import { Button, Input, Separator } from '@/components/ui'

const trip = useTripStore()
const { title, startDate, endDate } = storeToRefs(trip)

function onStart(e) { trip.setRange(e.target.value, endDate.value) }
function onEnd(e) { trip.setRange(startDate.value, e.target.value) }
</script>

<template>
  <div class="h-14 shrink-0 border-b border-border bg-card flex items-center justify-between px-6">
    <div class="flex items-center gap-2 min-w-0">
      <Button variant="ghost" size="icon" @click="trip.exitTrip" title="목록으로">
        <ChevronLeft :size="16" />
      </Button>
      <Separator orientation="vertical" class="h-5 mx-1" />
      <CalendarDays :size="15" class="text-primary shrink-0" />
      <input
        :value="title"
        @input="trip.setTitle($event.target.value)"
        class="text-[15px] font-semibold text-foreground bg-transparent outline-none
               border-b border-transparent focus:border-ring min-w-0 px-1"
      />
    </div>

    <div class="flex items-center gap-2 text-sm">
      <input
        type="date"
        :value="startDate"
        @change="onStart"
        class="h-8 px-2.5 rounded-md border border-border bg-card text-foreground text-xs
               focus:border-ring outline-none"
      />
      <span class="text-muted-foreground">→</span>
      <input
        type="date"
        :value="endDate"
        :min="startDate"
        @change="onEnd"
        class="h-8 px-2.5 rounded-md border border-border bg-card text-foreground text-xs
               focus:border-ring outline-none"
      />
    </div>
  </div>
</template>
