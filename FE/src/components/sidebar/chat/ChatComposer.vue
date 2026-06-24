<script setup>
import { ref, nextTick } from 'vue'
import { Send } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chatStore'

const chat = useChatStore()
const { isTyping } = storeToRefs(chat)
const text = ref('')
const textareaRef = ref(null)

// 입력 내용에 따라 textarea 높이를 자동으로 늘린다(아래 고정 → 위로 늘어남).
// max-height(CSS) 도달 시 내부 스크롤로 전환되어 잘리지 않는다.
function autoGrow() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

async function submit() {
  if (!text.value.trim() || isTyping.value) return
  const v = text.value
  text.value = ''
  await nextTick()
  autoGrow() // 전송 후 한 줄 높이로 복원
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
        ref="textareaRef"
        v-model="text"
        @keydown="onKeydown"
        @input="autoGrow"
        rows="1"
        placeholder="가고 싶은 지역을 알려주세요"
        class="flex-1 resize-none bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 max-h-32 overflow-y-auto leading-relaxed"
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
  </div>
</template>
