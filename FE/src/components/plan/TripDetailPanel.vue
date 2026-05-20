<script setup>
import TripHeader from './TripHeader.vue'
import TripCalendar from './TripCalendar.vue'
import TripSummary from './TripSummary.vue'
import TripMap from './TripMap.vue'
import DayTimeline from './DayTimeline.vue'
</script>

<template>
  <div class="flex-1 h-full flex flex-col min-h-0 relative">
    <TripHeader />

    <div class="flex-1 overflow-y-auto px-8 py-8 min-h-0 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div class="mx-auto max-w-7xl flex flex-col gap-6">
        <section class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-5 flex flex-col gap-6">
            <TripSummary />
            <TripCalendar />
          </div>
          <div class="lg:col-span-7">
            <TripMap class="h-full min-h-[520px]" />
          </div>
        </section>

        <section>
          <DayTimeline />
        </section>
      </div>
    </div>

    <!-- Map expansion target: stays within the workspace, never covers the sidebar. -->
    <div
      id="map-expand-target"
      class="pointer-events-none absolute inset-x-0 top-16 bottom-0 z-20"
    />
  </div>
</template>
