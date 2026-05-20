<script setup>
import { storeToRefs } from 'pinia'
import { useTripStore } from '@/stores/tripStore'
import { useCollabStore } from '@/stores/collabStore'
import { ChevronLeft, UserPlus, History } from 'lucide-vue-next'
import { Button } from '@/components/common'
import InviteModal from './InviteModal.vue'

const trip = useTripStore()
const collab = useCollabStore()
const { title } = storeToRefs(trip)
const { inviteOpen } = storeToRefs(collab)

// Mock presence data (Phase 24 — real-time wiring deferred; supports SSE/polling later)
const activeUsers = [
  { id: 'u1', name: '민지', color: '#00B7EB' },
  { id: 'u2', name: '준호', color: '#F59E0B' },
  { id: 'u3', name: '서연', color: '#10B981' },
  { id: 'u4', name: '도윤', color: '#A855F7' },
  { id: 'u5', name: '하린', color: '#EF4444' },
]
const visibleUsers = activeUsers.slice(0, 4)
const overflowCount = Math.max(0, activeUsers.length - visibleUsers.length)
function initialOf(name) { return (name || '?').trim().charAt(0) }
</script>

<template>
  <div class="h-16 shrink-0 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between px-8 transition-colors">
    <div class="flex items-center gap-3 min-w-0">
      <Button variant="ghost" size="icon" @click="trip.exitTrip" title="목록으로">
        <ChevronLeft :size="16" />
      </Button>
      <input
        :value="title"
        @input="trip.setTitle($event.target.value)"
        class="text-[15px] font-semibold text-slate-900 dark:text-slate-100 bg-transparent outline-none
               border-b border-transparent focus:border-slate-300 dark:focus:border-slate-600 min-w-0 px-1"
      />
    </div>

    <!-- Active user presence (mock) + invite -->
    <div class="flex items-center gap-3">
    <div class="flex items-center -space-x-2">
      <div
        v-for="u in visibleUsers"
        :key="u.id"
        class="presence-avatar relative flex items-center justify-center
               h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900
               text-[11px] font-semibold text-white shadow-sm
               transition-transform duration-200 hover:-translate-y-0.5 hover:z-10"
        :style="{ backgroundColor: u.color }"
      >
        {{ initialOf(u.name) }}
        <span
          class="presence-tip pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2
                 whitespace-nowrap rounded-md bg-slate-900 text-white text-[11px] px-2 py-1 shadow-md
                 opacity-0 transition-opacity duration-150 z-20"
        >{{ u.name }} · 지금 편집 중</span>
        <span
          class="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500
                 ring-2 ring-white dark:ring-slate-900"
        ></span>
      </div>
      <div
        v-if="overflowCount"
        class="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900
               text-[11px] font-semibold text-slate-600 dark:text-slate-200
               bg-slate-200 dark:bg-slate-700 shadow-sm"
      >+{{ overflowCount }}</div>
    </div>

      <button
        type="button"
        class="inline-flex items-center justify-center h-8 w-8 rounded-full
               text-slate-500 dark:text-slate-400 hover:text-[#00B7EB]
               hover:bg-[#00B7EB]/10 hover:-translate-y-0.5 transition-all duration-300"
        title="활동 히스토리"
        aria-label="활동 히스토리"
        @click="collab.openHistory"
      >
        <History :size="15" />
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full
               text-[12px] font-medium text-[#00B7EB] bg-[#00B7EB]/10
               hover:bg-[#00B7EB] hover:text-white hover:-translate-y-0.5 hover:shadow-md
               transition-all duration-300"
        title="여행에 초대하기"
        @click="collab.openInvite"
      >
        <UserPlus :size="14" />
        초대
      </button>
    </div>

    <InviteModal :open="inviteOpen" @close="collab.closeInvite" />
  </div>
</template>

<style scoped>
.presence-avatar:hover .presence-tip {
  opacity: 1;
}
</style>
