<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Sparkles, Clock, RefreshCw } from 'lucide-vue-next'
import BaseModal from '@/components/common/BaseModal.vue'
import { Button } from '@/components/common'
import { findCategory } from '@/types/itinerary'
import { useStorageStore } from '@/stores/storageStore'

const props = defineProps({
  open: { type: Boolean, default: false },
  date: { type: String, default: '' },
})
const emit = defineEmits(['close', 'accept'])

const storage = useStorageStore()
const { items } = storeToRefs(storage)

const TIME_BLOCKS = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00']
// Category arrangement preference — feels like a real day.
const CATEGORY_PRIORITY = ['place', 'food', 'place', 'food', 'place', 'lodging']

function pickPlan() {
  const pool = [...items.value]
  if (!pool.length) return []
  const byCat = pool.reduce((acc, it) => {
    ;(acc[it.category] ||= []).push(it)
    return acc
  }, {})
  const used = new Set()
  const picked = []
  for (const cat of CATEGORY_PRIORITY) {
    if (picked.length >= 5) break
    const bucket = byCat[cat] || []
    const next = bucket.find((it) => !used.has(it.id))
    if (next) {
      used.add(next.id)
      picked.push(next)
    }
  }
  // Fill remaining slots from any leftover items until 4-5.
  const target = Math.min(5, pool.length)
  if (picked.length < target) {
    for (const it of pool) {
      if (picked.length >= target) break
      if (!used.has(it.id)) {
        used.add(it.id)
        picked.push(it)
      }
    }
  }
  return picked.slice(0, target).map((it, idx) => ({ ...it, time: TIME_BLOCKS[idx] }))
}

const plan = ref([])

watch(() => props.open, (v) => {
  if (v) plan.value = pickPlan()
})

const totalCost = computed(() =>
  plan.value.reduce((s, it) => s + (Number(it.cost) || 0), 0).toLocaleString('ko-KR'),
)

function regenerate() {
  // Shuffle pool slightly so the next pick differs.
  const a = [...items.value]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  storage.items = a
  plan.value = pickPlan()
}

function accept() {
  emit('accept', plan.value)
}
</script>

<template>
  <BaseModal :open="open" title="AI 자동 구성 미리보기" @close="emit('close')">
    <div class="space-y-4">
      <div class="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400">
        <Sparkles :size="13" class="text-[#00B7EB]" />
        보관함에서 {{ plan.length }}개의 아이템을 골라 <strong class="text-slate-700 dark:text-slate-200">{{ date || '오늘' }}</strong> 일정을 구성했어요.
      </div>

      <div v-if="plan.length" class="space-y-2 max-h-[360px] overflow-y-auto pr-1">
        <div
          v-for="(it, idx) in plan"
          :key="it.id"
          class="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5 shadow-sm"
        >
          <span class="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#00B7EB] text-white text-[11px] font-bold shadow-sm">
            {{ idx + 1 }}
          </span>
          <span class="text-base">{{ findCategory(it.category).emoji }}</span>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate">{{ it.name }}</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {{ findCategory(it.category).label }}<span v-if="it.memo"> · {{ it.memo }}</span>
            </p>
          </div>
          <span class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
            <Clock :size="11" /> {{ it.time }}
          </span>
        </div>
      </div>

      <div
        v-else
        class="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-8 text-center text-[12px] text-slate-500 dark:text-slate-400 shadow-inner"
      >
        보관함이 비어 있어 구성할 수 없습니다. 먼저 장소를 보관함에 추가해 주세요.
      </div>

      <div v-if="plan.length" class="flex items-center justify-between text-[12px] text-slate-500 dark:text-slate-400">
        <span>예상 총 비용</span>
        <span class="font-semibold text-slate-900 dark:text-slate-100">₩{{ totalCost }}</span>
      </div>
    </div>
    <template #footer>
      <Button v-if="plan.length" variant="ghost" size="sm" @click="regenerate">
        <RefreshCw :size="13" /> 다시 구성
      </Button>
      <Button variant="ghost" size="sm" @click="emit('close')">취소</Button>
      <Button size="sm" :disabled="!plan.length" @click="accept">
        <Sparkles :size="13" /> 적용하기
      </Button>
    </template>
  </BaseModal>
</template>
