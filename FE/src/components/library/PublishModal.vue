<script setup>
import { ref, watch } from 'vue'
import { Loader2, Upload } from 'lucide-vue-next'
import BaseModal from '@/components/common/BaseModal.vue'
import { Input } from '@/components/common'

const props = defineProps({
  open: { type: Boolean, default: false },
  trip: { type: Object, default: null },
  publishing: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'submit'])

const title = ref('')
const description = ref('')
const error = ref('')

// 열릴 때 제목을 여행 제목으로 프리필
watch(() => props.open, (open) => {
  if (open) {
    title.value = props.trip?.title ?? ''
    description.value = ''
    error.value = ''
  }
})

function submit() {
  if (!title.value.trim()) {
    error.value = '제목을 입력해 주세요.'
    return
  }
  emit('submit', { title: title.value.trim(), description: description.value.trim() })
}
</script>

<template>
  <BaseModal :open="open" title="라이브러리에 게시" @close="emit('close')">
    <div class="space-y-4">
      <p class="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
        <span class="font-semibold text-slate-700 dark:text-slate-200">{{ trip?.title }}</span> 여행을
        라이브러리에 공유합니다. 현재 일정이 그대로 스냅샷으로 저장돼요.
      </p>
      <label class="block">
        <span class="text-[12px] font-medium text-slate-500 dark:text-slate-400">제목</span>
        <Input v-model="title" placeholder="예: 제주도 3박 4일 맛집 코스" class="mt-1 h-9 text-[13px]" />
      </label>
      <label class="block">
        <span class="text-[12px] font-medium text-slate-500 dark:text-slate-400">설명 (선택)</span>
        <textarea
          v-model="description"
          rows="3"
          placeholder="여행에 대한 간단한 소개를 적어주세요."
          class="mt-1 w-full rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-[13px]
                 text-slate-900 dark:text-slate-100 resize-none outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </label>
      <p v-if="error" class="text-[12px] text-red-500">{{ error }}</p>
    </div>

    <template #footer>
      <button
        @click="emit('close')"
        class="h-9 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >취소</button>
      <button
        @click="submit"
        :disabled="publishing"
        class="h-9 px-4 rounded-lg bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
      >
        <Loader2 v-if="publishing" :size="14" class="animate-spin" />
        <Upload v-else :size="14" />
        게시하기
      </button>
    </template>
  </BaseModal>
</template>
