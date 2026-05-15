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

    <div class="flex-1 overflow-y-auto p-5 min-h-0 bg-muted/30">
      <div class="mx-auto max-w-7xl flex flex-col gap-4">
        <!-- 상단: 좌(달력+요약) | 우(지도) -->
        <section class="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div class="lg:col-span-5 flex flex-col gap-4">
            <TripCalendar />
            <TripSummary />
          </div>
          <div class="lg:col-span-7">
            <TripMap class="h-full" />
          </div>
        </section>

        <!-- 하단: 일자별 타임라인 -->
        <section>
          <DayTimeline />
        </section>
      </div>
    </div>
  </div>
</template>
