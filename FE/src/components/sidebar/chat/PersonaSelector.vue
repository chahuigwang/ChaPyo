<script setup>
import { storeToRefs } from 'pinia'
import { Sparkles } from 'lucide-vue-next'
import { useChatStore } from '@/stores/chatStore'

const chat = useChatStore()
const { persona } = storeToRefs(chat)

// 빠른 입력용 예시 칩 — 클릭 시 페르소나 입력란을 채운다.
const PRESETS = ['미식가', 'INTJ 20대 남자', '가성비 여행러', '감성 사진가', '아이와 함께']
function applyPreset(p) { chat.setPersona(p) }
</script>

<template>
  <div class="px-5 pt-5 pb-4">
    <h2 class="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">
      AI 페르소나
    </h2>

    <label class="block">
      <div class="relative">
        <Sparkles :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
        <input
          :value="persona"
          @input="chat.setPersona($event.target.value)"
          type="text"
          placeholder="예: 미식가, INTJ 20대 남자"
          class="w-full h-10 pl-9 pr-3 text-[13px] rounded-xl bg-slate-50 dark:bg-slate-800/60
                 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500
                 outline-none ring-1 ring-transparent focus:ring-primary transition-all"
        />
      </div>
    </label>

    <div class="mt-2.5 flex flex-wrap gap-1.5">
      <button
        v-for="p in PRESETS"
        :key="p"
        type="button"
        @click="applyPreset(p)"
        class="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors"
        :class="persona === p
          ? 'bg-primary text-primary-foreground'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'"
      >
        {{ p }}
      </button>
    </div>

    <p class="mt-2.5 text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
      원하는 정보를 자유롭게 조합해 입력하세요. 입력한 페르소나로 맞춤 추천을 받습니다.
    </p>
  </div>
</template>
