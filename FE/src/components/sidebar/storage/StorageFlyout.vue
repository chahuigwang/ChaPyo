<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useStorageStore } from '@/stores/storageStore'
import { useTripStore } from '@/stores/tripStore'
import { useChatStore } from '@/stores/chatStore'
import DiscoverPlaceCard from '@/components/common/DiscoverPlaceCard.vue'

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
    storage.like(p.item)
  } else if (p.source === 'chat') {
    e.preventDefault()
    storage.like(p.item)
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
        <h2 class="text-xl font-bold text-gray-900 dark:text-slate-100">좋아요 리스트</h2>
        <span class="ml-auto text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">
          {{ items.length }}<span class="text-[13px] font-semibold text-slate-400 ml-0.5">개</span>
        </span>
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
        하트를 눌러 장소를 저장하거나, 드래그해서 일정에 추가하세요.
      </p>
    </header>

    <div class="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
      <DiscoverPlaceCard
        v-for="item in filteredItems"
        :key="item.id"
        :item="item"
        :draggable="true"
        @dragstart="onDragStart($event, item)"
        @dragend="onDragEnd"
      />

      <div
        v-if="!filteredItems.length"
        class="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-10 text-center text-[12px] text-slate-500 dark:text-slate-400 shadow-inner"
      >
        {{ activeFilter === 'all' ? '좋아요 리스트가 비었습니다.' : '해당 카테고리에 아이템이 없습니다.' }}
      </div>
    </div>
  </div>
</template>
