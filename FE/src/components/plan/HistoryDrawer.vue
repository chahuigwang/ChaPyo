<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { X, History, Plus, Pencil, ArrowUpDown, Trash2 } from 'lucide-vue-next'
import { useCollabStore } from '@/stores/collabStore'

const collab = useCollabStore()
const { historyOpen, history } = storeToRefs(collab)

onMounted(() => collab.seedDemoHistory())

const TYPE_META = {
  add: { icon: Plus, color: '#10B981', verb: '추가함' },
  edit: { icon: Pencil, color: '#F59E0B', verb: '수정함' },
  reorder: { icon: ArrowUpDown, color: '#00B7EB', verb: '순서를 바꿈' },
  remove: { icon: Trash2, color: '#EF4444', verb: '삭제함' },
}
const entries = computed(() =>
  history.value.map((h) => ({ ...h, meta: TYPE_META[h.type] ?? TYPE_META.edit })),
)

function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}시간 전`
  return `${Math.floor(hrs / 24)}일 전`
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="historyOpen"
        class="fixed inset-0 z-40 bg-slate-950/30 dark:bg-black/50 backdrop-blur-[2px]"
        @click="collab.closeHistory"
      />
    </Transition>
    <Transition name="slide-right">
      <aside
        v-if="historyOpen"
        class="fixed top-0 right-0 bottom-0 z-50 w-[360px] max-w-[92vw]
               bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
        role="dialog"
        aria-label="활동 히스토리"
      >
        <header class="px-5 h-16 shrink-0 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <History :size="16" class="text-[#00B7EB]" />
            <h2 class="text-[15px] font-semibold text-slate-900 dark:text-slate-100">활동 히스토리</h2>
            <span class="text-[11px] text-slate-400 dark:text-slate-500">{{ entries.length }}건</span>
          </div>
          <button
            type="button"
            class="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200
                   hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="닫기"
            @click="collab.closeHistory"
          >
            <X :size="16" />
          </button>
        </header>

        <div class="flex-1 overflow-y-auto px-4 pb-6">
          <ol v-if="entries.length" class="space-y-1">
            <li
              v-for="(h, idx) in entries"
              :key="h.id"
              class="relative flex gap-3 px-2 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <!-- timeline rail -->
              <span
                v-if="idx < entries.length - 1"
                class="absolute left-[26px] top-10 bottom-0 w-px bg-slate-200 dark:bg-slate-700"
              />
              <span
                class="relative flex h-7 w-7 items-center justify-center rounded-full shrink-0 shadow-sm"
                :style="{ backgroundColor: h.meta.color + '22', color: h.meta.color }"
              >
                <component :is="h.meta.icon" :size="13" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-[13px] text-slate-700 dark:text-slate-200 leading-snug">
                  <span class="font-semibold" :style="{ color: h.byColor }">{{ h.byName }}</span>
                  님이
                  <span class="font-medium text-slate-900 dark:text-slate-100">"{{ h.itemName }}"</span>
                  을(를) {{ h.meta.verb }}
                </p>
                <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {{ timeAgo(h.at) }}
                </p>
              </div>
            </li>
          </ol>
          <div
            v-else
            class="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-10 text-center text-[12px] text-slate-500 dark:text-slate-400 shadow-inner"
          >
            아직 기록된 활동이 없습니다.
          </div>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-right-enter-active, .slide-right-leave-active {
  transition: transform .28s cubic-bezier(.2,.8,.2,1), opacity .2s ease;
}
.slide-right-enter-from, .slide-right-leave-to {
  transform: translateX(16px);
  opacity: 0;
}
</style>
