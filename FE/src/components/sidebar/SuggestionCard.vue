<script setup>
import { Check, Plus } from 'lucide-vue-next'
import { computed } from 'vue'
import { findCategory } from '@/domain/itinerary'
import { Button, Badge } from '@/components/ui'

const props = defineProps({
  suggestion: { type: Object, required: true },
  added: { type: Boolean, default: false },
})
const emit = defineEmits(['add'])

const category = computed(() => findCategory(props.suggestion.category))
</script>

<template>
  <div
    class="rounded-md border bg-card px-2.5 py-2 flex items-center gap-2 text-[11px] transition"
    :class="added ? 'border-success/40 bg-success/5' : 'border-border hover:border-primary/30'"
  >
    <span class="text-base shrink-0">{{ category.emoji }}</span>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-1.5">
        <span class="font-semibold text-foreground truncate">{{ suggestion.name }}</span>
        <Badge variant="outline" class="text-[10px]">{{ category.label }}</Badge>
      </div>
      <div class="text-muted-foreground truncate mt-0.5">
        <span v-if="suggestion.time">{{ suggestion.time }} · </span>{{ suggestion.memo }}
      </div>
    </div>
    <Button v-if="!added" size="sm" class="h-7 px-2 text-[11px]" @click="emit('add')">
      <Plus :size="11" /> 추가
    </Button>
    <span v-else class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-success font-medium">
      <Check :size="11" /> 추가됨
    </span>
  </div>
</template>
