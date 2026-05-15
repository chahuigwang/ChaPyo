<script setup>
import { ref, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chatStore'
import { useTripPlanner } from '@/composables/useTripPlanner'
import MessageBubble from './MessageBubble.vue'
import { Badge } from '@/components/ui'

const chat = useChatStore()
const { messages, isTyping, persona } = storeToRefs(chat)
const { selectedDate, addSuggestionToTrip } = useTripPlanner()

const scrollEl = ref(null)

async function scrollToBottom() {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
}

watch([messages, isTyping], scrollToBottom, { deep: true, immediate: true })

function onAdd({ messageId, index, suggestion }) {
  addSuggestionToTrip(messageId, index, suggestion)
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div
      v-if="selectedDate"
      class="px-4 py-1.5 text-[11px] text-muted-foreground bg-muted/40 border-b border-border flex items-center justify-between"
    >
      <span>추가 대상</span>
      <Badge variant="outline">{{ selectedDate }}</Badge>
    </div>

    <div ref="scrollEl" class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      <MessageBubble
        v-for="m in messages"
        :key="m.id"
        :message="m"
        :emoji="persona.emoji"
        @addSuggestion="onAdd"
      />

      <div v-if="isTyping" class="flex gap-2 justify-start">
        <div class="h-7 w-7 rounded-full bg-brand-50 text-primary flex items-center justify-center text-sm shrink-0">
          {{ persona.emoji }}
        </div>
        <div class="bg-muted rounded-xl rounded-bl-sm px-3 py-2.5 flex gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style="animation-delay: 0ms" />
          <span class="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style="animation-delay: 120ms" />
          <span class="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style="animation-delay: 240ms" />
        </div>
      </div>
    </div>
  </div>
</template>
