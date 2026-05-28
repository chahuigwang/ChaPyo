<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Plus } from 'lucide-vue-next'
import { useTripStore } from '@/stores/tripStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/common'
import TripCard from '@/components/dashboard/TripCard.vue'

const trip = useTripStore()
const auth = useAuthStore()
const { trips } = storeToRefs(trip)

const SORT_OPTIONS = [
  { id: 'updated', label: '최근 수정한 순' },
  { id: 'departure', label: '출발일 기준 최신순' },
]
const sortKey = ref('updated')

const sortedTrips = computed(() => {
  const list = [...trips.value]
  if (sortKey.value === 'departure') {
    list.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
  } else {
    list.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
  }
  return list
})

function open(id) { trip.selectTrip(id) }
function remove(t) { trip.deleteTrip(t.id) }
function createNew() { trip.createTrip({ title: '새 여행' }) }
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <div class="mx-auto max-w-5xl px-8 py-16">
      <div class="flex items-end justify-between mb-10">
        <div>
          <p class="text-[13px] text-slate-500 dark:text-slate-400">{{ auth.user?.name }}님, 안녕하세요</p>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-2">나의 여행 계획</h1>
        </div>
        <Button @click="createNew">
          <Plus :size="15" /> 새 여행
        </Button>
      </div>

      <div v-if="trips.length" class="flex items-center justify-end mb-5">
        <div class="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800/60">
          <button
            v-for="opt in SORT_OPTIONS"
            :key="opt.id"
            class="px-3 py-1.5 text-[12px] font-medium rounded-md transition-all duration-200"
            :class="sortKey === opt.id
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'"
            @click="sortKey = opt.id"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div v-if="trips.length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <TripCard
          v-for="t in sortedTrips"
          :key="t.id"
          :trip="t"
          @open="open"
          @delete="remove"
        />
      </div>

      <div v-else class="rounded-xl bg-white/40 dark:bg-slate-900/40 p-16 text-center text-sm text-slate-500 dark:text-slate-400 shadow-inner">
        아직 여행 계획이 없습니다. "새 여행"을 눌러 시작해 보세요.
      </div>
    </div>
  </div>
</template>
