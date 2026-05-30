<script setup>
import { Clock, Pencil, Trash2, MapPin, X } from 'lucide-vue-next'
import { findCategory } from '@/types/itinerary'

const props = defineProps({
  item: { type: Object, required: true },
  index: { type: Number, required: true },
  hovered: { type: Boolean, default: false },
  pendingDelete: { type: String, default: null },
})

const emit = defineEmits(['edit', 'request-delete', 'confirm-delete', 'cancel-delete', 'click', 'mouseenter', 'mouseleave', 'dragstart', 'dragend'])

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'

import { ref } from 'vue'
const rootEl = ref(null)
defineExpose({ $el: rootEl })

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56"%3E%3Crect width="56" height="56" fill="%23f1f5f9"/%3E%3Ctext x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" font-size="22"%3E' + encodeURIComponent('🗺') + '%3C/text%3E%3C/svg%3E'
</script>

<template>
  <div
    ref="rootEl"
    draggable="true"
    @dragstart="emit('dragstart', $event)"
    @dragend="emit('dragend')"
    @click="emit('click')"
    @mouseenter="emit('mouseenter')"
    @mouseleave="emit('mouseleave')"
    class="place-card group relative mx-4 rounded-xl bg-white dark:bg-slate-900 shadow-sm
           hover:shadow-md transition-all duration-200 flex gap-3 overflow-hidden cursor-pointer"
    :class="hovered ? 'place-card--hovered' : ''"
  >
    <!-- Sequence badge (overlay) -->
    <span
      class="absolute top-2 left-2 z-10 inline-flex items-center justify-center h-5 w-5 rounded-full
             bg-[#00B7EB] text-white text-[10px] font-bold shadow-sm ring-2 ring-white dark:ring-slate-900"
    >{{ index + 1 }}</span>

    <!-- Thumbnail -->
    <div class="shrink-0 w-16 self-stretch bg-slate-100 dark:bg-slate-800 overflow-hidden">
      <img
        v-if="item.thumbnail || item.firstimage"
        :src="item.thumbnail || item.firstimage"
        :alt="item.name"
        class="w-full h-full object-cover"
        loading="lazy"
        @error="$event.target.src = PLACEHOLDER"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-2xl select-none">
        {{ findCategory(item.category).emoji }}
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0 py-3 pr-3">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="text-[12px] text-slate-400 dark:text-slate-500 mb-0.5">{{ findCategory(item.category).label }}</p>
          <h4 class="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">{{ item.name }}</h4>
        </div>
        <!-- Actions -->
        <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
          <button
            @click.stop="emit('edit')"
            class="h-6 w-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="수정"
          ><Pencil :size="12" /></button>
          <button
            v-if="pendingDelete !== item.id"
            @click.stop="emit('request-delete')"
            class="h-6 w-6 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="삭제"
          ><Trash2 :size="12" /></button>
          <button
            v-else
            @click.stop="emit('confirm-delete')"
            class="h-6 px-1.5 rounded-md text-[9px] font-semibold text-white bg-red-500 hover:bg-red-600 flex items-center"
          >정말?</button>
          <button
            v-if="pendingDelete === item.id"
            @click.stop="emit('cancel-delete')"
            class="h-6 w-6 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          ><X :size="11" /></button>
        </div>
      </div>

      <div class="mt-1.5 flex items-center gap-2 flex-wrap">
        <span v-if="item.time" class="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <Clock :size="10" /> {{ item.time }}
        </span>
        <span v-if="item.addr || item.address" class="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
          <MapPin :size="10" /> {{ item.addr || item.address }}
        </span>
        <span v-if="item.cost" class="text-[11px] font-semibold text-primary ml-auto">{{ won(item.cost) }}</span>
      </div>

      <p v-if="item.memo" class="mt-1 text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 leading-relaxed">{{ item.memo }}</p>
    </div>
  </div>
</template>

<style scoped>
.place-card--hovered {
  transform: translateY(-1px);
  box-shadow: 0 0 0 1.5px rgba(0,183,235,.5), 0 8px 22px -6px rgba(0,183,235,.35);
}
</style>
