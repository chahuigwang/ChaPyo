<script setup>
import { computed } from 'vue'
import { useStorageStore } from '@/stores/storageStore'
import DiscoverPlaceCard from '@/components/common/DiscoverPlaceCard.vue'

const props = defineProps({
  message: { type: Object, required: true },
  emoji: { type: String, default: '🤖' },
})

const isUser = computed(() => props.message.role === 'user')
const isSystem = computed(() => props.message.role === 'system')

const storage = useStorageStore()

function onSuggestionDragStart(e, item) {
  storage.setDragging({ source: 'chat', item })
  try { e.dataTransfer.effectAllowed = 'copy'; e.dataTransfer.setData('text/plain', item.name) } catch {}
}
function onSuggestionDragEnd() { storage.clearDragging() }
</script>

<template>
  <div v-if="isSystem" class="text-center">
    <span class="inline-block text-[11px] text-slate-400 dark:text-slate-500">
      {{ message.content }}
    </span>
  </div>

  <div v-else :class="['flex gap-2.5', isUser ? 'justify-end' : 'justify-start']">
    <div v-if="!isUser" class="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-sm shrink-0">
      {{ emoji }}
    </div>

    <div class="max-w-[85%] flex flex-col gap-2">
      <div
        :class="[
          'w-fit max-w-full rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm self-end'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm',
        ]"
      >
        {{ message.content }}
      </div>

      <div v-if="message.suggestions?.length" class="flex flex-col gap-2 w-full">
        <DiscoverPlaceCard
          v-for="(s, i) in message.suggestions"
          :key="i"
          :item="s"
          :draggable="true"
          @dragstart="onSuggestionDragStart($event, s)"
          @dragend="onSuggestionDragEnd"
        />
      </div>
    </div>
  </div>
</template>
