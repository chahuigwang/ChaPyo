<script setup>
import { computed } from 'vue'
import SuggestionCard from './SuggestionCard.vue'
import { Avatar } from '@/components/ui'

const props = defineProps({
  message: { type: Object, required: true },
  emoji: { type: String, default: '🤖' },
})
const emit = defineEmits(['addSuggestion'])

const isUser = computed(() => props.message.role === 'user')
const isSystem = computed(() => props.message.role === 'system')
const isAdded = (i) => (props.message.addedIds ?? []).includes(i)
</script>

<template>
  <!-- System notice -->
  <div v-if="isSystem" class="text-center">
    <span class="inline-block text-[11px] text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
      {{ message.content }}
    </span>
  </div>

  <div v-else :class="['flex gap-2', isUser ? 'justify-end' : 'justify-start']">
    <Avatar v-if="!isUser" size="sm" variant="brand">{{ emoji }}</Avatar>

    <div class="max-w-[82%] space-y-1.5">
      <div
        :class="[
          'rounded-xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap break-words',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm',
        ]"
      >
        {{ message.content }}
      </div>

      <div v-if="message.suggestions?.length" class="space-y-1.5">
        <SuggestionCard
          v-for="(s, i) in message.suggestions"
          :key="i"
          :suggestion="s"
          :added="isAdded(i)"
          @add="emit('addSuggestion', { messageId: message.id, index: i, suggestion: s })"
        />
      </div>
    </div>
  </div>
</template>
