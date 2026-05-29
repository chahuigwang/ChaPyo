<script setup>
import { ref } from 'vue'
import { MapPin, Plus, Heart } from 'lucide-vue-next'
import { findCategory } from '@/types/itinerary'
import knightImg from '@/assets/knight.png'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['add', 'detail'])

// 로컬 좋아요 상태 (서버 연동 전 가짜 토글)
const liked = ref(false)
const localLikeCount = ref(props.item.likeCount ?? 0)

function handleLike(e) {
  e.stopPropagation()
  liked.value = !liked.value
  localLikeCount.value += liked.value ? 1 : -1
}

function handleAdd(e) {
  e.stopPropagation()
  emit('add', props.item)
}

function handleClick() {
  emit('detail', props.item)
}
</script>

<template>
  <div
    class="group flex flex-col w-full rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    @click="handleClick"
  >
    <!-- Image -->
    <div class="relative w-full h-36 shrink-0 bg-slate-100 dark:bg-slate-700">
      <img
        v-if="item.firstImage"
        :src="item.firstImage"
        :alt="item.name"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div v-else class="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-700">
        <img
          :src="knightImg"
          alt="기본 이미지"
          class="w-full h-full object-cover object-[center_25%] opacity-50"
        />
      </div>

      <!-- Like button -->
      <button
        @click="handleLike"
        class="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur-md transition-all duration-200"
        title="좋아요"
      >
        <Heart
          :size="15"
          :class="liked ? 'fill-red-500 text-red-500' : 'text-white'"
        />
      </button>

      <!-- Category badge -->
      <span class="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm text-white text-[10px] font-medium">
        {{ findCategory(item.category)?.emoji }} {{ findCategory(item.category)?.label }}
      </span>
    </div>

    <!-- Body -->
    <div class="p-3 flex flex-col flex-1 gap-1.5">
      <h3 class="text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate leading-snug">
        {{ item.name }}
      </h3>

      <!-- Description (overview) -->
      <p
        v-if="item.overview || item.description"
        class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed"
      >
        {{ item.overview ?? item.description }}
      </p>

      <div class="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
        <MapPin :size="11" class="shrink-0" />
        <span class="truncate">{{ item.address }}</span>
      </div>

      <!-- Footer -->
      <div class="mt-auto pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50">
        <button
          @click="handleLike"
          class="inline-flex items-center gap-1 text-[11px] font-medium transition-colors"
          :class="liked
            ? 'text-red-500'
            : 'text-slate-400 dark:text-slate-500 hover:text-red-400'"
        >
          <Heart :size="12" :class="liked ? 'fill-red-500' : ''" />
          <span>{{ localLikeCount > 0 ? localLikeCount.toLocaleString() : '좋아요' }}</span>
        </button>

        <button
          @click="handleAdd"
          class="shrink-0 inline-flex items-center gap-1.5 px-2.5 h-7 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary hover:text-white transition-colors"
          title="보관함에 추가"
        >
          <Plus :size="13" /> 담기
        </button>
      </div>
    </div>
  </div>
</template>
