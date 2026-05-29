<script setup>
import { MapPin, Plus, Heart, Image as ImageIcon, Image } from 'lucide-vue-next'
import { findCategory } from '@/types/itinerary'
import knightImg from '@/assets/knight.png'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['add', 'like'])

function handleAdd() {
  emit('add', props.item)
}

function handleLike() {
  emit('like', props.item)
}
</script>

<template>
  <div class="group flex flex-col w-full rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
    
    <div class="relative w-full h-40 shrink-0 bg-slate-100 dark:bg-slate-700">
      <img
        v-if="item.firstImage"
        :src="item.firstImage"
        :alt="item.name"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <!-- <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-500">
        <ImageIcon :size="32" class="mb-1 opacity-50" />
        <span class="text-[10px]">NO IMAGE</span>
      </div> -->
      <div v-else class="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-700">
        <img 
          :src="knightImg" 
          alt="기본 이미지" 
          class="w-full h-full object-cover object-[center_25%] opacity-50" 
        />
      </div>

      <button
        @click.stop="handleLike"
        class="absolute top-3 right-3 p-2 rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur-md transition-all duration-200"
        title="좋아요"
      >
        <Heart 
          :size="16" 
          :class="{ 'fill-red-500 text-red-500': item.likeCount > 0 }" 
        />
      </button>
    </div>

    <div class="p-4 flex flex-col flex-1">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1">
          <h3 class="text-[15px] font-bold text-slate-900 dark:text-slate-100 truncate">
            {{ item.name }}
          </h3>
          <div class="mt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <MapPin :size="12" class="shrink-0" />
            <span class="truncate">{{ item.address }}</span>
          </div>
        </div>
        
        <div class="shrink-0 text-xl leading-none bg-slate-50 dark:bg-slate-700/50 p-1.5 rounded-lg">
          {{ findCategory(item.category)?.emoji || '📍' }}
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50 pt-3">
        <div class="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          <span v-if="item.likeCount > 0">
            좋아요 <strong class="text-slate-700 dark:text-slate-300">{{ item.likeCount.toLocaleString() }}</strong>
          </span>
        </div>
        
        
        <button
          @click="handleAdd"
          class="shrink-0 inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-primary/10 text-primary text-[12px] font-semibold hover:bg-primary hover:text-white transition-colors"
          title="보관함에 추가"
        >
          <Plus :size="14" /> 담기
        </button>
      </div>
    </div>

  </div>
</template>