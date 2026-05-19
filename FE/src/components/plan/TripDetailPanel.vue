<script setup>
import TripHeader from './TripHeader.vue'
import TripCalendar from './TripCalendar.vue'
import TripSummary from './TripSummary.vue'
import TripMap from './TripMap.vue'
import DayTimeline from './DayTimeline.vue'
</script>

<template>
  <div class="flex-1 h-full flex flex-col min-h-0">
    <TripHeader />

    <div class="flex-1 overflow-y-auto px-8 py-8 min-h-0 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div class="mx-auto max-w-7xl flex flex-col gap-8">
        <section class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-5 flex flex-col gap-6">
            <TripCalendar />
            <TripSummary />
          </div>
          <div class="lg:col-span-7">
            <TripMap class="h-full" />
          </div>
        </section>

        <section>
          <DayTimeline />
        </section>
      </div>
    </div>
  </div>
</template>
