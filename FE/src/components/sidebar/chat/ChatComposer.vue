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
  <div class="px-6 py-4">
    <div
      class="flex items-end gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2.5
             ring-1 ring-transparent focus-within:ring-primary transition-all"
    >
      <textarea
        v-model="text"
        @keydown="onKeydown"
        rows="1"
        placeholder="가고 싶은 지역을 알려주세요"
        class="flex-1 resize-none bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 max-h-32"
      />
      <button
        @click="submit"
        :disabled="!text.trim() || isTyping"
        class="p-1.5 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-slate-100
               disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Send :size="16" />
      </button>
    </div>
    <p class="mt-2.5 text-[11px] text-slate-400 dark:text-slate-500">
      추천 카드를 클릭하면 상세 정보를, ♥ 를 누르면 좋아요를 할 수 있어요.
    </p>
  </div>
</template>
