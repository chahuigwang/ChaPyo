<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { RefreshCw, X } from 'lucide-vue-next'
import { useCollabStore } from '@/stores/collabStore'

const collab = useCollabStore()
const { staleAlert } = storeToRefs(collab)

// Demo: simulate a peer update ~10s after entering the workspace.
let timer = null
onMounted(() => {
  timer = setTimeout(() => {
    if (!staleAlert.value.open) collab.showStale('민지')
  }, 10000)
})
onBeforeUnmount(() => { if (timer) clearTimeout(timer) })

function refresh() {
  // Real implementation would re-fetch shared state. For now, just dismiss.
  collab.dismissStale()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div
        v-if="staleAlert.open"
        class="fixed bottom-6 right-6 z-40 max-w-sm
               rounded-xl bg-white dark:bg-slate-900 shadow-lg
               px-4 py-3 flex items-center gap-3 transition-colors"
        role="status"
        aria-live="polite"
      >
        <span class="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#00B7EB]/15 text-[#00B7EB]">
          <RefreshCw :size="15" />
        </span>
        <div class="min-w-0">
          <p class="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
            동료가 일정을 업데이트했어요
          </p>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {{ staleAlert.by }} 님의 변경 사항을 가져올 수 있어요.
          </p>
        </div>
        <button
          type="button"
          class="ml-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium
                 bg-[#00B7EB] text-white hover:bg-[#0298c4] hover:-translate-y-0.5 hover:shadow-md
                 transition-all duration-300 shadow-sm whitespace-nowrap"
          @click="refresh"
        >
          새로고침
        </button>
        <button
          type="button"
          class="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200
                 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="닫기"
          @click="collab.dismissStale"
        >
          <X :size="14" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: opacity .25s ease, transform .25s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
