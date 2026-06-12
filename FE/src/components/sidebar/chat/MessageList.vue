<script setup>
import { ref, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chatStore'
import { useTripStore } from '@/stores/tripStore'
import MessageBubble from './MessageBubble.vue'
import PlaceDetailModal from '@/components/common/PlaceDetailModal.vue'

const AI_EMOJI = '🤖'

const chat = useChatStore()
const trip = useTripStore()
const { messages, isTyping } = storeToRefs(chat)

const scrollEl = ref(null)

// 클릭한 추천 카드 — PlaceDetailModal 이 placeId로 상세를 조회/표시한다
const detailItem = ref(null)

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

      <div v-if="isTyping" class="flex gap-2.5 justify-start">
        <div class="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300
                    flex items-center justify-center text-sm shrink-0">
          {{ AI_EMOJI }}
        </div>
        <div class="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style="animation-delay: 0ms" />
          <span class="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style="animation-delay: 120ms" />
          <span class="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style="animation-delay: 240ms" />
        </div>
      </div>
    </div>

    <!-- 추천 카드 클릭 시 상세정보 모달 -->
    <PlaceDetailModal
      :item="detailItem"
      :show-add="true"
      @close="detailItem = null"
      @add="addToItinerary($event); detailItem = null"
    />
  </div>
</template>
