<script setup>
import { Pencil, Trash2, Clock } from 'lucide-vue-next'
import { findCategory } from '@/types/itinerary'
import { computed } from 'vue'

const props = defineProps({
  item: { type: Object, required: true },
})
const emit = defineEmits(['edit', 'remove'])

const category = computed(() => findCategory(props.item.category))
</script>

<template>
  <div class="group bg-card rounded-md border border-border hover:border-primary
              transition-colors px-4 py-3 flex items-start gap-3">
    <div class="w-10 h-10 shrink-0 rounded-md bg-brand-50 text-lg flex items-center justify-center">
      {{ category.emoji }}
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span class="text-xs font-medium text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
          {{ category.label }}
        </span>
        <h4 class="text-sm font-semibold text-slate-900 truncate">{{ item.name }}</h4>
      </div>
      <div v-if="item.time" class="mt-1 flex items-center gap-1 text-xs text-slate-500">
        <Clock :size="12" />
        <span>{{ item.time }}</span>
      </div>
      <p v-if="item.memo" class="mt-1 text-xs text-slate-600 line-clamp-2">{{ item.memo }}</p>
    </div>

    <div class="opacity-0 group-hover:opacity-100 transition flex gap-1">
      <button class="p-1.5 rounded-md hover:bg-slate-100 text-slate-500" @click="emit('edit', item)">
        <Pencil :size="14" />
      </button>
      <button class="p-1.5 rounded-md hover:bg-red-50 text-red-500" @click="emit('remove', item)">
        <Trash2 :size="14" />
      </button>
    </div>
  </div>
</template>
