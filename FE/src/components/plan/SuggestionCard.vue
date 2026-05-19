<script setup>
import { Check, Plus } from 'lucide-vue-next'
import { computed } from 'vue'
import { findCategory } from '@/types/itinerary'
import { Button } from '@/components/common'

const props = defineProps({
  suggestion: { type: Object, required: true },
  added: { type: Boolean, default: false },
})
const emit = defineEmits(['add'])

const category = computed(() => findCategory(props.suggestion.category))
</script>

<template>
  <div
    class="rounded-lg px-3 py-2.5 flex items-center gap-2.5 text-[11px] transition-all shadow-sm"
    :class="added
      ? 'bg-slate-50 dark:bg-slate-800/60'
      : 'bg-white dark:bg-slate-800 hover:shadow-md'"
  >
    <span class="text-base shrink-0">{{ category.emoji }}</span>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-1.5">
        <span class="font-semibold text-slate-900 dark:text-slate-100 truncate text-[12px]">{{ suggestion.name }}</span>
        <span class="text-[10px] text-slate-500 dark:text-slate-400">{{ category.label }}</span>
      </div>
      <div class="text-slate-500 dark:text-slate-400 truncate mt-0.5">
        <span v-if="suggestion.time">{{ suggestion.time }} · </span>{{ suggestion.memo }}
      </div>
    </div>
    <Button v-if="!added" size="sm" class="h-7 px-2 text-[11px]" @click="emit('add')">
      <Plus :size="11" /> 추가
    </Button>
    <span v-else class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-slate-500 dark:text-slate-400 font-medium">
      <Check :size="11" /> 추가됨
    </span>
  </div>
</template>
