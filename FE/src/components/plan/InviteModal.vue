<script setup>
import { computed, ref, watch } from 'vue'
import { Copy, Check, Link2, Users } from 'lucide-vue-next'
import BaseModal from '@/components/common/BaseModal.vue'
import { Button } from '@/components/common'
import { useTripStore } from '@/stores/tripStore'

const props = defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close'])

const trip = useTripStore()
const role = ref('editor')
const copied = ref(false)

const shareLink = computed(() => {
  const id = trip.currentTrip?.id ?? 'demo'
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://enjoytrip.app'
  return `${origin}/share/${id}?role=${role.value}`
})

async function copy() {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1600)
  } catch {
    copied.value = false
  }
}
watch(() => props.open, (v) => { if (!v) copied.value = false })
</script>

<template>
  <BaseModal :open="open" title="여행에 초대하기" @close="emit('close')">
    <div class="space-y-5">
      <p class="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
        링크를 받은 사람은 선택한 권한으로 이 여행 계획에 참여할 수 있어요.
      </p>

      <!-- Role selector -->
      <div>
        <div class="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
          <Users :size="12" /> 권한
        </div>
        <div class="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 w-full">
          <button
            type="button"
            class="flex-1 px-3 py-2 text-[12px] font-medium rounded-md transition-all duration-200"
            :class="role === 'viewer'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'"
            @click="role = 'viewer'"
          >Viewer · 보기 전용</button>
          <button
            type="button"
            class="flex-1 px-3 py-2 text-[12px] font-medium rounded-md transition-all duration-200"
            :class="role === 'editor'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'"
            @click="role = 'editor'"
          >Editor · 함께 편집</button>
        </div>
      </div>

      <!-- Copyable link -->
      <div>
        <div class="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
          <Link2 :size="12" /> 공유 링크
        </div>
        <div class="flex items-stretch gap-2">
          <input
            :value="shareLink"
            readonly
            class="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60
                   text-[12px] text-slate-700 dark:text-slate-200
                   outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            @focus="$event.target.select()"
          />
          <button
            type="button"
            class="px-3 rounded-lg text-[12px] font-medium transition-all duration-200
                   flex items-center gap-1.5 shadow-sm"
            :class="copied
              ? 'bg-emerald-500 text-white'
              : 'bg-[#00B7EB] text-white hover:bg-[#0298c4] hover:-translate-y-0.5 hover:shadow-md'"
            @click="copy"
          >
            <Check v-if="copied" :size="13" />
            <Copy v-else :size="13" />
            {{ copied ? '복사됨' : '복사' }}
          </button>
        </div>
      </div>
    </div>
    <template #footer>
      <Button variant="ghost" size="sm" @click="emit('close')">닫기</Button>
    </template>
  </BaseModal>
</template>
