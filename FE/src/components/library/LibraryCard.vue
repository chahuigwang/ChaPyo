<script setup>
import { computed, ref, watch, onBeforeUnmount, useTemplateRef } from 'vue'
import { Eye, Download, Trash2, Loader2 } from 'lucide-vue-next'
import { colorForUser } from '@/composables/useUserColor'

const props = defineProps({
  library: { type: Object, required: true },
  mine: { type: Boolean, default: false }, // 내가 게시한 글이면 삭제 가능
  importing: { type: Boolean, default: false },
})
const emit = defineEmits(['open', 'import', 'delete'])

const dateLabel = computed(() => {
  const raw = props.library.createdAt
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}.${mm}.${dd}`
})

const authorColor = computed(() => colorForUser(props.library.nickname ?? '?'))
const num = (n) => (Number(n) || 0).toLocaleString('ko-KR')

// 삭제 2단계 확인
const confirming = ref(false)
let revertTimer = null
function clearRevert() { if (revertTimer) { clearTimeout(revertTimer); revertTimer = null } }
function onTrash() {
  if (confirming.value) { emit('delete', props.library); confirming.value = false; clearRevert(); return }
  confirming.value = true
  clearRevert()
  revertTimer = setTimeout(() => { confirming.value = false }, 3000)
}
const rootRef = useTemplateRef('rootRef')
function onDocClick(e) {
  if (confirming.value && rootRef.value && !rootRef.value.contains(e.target)) confirming.value = false
}
watch(confirming, (v) => {
  if (v) document.addEventListener('click', onDocClick, true)
  else document.removeEventListener('click', onDocClick, true)
})
onBeforeUnmount(() => { clearRevert(); document.removeEventListener('click', onDocClick, true) })
</script>

<template>
  <div
    ref="rootRef"
    class="group relative cursor-pointer rounded-2xl bg-white dark:bg-slate-900 shadow-sm
           transition-all duration-300 ease-out flex flex-col overflow-hidden
           hover:shadow-md hover:-translate-y-1.5"
    @click="emit('open', library.libraryId)"
  >
    <div class="p-5 flex flex-col gap-2.5 flex-1">
      <!-- 작성자 chip -->
      <div class="flex items-center gap-2">
        <span
          class="h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
          :style="{ backgroundColor: authorColor }"
        >{{ (library.nickname || '?')[0] }}</span>
        <span class="text-[12px] font-medium text-slate-600 dark:text-slate-300 truncate">{{ library.nickname }}</span>
        <span v-if="mine" class="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold shrink-0">내 게시물</span>
        <span v-if="dateLabel" class="text-[11px] text-slate-400 dark:text-slate-500 ml-auto tabular-nums shrink-0">{{ dateLabel }}</span>

        <!-- 삭제 (내 글, hover 시) -->
        <button
          v-if="mine"
          @click.stop="onTrash"
          class="shrink-0 flex items-center gap-1 rounded-lg transition-all duration-200"
          :class="confirming
            ? 'px-2 py-1 bg-red-500 text-white hover:bg-red-600'
            : 'p-1.5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'"
          :title="confirming ? '한 번 더 클릭하면 삭제' : '삭제'"
        >
          <Trash2 :size="14" class="shrink-0" />
          <span v-if="confirming" class="text-[11px] font-semibold whitespace-nowrap">삭제</span>
        </button>
      </div>

      <!-- 제목 -->
      <h3 class="text-[16px] font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
        {{ library.title }}
      </h3>

      <!-- 설명 -->
      <p class="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 min-h-[2.5rem]">
        {{ library.description || '설명이 없습니다.' }}
      </p>
    </div>

    <!-- 하단: 통계 + 불러오기 (배경 대비로 구분) -->
    <div class="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800/40">
      <div class="flex items-center gap-3 text-[12px] text-slate-400 dark:text-slate-500">
        <span class="inline-flex items-center gap-1" title="조회수"><Eye :size="13" /> {{ num(library.viewCount) }}</span>
        <span class="inline-flex items-center gap-1" title="불러오기 수"><Download :size="13" /> {{ num(library.importCount) }}</span>
      </div>
      <button
        @click.stop="emit('import', library.libraryId)"
        :disabled="importing"
        class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-[12px] font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all hover:-translate-y-0.5"
      >
        <Loader2 v-if="importing" :size="13" class="animate-spin" />
        <Download v-else :size="13" />
        불러오기
      </button>
    </div>
  </div>
</template>
