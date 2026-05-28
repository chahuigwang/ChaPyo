<script setup>
import { ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { CATEGORIES } from '@/types/itinerary'
import { Button, Input } from '@/components/common'

const props = defineProps({
  open: { type: Boolean, default: false },
  initial: { type: Object, default: null },
})
const emit = defineEmits(['close', 'submit'])

const form = ref(blank())

function blank() {
  return { name: '', category: 'place', time: '', memo: '', cost: 0 }
}

watch(
  () => [props.open, props.initial],
  ([open, initial]) => {
    if (open) form.value = initial ? { ...initial } : blank()
  },
  { immediate: true }
)

function submit() {
  if (!form.value.name.trim()) return
  emit('submit', {
    ...form.value,
    name: form.value.name.trim(),
    cost: Number(form.value.cost) || 0,
  })
}
</script>

<template>
  <BaseModal :open="open" :title="initial ? '일정 수정' : '일정 추가'" @close="emit('close')">
    <div class="space-y-5">
      <label class="block">
        <span class="text-[12px] font-medium text-slate-500 dark:text-slate-400">장소명</span>
        <Input v-model="form.name" class="mt-2" placeholder="예: 경복궁" />
      </label>

      <div class="block">
        <span class="text-[12px] font-medium text-slate-500 dark:text-slate-400">카테고리</span>
        <div class="mt-2 flex flex-wrap gap-1.5">
          <button
            v-for="c in CATEGORIES"
            :key="c.id"
            type="button"
            @click="form.category = c.id"
            :class="[
              'px-3 py-1.5 text-xs rounded-md transition-colors inline-flex items-center gap-1',
              form.category === c.id
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
            ]"
          >
            <span>{{ c.emoji }}</span>{{ c.label }}
          </button>
        </div>
      </div>

      <label class="block">
        <span class="text-[12px] font-medium text-slate-500 dark:text-slate-400">시간</span>
        <Input v-model="form.time" type="time" class="mt-2" />
      </label>

      <label class="block">
        <span class="text-[12px] font-medium text-slate-500 dark:text-slate-400">예상 비용 (원)</span>
        <Input v-model="form.cost" type="number" class="mt-2" placeholder="예: 30000" />
      </label>

      <label class="block">
        <span class="text-[12px] font-medium text-slate-500 dark:text-slate-400">메모</span>
        <textarea
          v-model="form.memo"
          rows="3"
          class="mt-2 w-full px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 resize-none
                 placeholder:text-slate-400 dark:placeholder:text-slate-500
                 ring-1 ring-transparent focus:outline-none focus:ring-primary transition-all"
          placeholder="추천 메뉴, 예약 정보 등"
        />
      </label>
    </div>

    <template #footer>
      <Button variant="ghost" size="sm" @click="emit('close')">취소</Button>
      <Button size="sm" :disabled="!form.name.trim()" @click="submit">저장</Button>
    </template>
  </BaseModal>
</template>
