<script setup>
import { ref, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { Trash2, GripVertical, Plus, X, Check, ThumbsUp, ThumbsDown } from 'lucide-vue-next'
import { useStorageStore } from '@/stores/storageStore'
import { useTripStore } from '@/stores/tripStore'
import { useChatStore } from '@/stores/chatStore'
import { findCategory, CATEGORIES } from '@/types/itinerary'

const storage = useStorageStore()
const trip = useTripStore()
const chat = useChatStore()
const { items } = storeToRefs(storage)

const dropActive = ref(false)

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'

const formOpen = ref(false)
const form = reactive({ name: '', category: 'place', memo: '', cost: 0 })
function resetForm() {
  form.name = ''
  form.category = 'place'
  form.memo = ''
  form.cost = 0
}
function openForm() {
  resetForm()
  formOpen.value = true
}
function closeForm() {
  formOpen.value = false
}
function submitForm() {
  const name = form.name.trim()
  if (!name) return
  storage.addItem({
    name,
    category: form.category,
    memo: form.memo.trim(),
    cost: Number(form.cost) || 0,
  })
  closeForm()
}

function onDragStart(e, item) {
  storage.setDragging({ source: 'storage', item })
  try {
    e.dataTransfer.setData('text/plain', item.id)
    e.dataTransfer.effectAllowed = 'copy'
  } catch {}
}
function onDragEnd() {
  storage.clearDragging()
}

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
      <div class="flex items-center gap-2 mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-slate-100">
          보관함
        </h2>
        <span class="text-[11px] text-slate-400 dark:text-slate-500">{{ items.length }}개</span>
        <button
          @click="openForm"
          class="ml-auto inline-flex items-center gap-1 px-2.5 h-7 rounded-md bg-primary text-primary-foreground text-[11px] font-medium hover:bg-brand-600 transition-colors"
          title="직접 추가"
        >
          <Plus :size="12" /> 추가
        </button>
      </div>
      <p class="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
        아이템을 드래그해서 오른쪽 워크스페이스의 날짜에 떨어뜨려 보세요.
      </p>

      <!-- Manual add form -->
      <div
        v-if="formOpen"
        class="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 space-y-2"
      >
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

    <div class="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
      <div
        v-for="item in items"
        :key="item.id"
        draggable="true"
        @dragstart="onDragStart($event, item)"
        @dragend="onDragEnd"
        class="group rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5 flex items-center gap-2.5 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all"
      >
        <GripVertical :size="14" class="text-slate-300 dark:text-slate-600 shrink-0" />
        <span class="text-base shrink-0">{{ findCategory(item.category).emoji }}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="text-[12px] font-semibold text-slate-900 dark:text-slate-100 truncate">
              {{ item.name }}
            </span>
            <span class="text-[10px] text-slate-500 dark:text-slate-400">
              {{ findCategory(item.category).label }}
            </span>
          </div>
          <div class="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {{ item.memo || '메모 없음' }}
            <span v-if="item.cost"> · {{ won(item.cost) }}</span>
          </div>
          <!-- Voting -->
          <div class="mt-1.5 flex items-center gap-1.5" @click.stop>
            <button
              type="button"
              :title="item.myVote === 'up' ? '추천 취소' : '추천'"
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-all"
              :class="item.myVote === 'up'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'"
              @click="storage.vote(item.id, 'up')"
            >
              <ThumbsUp :size="11" /> {{ item.votes?.up ?? 0 }}
            </button>
            <button
              type="button"
              :title="item.myVote === 'down' ? '비추천 취소' : '비추천'"
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-all"
              :class="item.myVote === 'down'
                ? 'bg-red-500/15 text-red-500 dark:text-red-300'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'"
              @click="storage.vote(item.id, 'down')"
            >
              <ThumbsDown :size="11" /> {{ item.votes?.down ?? 0 }}
            </button>
          </div>
        </div>
        <button
          @click="storage.removeItem(item.id)"
          class="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-md text-slate-400 hover:text-red-500 flex items-center justify-center"
          title="제거"
        >
          <Trash2 :size="13" />
        </button>
      </div>

      <div
        v-if="!items.length"
        class="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-10 text-center text-[12px] text-slate-500 dark:text-slate-400 shadow-inner"
      >
        보관함이 비었습니다.
      </div>
    </div>
  </div>
</template>
