<script setup>
import { ref, nextTick, watch, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chatStore'
import { useTripStore } from '@/stores/tripStore'
import MessageBubble from './MessageBubble.vue'
import PlaceDetailModal from '@/components/common/PlaceDetailModal.vue'

const AI_EMOJI = '🤖'

const chat = useChatStore()
const trip = useTripStore()
const { messages, isTyping, typingStartedAt } = storeToRefs(chat)

const scrollEl = ref(null)
const detailItem = ref(null)
const elapsed = ref(0)
let elapsedTimer = null

watch(isTyping, (v) => {
  if (v) {
    elapsed.value = 0
    elapsedTimer = setInterval(() => { elapsed.value++ }, 1000)
  } else {
    clearInterval(elapsedTimer)
    elapsedTimer = null
    elapsed.value = 0
  }
})
onUnmounted(() => clearInterval(elapsedTimer))

const elapsedLabel = () => {
  const s = elapsed.value
  if (s < 60) return `${s}초`
  return `${Math.floor(s / 60)}분 ${s % 60}초`
}

function addToItinerary(item) {
  const date = trip.selectedDate ?? trip.days?.[0] ?? null
  if (!date) return
  trip.addItemToDate(date, {
    placeId: item.placeId ?? Number(item.id),
    name: item.name,
    category: item.category,
    memo: item.memo || '',
    address: item.address || '',
    cost: item.cost ?? 0,
    lat: item.lat,
    lng: item.lng,
    firstImage: item.firstImage,
  })
}

async function scrollToBottom() {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
}

watch([messages, isTyping], scrollToBottom, { deep: true, immediate: true })
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div ref="scrollEl" class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      <MessageBubble
        v-for="m in messages"
        :key="m.id"
        :message="m"
        :emoji="AI_EMOJI"
        @detail="detailItem = $event"
      />

      <!-- 대기 버블: 경과 시간 + 취소 버튼 -->
      <div v-if="isTyping" class="flex gap-2.5 justify-start">
        <div class="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300
                    flex items-center justify-center text-sm shrink-0">
          {{ AI_EMOJI }}
        </div>
        <div class="flex flex-col gap-1.5">
          <div class="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-2.5">
            <span class="flex gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style="animation-delay: 0ms" />
              <span class="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style="animation-delay: 120ms" />
              <span class="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style="animation-delay: 240ms" />
            </span>
            <span class="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">{{ elapsedLabel() }}</span>
          </div>
          <button
            v-if="elapsed >= 5"
            @click="chat.cancelRequest()"
            class="self-start text-[11px] text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors underline underline-offset-2"
          >
            요청 취소
          </button>
        </div>
      </div>
    </div>

    <PlaceDetailModal
      :item="detailItem"
      :show-add="true"
      @close="detailItem = null"
      @add="addToItinerary($event); detailItem = null"
    />
  </div>
</template>
