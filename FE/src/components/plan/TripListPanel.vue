<script setup>
import { storeToRefs } from 'pinia'
import { CalendarDays, Plus, Trash2, MapPin } from 'lucide-vue-next'
import { useTripStore } from '@/stores/tripStore'
import { useAuthStore } from '@/stores/authStore'
import { enumerateDays } from '@/types/itinerary'
import { Button } from '@/components/common'

const trip = useTripStore()
const auth = useAuthStore()
const { trips } = storeToRefs(trip)

function dayCount(t) { return enumerateDays(t.startDate, t.endDate).length }
function itemCount(t) {
  return Object.values(t.itemsByDay).reduce((sum, list) => sum + list.length, 0)
}
function open(id) { trip.selectTrip(id) }
function remove(t) {
  if (confirm(`"${t.title}" 여행 계획을 삭제할까요?`)) trip.deleteTrip(t.id)
}
function createNew() {
  trip.createTrip({ title: '새 여행' })
}
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <div class="mx-auto max-w-5xl px-8 py-16">
      <div class="flex items-end justify-between mb-12">
        <div>
          <p class="text-[13px] text-slate-500 dark:text-slate-400">{{ auth.user?.name }}님, 안녕하세요</p>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-2">나의 여행 계획</h1>
        </div>
        <Button @click="createNew">
          <Plus :size="15" /> 새 여행
        </Button>
      </div>

      <div v-if="trips.length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="t in trips"
          :key="t.id"
          class="group relative cursor-pointer rounded-xl bg-white dark:bg-slate-900 p-6
                 shadow-sm hover:shadow-md transition-all"
          @click="open(t.id)"
        >
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <CalendarDays :size="11" /> {{ dayCount(t) }}일
            </span>
            <button
              class="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
              @click.stop="remove(t)"
            >
              <Trash2 :size="13" />
            </button>
          </div>
          <h3 class="mt-6 text-base font-semibold text-slate-900 dark:text-slate-100 truncate">{{ t.title }}</h3>
          <div class="mt-2 text-[12px] text-slate-500 dark:text-slate-400">
            {{ t.startDate }} → {{ t.endDate }}
          </div>
          <div class="mt-6 pt-5 flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-slate-400">
            <MapPin :size="11" /> 일정 {{ itemCount(t) }}건
          </div>
        </div>
      </div>

      <div v-else class="rounded-xl bg-white/40 dark:bg-slate-900/40 p-16 text-center text-sm text-slate-500 dark:text-slate-400 shadow-inner">
        아직 여행 계획이 없습니다. "새 여행"을 눌러 시작해 보세요.
      </div>
    </div>
  </div>
</template>
