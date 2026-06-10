<script setup>
import { ref, computed } from 'vue'
import { Clock, Trash2, MapPin, Heart } from 'lucide-vue-next'
import { findCategory } from '@/types/itinerary'
import { useStorageStore } from '@/stores/storageStore'
import { colorForUser } from '@/composables/useUserColor'

const props = defineProps({
  item: { type: Object, required: true },
  index: { type: Number, required: true },
  hovered: { type: Boolean, default: false },
  pendingDelete: { type: String, default: null },
})

const emit = defineEmits([
  'save', 'request-delete', 'confirm-delete',
  'click', 'mouseenter', 'mouseleave', 'dragstart', 'dragend',
])

const rootEl = ref(null)
defineExpose({ $el: rootEl })

const storage = useStorageStore()
const liked = computed(() => storage.isLiked(props.item))
const nicknameColor = computed(() => colorForUser(props.item.addedByUserId ?? props.item.nickname))

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect width="80" height="80" fill="%23f1f5f9"/%3E%3Ctext x="50%25" y="54%25" dominant-baseline="middle" text-anchor="middle" font-size="30"%3E' + encodeURIComponent('🗺') + '%3C/text%3E%3C/svg%3E'
</script>

<template>
  <div
    ref="rootEl"
    :draggable="true"
    @dragstart="emit('dragstart', $event)"
    @dragend="emit('dragend')"
    @mouseenter="emit('mouseenter')"
    @mouseleave="emit('mouseleave')"
    class="place-card group relative rounded-xl bg-white dark:bg-slate-900 shadow-sm
           hover:shadow-md transition-all duration-200 overflow-hidden"
    :class="hovered ? 'place-card--hovered' : ''"
  >
    <!-- ── Main row ─────────────────────────────────────────── -->
    <div class="flex gap-0 cursor-pointer" @click="emit('click')">

      <!-- Thumbnail -->
      <div class="shrink-0 w-20 self-stretch min-h-20 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
        <img
          v-if="item.firstImage || item.thumbnail || item.firstimage"
          :src="item.firstImage || item.thumbnail || item.firstimage"
          :alt="item.name"
          class="w-full h-full object-cover"
          loading="lazy"
          @error="$event.target.src = PLACEHOLDER"
        />
        <div v-else class="w-full h-full flex items-center justify-center text-3xl select-none">
          {{ findCategory(item.category).emoji }}
        </div>

        <!-- Sequence badge -->
        <span
          class="absolute top-1.5 left-1.5 z-10 inline-flex items-center justify-center h-5 w-5
                 rounded-full bg-[#00B7EB] text-white text-[11px] font-bold shadow
                 ring-2 ring-white dark:ring-slate-900"
        >{{ index + 1 }}</span>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0 py-2.5 px-3">
        <div class="flex items-start justify-between gap-1">
          <div class="min-w-0">
            <p class="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5 leading-none">
              {{ findCategory(item.category).label }}
            </p>
            <h4 class="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate leading-snug">
              {{ item.name }}
            </h4>
          </div>

          <!-- 좋아요 + 삭제 (같은 라인, 큰 아이콘) -->
          <div class="flex items-center gap-1.5 shrink-0 mt-0.5">
            <button
              @click.stop="storage.toggleLike(item)"
              class="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
              :class="liked
                ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                : 'text-slate-400 bg-slate-100 dark:bg-slate-800 hover:text-red-500'"
              :title="liked ? '좋아요 취소' : '좋아요'"
            >
              <Heart :size="16" :class="liked ? 'fill-red-500' : ''" />
            </button>
            <button
              @click.stop="pendingDelete === item.id ? emit('confirm-delete') : emit('request-delete')"
              class="h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-150"
              :class="pendingDelete === item.id
                ? 'text-white bg-red-500 hover:bg-red-600 scale-110'
                : 'text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40'"
              :title="pendingDelete === item.id ? '한 번 더 클릭하면 삭제됩니다' : '삭제'"
            ><Trash2 :size="16" /></button>
          </div>
        </div>

        <div v-if="item.time || item.addr || item.address" class="mt-1.5 flex items-center gap-2 min-w-0">
          <span v-if="item.time" class="shrink-0 inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <Clock :size="10" /> {{ item.time }}
          </span>
          <span v-if="item.addr || item.address"
                class="min-w-0 flex-1 inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <MapPin :size="10" class="shrink-0" />
            <span class="truncate">{{ item.addr || item.address }}</span>
          </span>
        </div>

        <!-- 닉네임 · 금액 · 메모 (왼쪽 같은 라인) -->
        <div v-if="item.nickname || item.cost || item.memo" class="mt-1.5 flex items-center gap-2 min-w-0">
          <span
            v-if="item.nickname"
            class="shrink-0 max-w-[84px] truncate px-1.5 py-0.5 rounded-md text-[11px] font-semibold"
            :style="{ color: nicknameColor, backgroundColor: nicknameColor + '1f' }"
            :title="`${item.nickname} 님이 추가`"
          >{{ item.nickname }}</span>
          <span v-if="item.cost" class="shrink-0 text-[11px] font-semibold text-primary">{{ won(item.cost) }}</span>
          <span v-if="item.memo" class="min-w-0 flex-1 truncate text-[11px] text-slate-400 dark:text-slate-500">{{ item.memo }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.place-card--hovered {
  transform: translateY(-1px);
  box-shadow: 0 0 0 1.5px rgba(0,183,235,.5), 0 8px 22px -6px rgba(0,183,235,.35);
}
</style>
