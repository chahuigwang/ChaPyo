<script setup>
import { ref, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chatStore'
import { useTripPlanner } from '@/composables/useTripPlanner'
import MessageBubble from './MessageBubble.vue'

const chat = useChatStore()
const { messages, isTyping, persona } = storeToRefs(chat)
const { addSuggestionToTrip } = useTripPlanner()

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
    <div ref="scrollEl" class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      <MessageBubble
        v-for="m in messages"
        :key="m.id"
        :message="m"
        :emoji="persona.emoji"
        @addSuggestion="onAdd"
      />

      <div v-if="isTyping" class="flex gap-2.5 justify-start">
        <div class="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-sm shrink-0">
          {{ persona.emoji }}
        </div>
        <div class="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style="animation-delay: 0ms" />
          <span class="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style="animation-delay: 120ms" />
          <span class="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style="animation-delay: 240ms" />
        </div>
      </div>
    </div>
  </div>
</template>
