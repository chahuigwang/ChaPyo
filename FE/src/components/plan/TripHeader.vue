<script setup>
import { storeToRefs } from 'pinia'
import { useTripStore } from '@/stores/tripStore'
import { useCollabStore } from '@/stores/collabStore'
import { ChevronLeft } from 'lucide-vue-next'
import { Button } from '@/components/common'
import InviteModal from '@/components/modal/InviteModal.vue'

const trip = useTripStore()
const collab = useCollabStore()
const { title } = storeToRefs(trip)
const { inviteOpen } = storeToRefs(collab)
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
    <InviteModal :open="inviteOpen" @close="collab.closeInvite" />
  </div>
</template>
