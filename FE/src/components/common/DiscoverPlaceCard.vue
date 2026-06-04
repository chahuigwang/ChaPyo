<script setup>
import { computed } from 'vue'
import { MapPin, Heart, CalendarPlus, GripVertical } from 'lucide-vue-next'
import { findCategory } from '@/types/itinerary'
import { useStorageStore } from '@/stores/storageStore'
import { useTripStore } from '@/stores/tripStore'
import { useChatStore } from '@/stores/chatStore'
import knightImg from '@/assets/knight.png'

const props = defineProps({
  item: { type: Object, required: true },
  draggable: { type: Boolean, default: false },
  showRemove: { type: Boolean, default: false },
})
const emit = defineEmits(['detail', 'dragstart', 'dragend'])

const storage = useStorageStore()
const trip = useTripStore()
const chat = useChatStore()



const liked = computed(() => storage.isLiked(props.item))

function toggleLike(e) {
  e.stopPropagation()
  storage.toggleLike(props.item)
}

function addToItinerary(e) {
  e.stopPropagation()
  const date = trip.selectedDate ?? trip.days?.[0] ?? null
  if (!date) return
  trip.addItemToDate(date, {
    name: props.item.name,
    category: props.item.category,
    memo: props.item.memo || '',
    address: props.item.address || '',
    cost: props.item.cost ?? 0,
    lat: props.item.lat,
    lng: props.item.lng,
    firstImage: props.item.firstImage,
  })
}

function handleClick() {
  emit('detail', props.item)
}

function onDragStart(e) {
  emit('dragstart', e)
}
function onDragEnd(e) {
  emit('dragend', e)
}
</script>

<template>
  <div
    class="group flex flex-col w-full rounded-xl bg-white dark:bg-slate-800 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    :draggable="draggable"
    @click="handleClick"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <!-- Image -->
    <div class="relative w-full h-32 shrink-0 bg-slate-100 dark:bg-slate-700">
      <img
        v-if="item.firstImage"
        :src="item.firstImage"
        :alt="item.name"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div v-else class="w-full h-full">
        <img :src="knightImg" alt="기본 이미지" class="w-full h-full object-cover object-[center_25%] opacity-40" />
      </div>

      <!-- Drag handle -->
      <div
        v-if="draggable"
        class="absolute top-2 left-2 p-1 rounded-md bg-black/20 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical :size="13" />
      </div>

      <!-- Heart toggle button + like count -->
      <div class="absolute top-2.5 right-2.5 flex flex-col items-center gap-0.5">
        <button
          @click="toggleLike"
          class="p-1.5 rounded-full backdrop-blur-md transition-all duration-200"
          :class="liked
            ? 'bg-red-500/80 hover:bg-red-600/90 text-white'
            : 'bg-black/20 hover:bg-black/50 text-white'"
          title="좋아요"
        >
          <Heart :size="14" :class="liked ? 'fill-white' : ''" />
        </button>
        <span v-if="item.likeCount > 0" class="text-[10px] font-semibold text-white drop-shadow leading-none">
          {{ item.likeCount }}
        </span>
      </div>

      <!-- Category badge -->
      <span class="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm text-white text-[10px] font-medium">
        {{ findCategory(item.category)?.emoji }} {{ findCategory(item.category)?.label }}
      </span>
    </div>

    <!-- Body -->
    <div class="p-3 flex flex-col flex-1 gap-1">
      <h3 class="text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate leading-snug">
        {{ item.name }}
      </h3>
      <p
        v-if="item.overview || item.description || item.memo"
        class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed"
      >
        {{ item.overview ?? item.description ?? item.memo }}
      </p>
      <div v-if="item.address" class="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
        <MapPin :size="11" class="shrink-0" />
        <span class="truncate">{{ item.address }}</span>
      </div>

      <!-- Footer actions -->
      <div class="mt-auto pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50">
        <span v-if="item.likeCount && item.likeCount > 0" class="inline-flex items-center gap-1 text-[11px] text-slate-400">
          <Heart :size="11" class="fill-red-400 text-red-400" />
          {{ item.likeCount.toLocaleString() }}
        </span>
        <span v-else class="flex-1" />

        <button
          @click="addToItinerary"
          class="shrink-0 inline-flex items-center gap-1.5 px-2.5 h-7 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary hover:text-white transition-colors"
          title="일정에 추가"
        >
          <CalendarPlus :size="12" /> 일정에 추가
        </button>
      </div>
    </div>
  </div>
</template>
