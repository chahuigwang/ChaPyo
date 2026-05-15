<script setup>
import { ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { CATEGORIES } from '@/domain/itinerary'
import { Button, Input } from '@/components/ui'

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
    <div class="space-y-3">
      <label class="block">
        <span class="text-xs font-medium text-muted-foreground">장소명</span>
        <Input v-model="form.name" class="mt-1" placeholder="예: 경복궁" />
      </label>

      <div class="block">
        <span class="text-xs font-medium text-muted-foreground">카테고리</span>
        <div class="mt-1 flex flex-wrap gap-1.5">
          <button
            v-for="c in CATEGORIES"
            :key="c.id"
            type="button"
            @click="form.category = c.id"
            :class="[
              'px-2.5 py-1 text-xs rounded-md border transition inline-flex items-center gap-1',
              form.category === c.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground',
            ]"
          >
            <span>{{ c.emoji }}</span>{{ c.label }}
          </button>
        </div>
      </div>

      <label class="block">
        <span class="text-xs font-medium text-muted-foreground">시간</span>
        <Input v-model="form.time" type="time" class="mt-1" />
      </label>

      <label class="block">
        <span class="text-xs font-medium text-muted-foreground">예상 비용 (원)</span>
        <Input v-model="form.cost" type="number" class="mt-1" placeholder="예: 30000" />
      </label>

      <label class="block">
        <span class="text-xs font-medium text-muted-foreground">메모</span>
        <textarea
          v-model="form.memo"
          rows="3"
          class="mt-1 w-full px-3 py-2 rounded-md border border-input bg-card text-sm resize-none
                 placeholder:text-muted-foreground
                 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition"
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
