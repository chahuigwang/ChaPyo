<script setup>
import { ref, reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Trash2, GripVertical, Plus, X, Check, MapPin } from 'lucide-vue-next'
import { useStorageStore } from '@/stores/storageStore'
import { useTripStore } from '@/stores/tripStore'
import { useChatStore } from '@/stores/chatStore'
import { findCategory, CATEGORIES } from '@/types/itinerary'
import knightImg from '@/assets/knight.png'

const storage = useStorageStore()
const trip = useTripStore()
const chat = useChatStore()
const { items } = storeToRefs(storage)

const dropActive = ref(false)
const activeFilter = ref('all')

const FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'place', label: '관광지' },
  { id: 'food', label: '음식점' },
  { id: 'lodging', label: '숙소' },
  { id: 'transport', label: '기타' },
]

const filteredItems = computed(() =>
  activeFilter.value === 'all'
    ? items.value
    : items.value.filter((i) => i.category === activeFilter.value)
)

const formOpen = ref(false)
const form = reactive({ name: '', category: 'place', memo: '', cost: 0 })
function resetForm() {
  form.name = ''
  form.category = 'place'
  form.memo = ''
  form.cost = 0
}
function openForm() { resetForm(); formOpen.value = true }
function closeForm() { formOpen.value = false }
function submitForm() {
  const name = form.name.trim()
  if (!name) return
  storage.addItem({ name, category: form.category, memo: form.memo.trim(), cost: Number(form.cost) || 0 })
  closeForm()
}

function onDragStart(e, item) {
  storage.setDragging({ source: 'storage', item })
  try { e.dataTransfer.setData('text/plain', item.id); e.dataTransfer.effectAllowed = 'copy' } catch {}
}
function onDragEnd() { storage.clearDragging() }

function onPanelDragOver(e) {
  const p = storage.dragging
  if (p?.source !== 'timeline' && p?.source !== 'chat') return
  e.preventDefault()
  e.dataTransfer.dropEffect = p.source === 'timeline' ? 'move' : 'copy'
  dropActive.value = true
}
function onPanelDragLeave(e) {
  if (e.currentTarget.contains(e.relatedTarget)) return
  dropActive.value = false
}
function onPanelDrop(e) {
  const p = storage.dragging
  dropActive.value = false
  if (!p?.item) { storage.clearDragging(); return }
  if (p.source === 'timeline' && p.fromDate) {
    e.preventDefault()
    trip.removeItemFromDate(p.fromDate, p.item.id)
    storage.addItem(p.item)
    chat.pushSystemNotice(`"${p.item.name}"을(를) 보관함으로 옮겼어요.`)
  } else if (p.source === 'chat') {
    e.preventDefault()
    storage.addItem(p.item)
    chat.pushSystemNotice(`"${p.item.name}"을(를) 보관함에 담았어요.`)
  } else {
    storage.clearDragging()
    return
  }
  storage.clearDragging()
}
</script>

<template>
  <div
    class="flex-1 flex flex-col min-h-0 transition-colors"
    :class="dropActive ? 'bg-primary/5' : ''"
    @dragover="onPanelDragOver"
    @dragleave="onPanelDragLeave"
    @drop="onPanelDrop"
  >
    <header class="px-5 pt-5 pb-3">
      <div class="flex items-center gap-2 mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-slate-100">보관함</h2>
        <span class="text-[11px] text-slate-400 dark:text-slate-500">{{ items.length }}개</span>
        <button
          @click="openForm"
          class="ml-auto inline-flex items-center gap-1 px-2.5 h-7 rounded-md bg-primary text-primary-foreground text-[11px] font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus :size="12" /> 추가
        </button>
      </div>

      <!-- Category filter pills -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <button
          v-for="f in FILTERS"
          :key="f.id"
          @click="activeFilter = f.id"
          class="px-3 h-6 rounded-full text-[11px] font-medium transition-all duration-200"
          :class="activeFilter === f.id
            ? 'bg-primary text-white shadow-sm'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'"
        >
          {{ f.label }}
        </button>
      </div>

      <p class="mt-3 text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
        아이템을 드래그해서 오른쪽 워크스페이스의 날짜에 떨어뜨려 보세요.
      </p>

      <!-- Manual add form -->
      <div v-if="formOpen" class="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold text-slate-600 dark:text-slate-300">새 아이템</span>
          <button @click="closeForm" class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X :size="12" />
          </button>
        </div>
        <input
          v-model="form.name"
          @keydown.enter.prevent="submitForm"
          placeholder="이름 (예: 남산타워)"
          class="w-full h-8 px-2.5 text-[12px] rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div class="flex gap-2">
          <select
            v-model="form.category"
            class="h-8 px-2 text-[11px] rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
          >
            <option v-for="c in CATEGORIES" :key="c.id" :value="c.id">
              {{ c.emoji }} {{ c.label }}
            </option>
          </select>
          <input
            v-model.number="form.cost"
            type="number"
            min="0"
            placeholder="비용(원)"
            class="flex-1 h-8 px-2.5 text-[11px] rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <input
          v-model="form.memo"
          placeholder="메모 (선택)"
          class="w-full h-8 px-2.5 text-[11px] rounded-md bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div class="flex justify-end">
          <button
            @click="submitForm"
            :disabled="!form.name.trim()"
            class="inline-flex items-center gap-1 px-3 h-7 rounded-md bg-primary text-primary-foreground text-[11px] font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Check :size="11" /> 추가
          </button>
        </div>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
      <!-- Card matching SearchResultItem style -->
      <div
        v-for="item in filteredItems"
        :key="item.id"
        draggable="true"
        @dragstart="onDragStart($event, item)"
        @dragend="onDragEnd"
        class="group flex flex-col w-full rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-grab active:cursor-grabbing"
      >
        <!-- Image area -->
        <div class="relative w-full h-28 shrink-0 bg-slate-100 dark:bg-slate-700">
          <img
            v-if="item.firstImage"
            :src="item.firstImage"
            :alt="item.name"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <img :src="knightImg" alt="기본 이미지" class="w-full h-full object-cover object-[center_25%] opacity-40" />
          </div>

          <!-- Drag handle -->
          <div class="absolute top-2 left-2 p-1 rounded-md bg-black/20 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical :size="13" />
          </div>

          <!-- Category badge -->
          <span class="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm text-white text-[10px] font-medium">
            {{ findCategory(item.category)?.emoji }} {{ findCategory(item.category)?.label }}
          </span>

          <!-- Delete -->
          <button
            @click.stop="storage.removeItem(item.id)"
            class="absolute top-2 right-2 p-1.5 rounded-full bg-black/20 hover:bg-red-500/80 text-white backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
            title="제거"
          >
            <Trash2 :size="13" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-3 flex flex-col gap-1.5">
          <h3 class="text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate leading-snug">
            {{ item.name }}
          </h3>
          <p v-if="item.memo" class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {{ item.memo }}
          </p>
          <div v-if="item.address" class="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <MapPin :size="11" class="shrink-0" />
            <span class="truncate">{{ item.address }}</span>
          </div>
          <div v-if="item.cost" class="text-[11px] text-slate-400 dark:text-slate-500">
            {{ (Number(item.cost) || 0).toLocaleString('ko-KR') }}원
          </div>
        </div>
      </div>

      <div
        v-if="!filteredItems.length"
        class="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-10 text-center text-[12px] text-slate-500 dark:text-slate-400 shadow-inner"
      >
        {{ activeFilter === 'all' ? '보관함이 비었습니다.' : '해당 카테고리에 아이템이 없습니다.' }}
      </div>
    </div>
  </div>
</template>
