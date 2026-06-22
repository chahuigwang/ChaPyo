<script setup>
import { computed } from 'vue'
import { MapPin, Heart, GripVertical, Star } from 'lucide-vue-next'
import { findCategory } from '@/types/itinerary'
import { useStorageStore } from '@/stores/storageStore'

const props = defineProps({
  item: { type: Object, required: true },
  draggable: { type: Boolean, default: false },
})
const emit = defineEmits(['detail', 'dragstart', 'dragend'])

const storage = useStorageStore()

const liked = computed(() => storage.isLiked(props.item))
const likeCount = computed(() => storage.likeCountOf(props.item))

// 리뷰 평점/개수 (BE 응답값). 평점이 있을 때만 노출, 개수는 필드가 오면 표시.
const avgRating = computed(() => {
  const v = Number(props.item.avgRating)
  return Number.isFinite(v) && v > 0 ? v : null
})
const ratingText = computed(() => (avgRating.value != null ? avgRating.value.toFixed(1) : ''))
const reviewCount = computed(() => {
  const v = Number(props.item.reviewCount)
  return Number.isFinite(v) ? v : null
})

function toggleLike(e) {
  e.stopPropagation()
  storage.toggleLike(props.item)
}

function onDragStart(e) { emit('dragstart', e) }
function onDragEnd(e) { emit('dragend', e) }
</script>

<template>
  <div
    class="group flex flex-col w-full rounded-xl bg-white dark:bg-slate-800 shadow-sm overflow-hidden
           hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    :draggable="draggable"
    @click="emit('detail', item)"
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
      <div v-else class="w-full h-full flex items-center justify-center text-[12px] text-slate-400 dark:text-slate-500 select-none">
        이미지가 없습니다
      </div>

      <!-- Drag handle -->
      <div
        v-if="draggable"
        class="absolute top-2 left-2 p-1 rounded-md bg-black/20 backdrop-blur-sm text-white
               opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical :size="13" />
      </div>

      <!-- Heart + like count -->
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
        <span v-if="likeCount > 0" class="text-[11px] font-semibold text-white drop-shadow leading-none">
          {{ likeCount }}
        </span>
      </div>

      <!-- Category badge -->
      <span class="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                   bg-black/30 backdrop-blur-sm text-white text-[11px] font-medium">
        {{ findCategory(item.category)?.emoji }} {{ findCategory(item.category)?.label }}
      </span>
    </div>

    <!-- Body -->
    <div class="p-3 flex flex-col flex-1 gap-1">
      <h3 class="text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate leading-snug">
        {{ item.name }}
      </h3>
      <!-- 리뷰 평점 · 개수 -->
      <div v-if="avgRating != null" class="flex items-center gap-1 text-[11px]">
        <Star :size="11" class="fill-amber-400 text-amber-400" />
        <span class="font-semibold text-slate-700 dark:text-slate-200">{{ ratingText }}</span>
        <span v-if="reviewCount != null" class="text-slate-400">리뷰 {{ reviewCount.toLocaleString() }}</span>
      </div>
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
    </div>
  </div>
</template>
