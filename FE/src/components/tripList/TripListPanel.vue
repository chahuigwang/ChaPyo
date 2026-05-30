<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Plus, LogOut, UserRound, Pencil } from 'lucide-vue-next'
import { useTripStore } from '@/stores/tripStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/common'
import TripCard from '@/components/tripList/TripCard.vue'

const trip = useTripStore()
const auth = useAuthStore()
const { trips } = storeToRefs(trip)
const { user, isAuthed } = storeToRefs(auth)

function logout() { auth.logout() }

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
      <div class="flex items-start justify-between mb-10 gap-6">
        <!-- Left: greeting -->
        <div>
          <p class="text-[13px] text-slate-500 dark:text-slate-400">안녕하세요 👋</p>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-2">나의 여행 계획</h1>
        </div>

        <!-- Right: User ID Card + actions -->
        <div class="flex items-center gap-3 shrink-0">
          <!-- User ID Card -->
          <div class="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
            <div class="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[15px] font-bold">
              {{ (user?.name ?? '?').charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <div class="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
                {{ user?.name ?? '사용자' }}
              </div>
              <div class="text-[11px] text-slate-400 dark:text-slate-500">여행 {{ trips.length }}개</div>
            </div>
            <div class="flex items-center gap-1 ml-2 pl-3 border-l border-slate-100 dark:border-slate-800">
              <button
                class="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="프로필 수정"
              >
                <Pencil :size="14" />
              </button>
              <button
                @click="logout"
                class="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="로그아웃"
              >
                <LogOut :size="14" />
              </button>
            </div>
          </div>

          <Button @click="createNew">
            <Plus :size="15" /> 새 여행
          </Button>
        </div>
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
