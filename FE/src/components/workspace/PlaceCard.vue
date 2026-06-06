<script setup>
import { ref } from 'vue'
import { Clock, Pencil, Trash2, MapPin, Check } from 'lucide-vue-next'
import { findCategory } from '@/types/itinerary'

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

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect width="80" height="80" fill="%23f1f5f9"/%3E%3Ctext x="50%25" y="54%25" dominant-baseline="middle" text-anchor="middle" font-size="30"%3E' + encodeURIComponent('🗺') + '%3C/text%3E%3C/svg%3E'

// ── Inline edit ──────────────────────────────────────────────
const editOpen = ref(false)
const draft = ref({ time: '', cost: 0, memo: '' })

function openEdit() {
  draft.value = {
    time: props.item.time || '',
    cost: props.item.cost || 0,
    memo: props.item.memo || '',
  }
  editOpen.value = true
}
function cancelEdit() { editOpen.value = false }
function saveEdit() {
  emit('save', {
    time: draft.value.time,
    cost: Number(draft.value.cost) || 0,
    memo: draft.value.memo.trim(),
  })
  editOpen.value = false
}
</script>

<template>
  <div
    ref="rootEl"
    :draggable="!editOpen"
    @dragstart="!editOpen && emit('dragstart', $event)"
    @dragend="emit('dragend')"
    @mouseenter="emit('mouseenter')"
    @mouseleave="emit('mouseleave')"
    class="place-card group relative mx-4 rounded-xl bg-white dark:bg-slate-900 shadow-sm
           hover:shadow-md transition-all duration-200 overflow-hidden"
    :class="hovered && !editOpen ? 'place-card--hovered' : ''"
  >
    <!-- ── Main row ─────────────────────────────────────────── -->
    <div class="flex gap-0 cursor-pointer" @click="!editOpen && emit('click')">

      <!-- Thumbnail -->
      <div class="shrink-0 w-20 h-20 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
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
                 rounded-full bg-[#00B7EB] text-white text-[10px] font-bold shadow
                 ring-2 ring-white dark:ring-slate-900"
        >{{ index + 1 }}</span>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0 py-2.5 px-3">
        <div class="flex items-start justify-between gap-1">
          <div class="min-w-0">
            <p class="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5 leading-none">
              {{ findCategory(item.category).label }}
            </p>
            <h4 class="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate leading-snug">
              {{ item.name }}
            </h4>
          </div>

          <!-- Action buttons -->
          <div class="flex items-center gap-0.5 shrink-0 mt-0.5"
               :class="editOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'">
            <button
              @click.stop="editOpen ? cancelEdit() : openEdit()"
              class="h-6 w-6 rounded-md flex items-center justify-center transition-colors"
              :class="editOpen
                ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                : 'text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800'"
              :title="editOpen ? '닫기' : '수정'"
            >
              <X v-if="editOpen" :size="12" />
              <Pencil v-else :size="12" />
            </button>

            <button
              v-if="!editOpen"
              @click.stop="pendingDelete === item.id ? emit('confirm-delete') : emit('request-delete')"
              class="h-6 w-6 rounded-md flex items-center justify-center transition-all duration-150"
              :class="pendingDelete === item.id
                ? 'text-white bg-red-500 hover:bg-red-600 scale-110'
                : 'text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800'"
              :title="pendingDelete === item.id ? '한 번 더 클릭하면 삭제됩니다' : '삭제'"
            ><Trash2 :size="12" /></button>
          </div>
        </div>

        <div class="mt-1.5 flex items-center gap-2 flex-wrap">
          <span v-if="item.time" class="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <Clock :size="10" /> {{ item.time }}
          </span>
          <span v-if="item.addr || item.address"
                class="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[110px]">
            <MapPin :size="10" /> {{ item.addr || item.address }}
          </span>
          <span v-if="item.cost" class="text-[11px] font-semibold text-primary ml-auto">
            {{ won(item.cost) }}
          </span>
        </div>

        <p v-if="item.memo && !editOpen"
           class="mt-1 text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 leading-relaxed">
          {{ item.memo }}
        </p>
      </div>
    </div>

    <!-- ── Inline edit panel (grid expand) ──────────────────── -->
    <div class="edit-wrap" :class="editOpen ? 'edit-open' : ''">
      <div>
        <div class="px-3 pb-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2.5"
             @click.stop>
          <!-- Time + Cost row -->
          <div class="grid grid-cols-2 gap-2">
            <label class="flex flex-col gap-1">
              <span class="text-[10px] font-medium text-slate-400 uppercase tracking-wide">시간</span>
              <input
                v-model="draft.time"
                type="time"
                class="h-8 w-full rounded-lg bg-slate-50 dark:bg-slate-800 px-2.5 text-[12px]
                       text-slate-900 dark:text-slate-100 outline-none
                       focus:ring-2 focus:ring-primary/30 transition-all"
                @keydown.enter.prevent="saveEdit"
                @keydown.escape.prevent="cancelEdit"
              />
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-[10px] font-medium text-slate-400 uppercase tracking-wide">비용 (원)</span>
              <input
                v-model.number="draft.cost"
                type="number"
                min="0"
                placeholder="0"
                class="h-8 w-full rounded-lg bg-slate-50 dark:bg-slate-800 px-2.5 text-[12px]
                       text-slate-900 dark:text-slate-100 outline-none
                       focus:ring-2 focus:ring-primary/30 transition-all"
                @keydown.enter.prevent="saveEdit"
                @keydown.escape.prevent="cancelEdit"
              />
            </label>
          </div>

          <!-- Memo -->
          <label class="flex flex-col gap-1">
            <span class="text-[10px] font-medium text-slate-400 uppercase tracking-wide">메모</span>
            <textarea
              v-model="draft.memo"
              rows="2"
              placeholder="추천 메뉴, 예약 정보 등"
              class="w-full rounded-lg bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-[12px]
                     text-slate-900 dark:text-slate-100 resize-none outline-none
                     focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-slate-400"
              @keydown.escape.prevent="cancelEdit"
            />
          </label>

          <!-- Save / Cancel -->
          <div class="flex justify-end gap-1.5">
            <button
              @click="cancelEdit"
              class="h-7 px-3 rounded-lg text-[11px] font-medium text-slate-500
                     hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >취소</button>
            <button
              @click="saveEdit"
              class="h-7 px-3 rounded-lg text-[11px] font-semibold
                     bg-primary text-white hover:bg-primary/90 transition-colors
                     inline-flex items-center gap-1"
            >
              <Check :size="11" /> 저장
            </button>
          </div>
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

.edit-wrap {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 240ms cubic-bezier(0.4, 0, 0.2, 1);
}
.edit-wrap > div {
  min-height: 0;
  overflow: hidden;
}
.edit-open {
  grid-template-rows: 1fr;
}
</style>
