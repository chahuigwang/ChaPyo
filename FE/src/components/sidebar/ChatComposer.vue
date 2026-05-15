<script setup>
import { ref } from 'vue'
import { Send } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chatStore'

const chat = useChatStore()
const { isTyping } = storeToRefs(chat)
const text = ref('')

async function submit() {
  if (!text.value.trim() || isTyping.value) return
  const v = text.value
  text.value = ''
  await chat.sendMessage(v)
}

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    submit()
  }
}
</script>

<template>
  <div class="border-t border-border p-3">
    <div
      class="flex items-end gap-2 rounded-md border border-border bg-muted px-3 py-2
             focus-within:border-ring focus-within:bg-card transition"
    >
      <textarea
        v-model="text"
        @keydown="onKeydown"
        rows="1"
        placeholder="가고 싶은 지역을 알려주세요 (예: 서울, 부산, 제주)"
        class="flex-1 resize-none bg-transparent outline-none text-sm placeholder:text-muted-foreground max-h-32"
      />
      <button
        @click="submit"
        :disabled="!text.trim() || isTyping"
        class="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-brand-600
               disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed"
      >
        <Send :size="16" />
      </button>
    </div>
    <p class="mt-1.5 text-[11px] text-muted-foreground">
      AI가 추천 카드를 보내면 클릭해서 일정에 추가할 수 있어요.
    </p>
  </div>
</template>
