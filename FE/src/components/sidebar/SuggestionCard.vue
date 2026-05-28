<script setup>
import { Check, Plus, GripVertical } from 'lucide-vue-next'
import { computed } from 'vue'
import { findCategory } from '@/types/itinerary'
import { Button } from '@/components/common'
import { useStorageStore } from '@/stores/storageStore'

const props = defineProps({
  suggestion: { type: Object, required: true },
  added: { type: Boolean, default: false },
})
const emit = defineEmits(['add'])

const category = computed(() => findCategory(props.suggestion.category))
const storage = useStorageStore()

function onDragStart(e) {
  storage.setDragging({ source: 'chat', item: { ...props.suggestion } })
  try {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', props.suggestion.name)
  } catch {}
}
function onDragEnd() {
  storage.clearDragging()
}
</script>

<template>
  <div
    :draggable="!added"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    class="rounded-lg px-3 py-2.5 flex items-center gap-2.5 text-[11px] transition-all shadow-sm"
    :class="[
      added
        ? 'bg-slate-50 dark:bg-slate-800/60'
        : 'bg-white dark:bg-slate-800 hover:shadow-md cursor-grab active:cursor-grabbing',
    ]"
  >
    <GripVertical v-if="!added" :size="13" class="text-slate-300 dark:text-slate-600 shrink-0" />
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
