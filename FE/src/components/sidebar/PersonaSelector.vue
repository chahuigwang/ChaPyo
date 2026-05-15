<script setup>
import { useChatStore } from '@/stores/chatStore'
import { PERSONAS } from '@/domain/persona'
import { storeToRefs } from 'pinia'

const chat = useChatStore()
const { personaId, persona } = storeToRefs(chat)
</script>

<template>
  <div class="px-4 py-3 border-b border-border">
    <div class="flex items-baseline justify-between mb-2">
      <h2 class="text-xs font-semibold text-foreground tracking-wide uppercase">AI 페르소나</h2>
      <span class="text-[11px] text-muted-foreground truncate ml-2">{{ persona.tagline }}</span>
    </div>

    <div class="flex flex-wrap gap-1">
      <button
        v-for="p in PERSONAS"
        :key="p.id"
        @click="chat.selectPersona(p.id)"
        :class="[
          'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border transition-colors',
          personaId === p.id
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-foreground',
        ]"
      >
        <span>{{ p.emoji }}</span>
        <span class="font-medium">{{ p.name }}</span>
      </button>
    </div>
  </div>
</template>
