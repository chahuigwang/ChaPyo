<script setup>
import { computed } from 'vue'
import draggable from 'vuedraggable'
import DiscoverPlaceCard from '@/components/common/DiscoverPlaceCard.vue'
import { useDragPreview } from '@/composables/useDragPreview'

const props = defineProps({
  message: { type: Object, required: true },
  emoji: { type: String, default: '🤖' },
})
const emit = defineEmits(['detail'])

const { onMove, onDragPreviewEnd } = useDragPreview()

const isUser = computed(() => props.message.role === 'user')
const isSystem = computed(() => props.message.role === 'system')

// 플라이아웃 → 타임라인 clone 시 원본 참조 공유 방지
function cloneCard(item) { return { ...item } }
</script>

<template>
  <div v-if="isSystem" class="text-center">
    <span class="inline-block text-[11px] text-slate-400 dark:text-slate-500">
      {{ message.content }}
    </span>
  </div>

  <div v-else :class="['flex gap-1.5', isUser ? 'justify-end' : 'justify-start']">
    <div v-if="!isUser" class="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-sm shrink-0">
      {{ emoji }}
    </div>

    <div class="max-w-[90%] flex flex-col gap-2">
      <div
        :class="[
          'w-fit max-w-full rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm self-end'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-sm',
        ]"
      >
        {{ message.content }}
      </div>

      <draggable
        v-if="message.places?.length"
        :list="message.places"
        item-key="placeId"
        :group="{ name: 'itinerary', pull: 'clone', put: false }"
        :sort="false"
        :clone="cloneCard"
        :move="onMove"
        @end="onDragPreviewEnd"
        class="flex flex-col gap-2 w-full"
      >
        <template #item="{ element: s }">
          <DiscoverPlaceCard
            :item="s"
            :draggable="true"
            @detail="emit('detail', $event)"
          />
        </template>
      </draggable>
    </div>
  </div>
</template>
