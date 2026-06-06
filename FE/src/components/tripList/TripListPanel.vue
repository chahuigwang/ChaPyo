<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Plus, LogOut, Pencil, Check, X } from 'lucide-vue-next'
import { useTripStore } from '@/stores/tripStore'
import { useAuthStore } from '@/stores/authStore'
import { Button, Input } from '@/components/common'
import TripCard from '@/components/tripList/TripCard.vue'

const trip = useTripStore()
const auth = useAuthStore()
const { trips } = storeToRefs(trip)
const { user } = storeToRefs(auth)

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

// ── Logout two-click confirm ─────────────────────────────────
const logoutPending = ref(false)
function handleLogout() {
  if (logoutPending.value) { auth.logout(); logoutPending.value = false }
  else logoutPending.value = true
}
function cancelLogout() { logoutPending.value = false }
watch(logoutPending, (v) => {
  if (v) document.addEventListener('click', cancelLogout)
  else document.removeEventListener('click', cancelLogout)
})

// ── Inline profile edit ──────────────────────────────────────
const editingProfile = ref(false)
const nameDraft = ref('')

function openProfileEdit() {
  nameDraft.value = user.value?.nickname ?? ''
  editingProfile.value = true
}
function cancelProfileEdit() { editingProfile.value = false }
function saveProfile() {
  if (!nameDraft.value.trim()) return
  auth.updateUser({ nickname: nameDraft.value.trim() })
  editingProfile.value = false
}
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <div class="mx-auto max-w-5xl px-8 py-16">

      <!-- Header -->
      <div class="flex items-start justify-between mb-10 gap-6">
        <div>
          <p class="text-[13px] text-slate-500 dark:text-slate-400">안녕하세요 👋</p>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-2">나의 여행 계획</h1>
        </div>

        <!-- User card (inline edit) -->
        <div class="flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-sm shrink-0 overflow-hidden">
          <!-- Normal view -->
          <div class="flex items-center gap-3 px-4 py-3">
            <div class="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[15px] font-bold">
              {{ (user?.nickname ?? '?').charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <div class="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
                {{ user?.nickname ?? '사용자' }}
              </div>
              <div class="text-[11px] text-slate-400 dark:text-slate-500">여행 {{ trips.length }}개</div>
            </div>
            <div class="flex items-center gap-1 ml-2 pl-3 border-l border-slate-100 dark:border-slate-800">
              <button
                @click="editingProfile ? cancelProfileEdit() : openProfileEdit()"
                class="h-8 w-8 rounded-xl flex items-center justify-center transition-colors"
                :class="editingProfile
                  ? 'text-slate-500 bg-slate-100 dark:bg-slate-800'
                  : 'text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800'"
                :title="editingProfile ? '취소' : '프로필 수정'"
              >
                <X v-if="editingProfile" :size="14" />
                <Pencil v-else :size="14" />
              </button>
              <button
                @click.stop="handleLogout"
                class="h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-150"
                :class="logoutPending
                  ? 'bg-red-500 text-white hover:bg-red-600 scale-110'
                  : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'"
                :title="logoutPending ? '한 번 더 누르면 로그아웃됩니다' : '로그아웃'"
              >
                <LogOut :size="14" />
              </button>
            </div>
          </div>

          <!-- Inline edit expand -->
          <div class="edit-expand" :class="editingProfile ? 'edit-expand--open' : ''">
            <div>
              <div class="px-4 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Input
                  v-model="nameDraft"
                  placeholder="이름을 입력하세요"
                  class="flex-1 text-[13px] h-8"
                  @keydown.enter="saveProfile"
                  @keydown.escape="cancelProfileEdit"
                />
                <button
                  @click="saveProfile"
                  :disabled="!nameDraft.trim()"
                  class="h-8 px-3 rounded-lg bg-primary text-white text-[12px] font-semibold
                         hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1 shrink-0"
                >
                  <Check :size="12" /> 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="flex items-center justify-between mb-5">
        <Button @click="trip.createTrip({ title: '새 여행' })">
          <Plus :size="15" /> 새 여행
        </Button>
        <div v-if="trips.length" class="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800/60">
          <button
            v-for="opt in SORT_OPTIONS"
            :key="opt.id"
            class="px-3 py-1.5 text-[12px] font-medium rounded-md transition-all duration-200"
            :class="sortKey === opt.id
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'"
            @click="sortKey = opt.id"
          >{{ opt.label }}</button>
        </div>
      </div>

      <!-- Trip grid -->
      <div v-if="trips.length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <TripCard
          v-for="t in sortedTrips"
          :key="t.id"
          :trip="t"
          @open="trip.selectTrip($event)"
          @delete="trip.deleteTrip($event.id)"
        />
      </div>
      <div v-else class="rounded-xl bg-white/40 dark:bg-slate-900/40 p-16 text-center text-sm text-slate-500 dark:text-slate-400 shadow-inner">
        아직 여행 계획이 없습니다. "새 여행"을 눌러 시작해 보세요.
      </div>
    </div>
  </div>
</template>

<style scoped>
.edit-expand {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 220ms cubic-bezier(0.4, 0, 0.2, 1);
}
.edit-expand > div { min-height: 0; overflow: hidden; }
.edit-expand--open { grid-template-rows: 1fr; }
</style>
