<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Plus, Clock, Pencil, Trash2, GripVertical, Car, Sparkles } from 'lucide-vue-next'
import { useTripStore } from '@/stores/tripStore'
import { useStorageStore } from '@/stores/storageStore'
import { useChatStore } from '@/stores/chatStore'
import { useCollabStore } from '@/stores/collabStore'
import { useUiStore } from '@/stores/uiStore'
import { findCategory, formatDayLabel } from '@/types/itinerary'
import { dayColorFor } from '@/composables/useDayColor'
import PlaceFormModal from '.@/components/modal/PlaceFormModal.vue'
import AutoComposeModal from './AutoComposeModal.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/common'

const trip = useTripStore()
const storage = useStorageStore()
const chat = useChatStore()
const collab = useCollabStore()
const ui = useUiStore()
const { itemsOfSelectedDay, selectedDate } = storeToRefs(trip)
const { hoveredItemId } = storeToRefs(ui)

// Logical time blocks for snap-to-time on drop.
const TIME_BLOCKS = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00']
function snapTimeFor(index) {
  if (index == null) return null
  const clamped = Math.max(0, Math.min(index, TIME_BLOCKS.length - 1))
  return TIME_BLOCKS[clamped]
}

// Mock transit between consecutive items. Uses haversine if both have coords; else fallback.
function haversineKm(a, b) {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null
  const toRad = (d) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(x))
}
const selectedDayIndex = computed(() => {
  const days = trip.days || []
  return days.indexOf(selectedDate.value)
})
const selectedDayColor = computed(() => dayColorFor(selectedDayIndex.value))
const selectedDayLabel = computed(() => {
  if (!selectedDate.value) return ''
  const idx = selectedDayIndex.value
  return idx >= 0 ? formatDayLabel(selectedDate.value, idx) : selectedDate.value
})

// Ghost slot detection: insert between items where time gap > 2 hours.
function timeToMinutes(t) {
  if (!t || typeof t !== 'string') return null
  const [h, m] = t.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}
function midGhostTime(a, b) {
  const ma = timeToMinutes(a)
  const mb = timeToMinutes(b)
  if (ma == null || mb == null) return null
  const mid = Math.round((ma + mb) / 2)
  const hh = String(Math.floor(mid / 60)).padStart(2, '0')
  const mm = String(mid % 60).padStart(2, '0')
  return `${hh}:${mm}`
}
const ghostSlots = computed(() => {
  const items = itemsOfSelectedDay.value
  return items.slice(0, -1).map((a, i) => {
    const b = items[i + 1]
    const ma = timeToMinutes(a.time)
    const mb = timeToMinutes(b.time)
    if (ma == null || mb == null) return null
    if (mb - ma > 120) {
      return { gapMins: mb - ma, suggestedTime: midGhostTime(a.time, b.time) }
    }
    return null
  })
})
function addGhost(idx, suggestedTime) {
  if (!selectedDate.value) return
  trip.addItemToDate(selectedDate.value, {
    name: '새 일정',
    category: 'place',
    time: suggestedTime ?? '',
  })
  // Move the newly appended item to the correct insertion slot (idx + 1).
  const list = trip.currentTrip?.itemsByDay?.[selectedDate.value]
  if (list && list.length) {
    const fromIdx = list.length - 1
    const toIdx = idx + 1
    if (fromIdx !== toIdx) trip.reorderInDate(selectedDate.value, fromIdx, toIdx)
  }
  collab.pushHistory({ type: 'add', itemName: '새 일정', byName: collab.me.name })
}

const transits = computed(() => {
  const items = itemsOfSelectedDay.value
  return items.slice(0, -1).map((a, i) => {
    const b = items[i + 1]
    const realKm = haversineKm(a, b)
    if (realKm != null) {
      const realMins = Math.max(3, Math.round((realKm / 30) * 60)) // assume 30km/h city avg
      return { km: realKm.toFixed(1), mins: realMins }
    }
    // Stable mock fallback derived from ids so it doesn't jitter on re-render.
    const seed = (a.id + b.id).split('').reduce((s, c) => s + c.charCodeAt(0), 0)
    const mockMins = 8 + (seed % 18)
    const mockKm = (0.6 + (seed % 47) / 10).toFixed(1)
    return { km: mockKm, mins: mockMins }
  })
})

// Demo seed: mark second item of the day as "being edited" so the soft lock is observable.
watch(itemsOfSelectedDay, (list) => {
  if (list && list.length >= 2) collab.seedDemoEditing(list[1].id)
}, { immediate: true })

const dropActive = ref(false)
const dropIndex = ref(null) // insertion index for reorder

function dragPayload() { return storage.dragging }
function isStorageSource() { return dragPayload()?.source === 'storage' }
function isTimelineSource() { return dragPayload()?.source === 'timeline' }

function onTimelineDragOver(e) {
  if (!selectedDate.value) return
  const p = dragPayload()
  if (!p) return
  e.preventDefault()
  e.dataTransfer.dropEffect = isTimelineSource() ? 'move' : 'copy'
  dropActive.value = true
}
function onTimelineDragLeave(e) {
  if (e.currentTarget.contains(e.relatedTarget)) return
  dropActive.value = false
  dropIndex.value = null
}
function onTimelineDrop(e) {
  e.preventDefault()
  const p = dragPayload()
  dropActive.value = false
  const insertAt = dropIndex.value
  dropIndex.value = null
  if (!p?.item || !selectedDate.value) { storage.clearDragging(); return }

  if (p.source === 'timeline' && p.fromDate === selectedDate.value) {
    if (insertAt != null) {
      trip.reorderInDate(selectedDate.value, p.fromIdx, insertAt)
      const newIdx = insertAt > p.fromIdx ? insertAt - 1 : insertAt
      const snapped = snapTimeFor(newIdx)
      if (snapped) trip.updateItem(p.item.id, { time: snapped })
    }
  } else {
    const idx = trip.days.indexOf(selectedDate.value)
    const label = idx >= 0 ? formatDayLabel(selectedDate.value, idx) : selectedDate.value
    const snapped = snapTimeFor(insertAt ?? itemsOfSelectedDay.value.length)
    const enriched = snapped ? { ...p.item, time: snapped } : p.item
    trip.addItemToDate(selectedDate.value, enriched)
    if (p.source === 'storage') storage.removeItem(p.item.id)
    else if (p.source === 'timeline') trip.removeItemFromDate(p.fromDate, p.item.id)
    chat.pushSystemNotice(`"${p.item.name}"을(를) ${label}${snapped ? ` ${snapped}` : ''}에 추가했어요.`)
  }
  storage.clearDragging()
}

function onSlotDragOver(e, i) {
  const p = dragPayload()
  if (!p) return
  e.preventDefault()
  e.stopPropagation()
  e.dataTransfer.dropEffect = isTimelineSource() ? 'move' : 'copy'
  dropIndex.value = i
  dropActive.value = true
}

function onCardDragStart(e, item, idx) {
  storage.setDragging({ source: 'timeline', item, fromDate: selectedDate.value, fromIdx: idx })
  try {
    e.dataTransfer.setData('text/plain', item.id)
    e.dataTransfer.effectAllowed = 'move'
  } catch {}
}
function onCardDragEnd() {
  storage.clearDragging()
  dropActive.value = false
  dropIndex.value = null
}

const formOpen = ref(false)
const editing = ref(null)
const detail = ref(null)
const autoComposeOpen = ref(false)

function openAutoCompose() {
  if (!selectedDate.value) return
  autoComposeOpen.value = true
}
function acceptAutoCompose(plan) {
  if (!selectedDate.value || !plan?.length) {
    autoComposeOpen.value = false
    return
  }
  plan.forEach((it) => {
    trip.addItemToDate(selectedDate.value, { ...it, time: it.time })
    storage.removeItem(it.id)
    collab.pushHistory({ type: 'add', itemName: it.name, byName: collab.me.name })
  })
  chat.pushSystemNotice(`AI가 ${plan.length}개의 일정을 자동으로 구성했어요.`)
  autoComposeOpen.value = false
}

function openAdd() {
  editing.value = null
  formOpen.value = true
}
function openEdit(item) {
  detail.value = null
  editing.value = item
  formOpen.value = true
}
function closeForm() {
  formOpen.value = false
  editing.value = null
}
function submit(payload) {
  if (editing.value) {
    trip.updateItem(editing.value.id, payload)
    collab.pushHistory({ type: 'edit', itemName: payload?.name || editing.value.name, byName: collab.me.name })
  } else {
    trip.addItem(payload)
    collab.pushHistory({ type: 'add', itemName: payload?.name || '새 일정', byName: collab.me.name })
  }
  closeForm()
}
function remove(item) {
  if (confirm(`"${item.name}"을(를) 삭제할까요?`)) {
    trip.removeItem(item.id)
    collab.pushHistory({ type: 'remove', itemName: item.name, byName: collab.me.name })
    detail.value = null
  }
}
const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'
</script>

<template>
  <Card class="flex flex-col min-h-0">
    <CardHeader>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3 min-w-0">
          <span
            v-if="selectedDate"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
            :style="{ backgroundColor: selectedDayColor.bg, color: selectedDayColor.fg }"
          >
            <span class="h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: selectedDayColor.pin }"></span>
            {{ selectedDayLabel }}
          </span>
          <div class="min-w-0">
            <CardTitle>{{ selectedDate || '날짜를 선택하세요' }}</CardTitle>
            <p class="mt-1 text-[12px] text-slate-500 dark:text-slate-400">{{ itemsOfSelectedDay.length }}건의 일정</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            :disabled="!selectedDate"
            class="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-medium
                   text-[#00B7EB] bg-[#00B7EB]/10 hover:bg-[#00B7EB] hover:text-white
                   hover:-translate-y-0.5 hover:shadow-md transition-all duration-300
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            title="보관함에서 자동 구성"
            @click="openAutoCompose"
          >
            <Sparkles :size="13" /> 보관함에서 자동 구성
          </button>
          <Button size="sm" :disabled="!selectedDate" @click="openAdd">
            <Plus :size="13" /> 일정 추가
          </Button>
        </div>
      </div>
    </CardHeader>

    <CardContent
      class="flex-1 overflow-x-auto overflow-y-hidden pt-2 rounded-lg transition-all"
      :class="dropActive ? 'ring-2 ring-dashed ring-primary bg-primary/5' : ''"
      @dragover="onTimelineDragOver"
      @dragleave="onTimelineDragLeave"
      @drop="onTimelineDrop"
    >
      <div v-if="itemsOfSelectedDay.length" class="flex items-stretch gap-2 min-w-max pb-2">
        <!-- leading slot -->
        <div
          @dragover="onSlotDragOver($event, 0)"
          :class="[
            'self-stretch w-2 rounded-full transition-colors',
            dropIndex === 0 ? 'bg-primary/70 w-1.5' : '',
          ]"
        />
        <template v-for="(item, idx) in itemsOfSelectedDay" :key="item.id">
          <div
            draggable="true"
            @dragstart="onCardDragStart($event, item, idx)"
            @dragend="onCardDragEnd"
            @click="detail = item"
            @mouseenter="ui.setHoveredItem(item.id)"
            @mouseleave="ui.clearHoveredItem(item.id)"
            class="place-card group relative w-56 shrink-0 text-left rounded-xl bg-slate-50 dark:bg-slate-800/60 p-5
                   shadow-sm hover:shadow-md transition-all flex flex-col cursor-grab active:cursor-grabbing"
            :class="[
              collab.isEditing(item.id) ? 'place-card--locked' : '',
              hoveredItemId === item.id ? 'place-card--hovered' : '',
            ]"
          >
            <!-- Sequence badge -->
            <span
              class="absolute -top-2 -left-2 z-10 inline-flex items-center justify-center
                     h-6 w-6 rounded-full bg-[#00B7EB] text-white text-[11px] font-bold shadow-sm
                     ring-2 ring-white dark:ring-slate-900"
            >{{ idx + 1 }}</span>
            <!-- Soft Lock: faint primary border + tiny editor avatar -->
            <div
              v-if="collab.editorOf(item.id)"
              class="absolute -top-1.5 -right-1.5 z-10 flex items-center gap-1
                     px-1.5 py-0.5 rounded-full bg-white dark:bg-slate-900 shadow-sm
                     text-[9px] font-medium text-slate-600 dark:text-slate-300"
              :title="`${collab.editorOf(item.id).name} 님이 편집 중`"
            >
              <span
                class="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-semibold text-white"
                :style="{ backgroundColor: collab.editorOf(item.id).color }"
              >{{ collab.editorOf(item.id).name.charAt(0) }}</span>
              <span class="pr-1">Editing…</span>
            </div>
            <GripVertical
              :size="13"
              class="absolute top-3 left-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
            />
            <div class="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                @click.stop="openEdit(item)"
                class="h-7 w-7 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-900"
                title="수정"
              >
                <Pencil :size="13" />
              </button>
              <button
                @click.stop="remove(item)"
                class="h-7 w-7 rounded-md flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-white dark:hover:bg-slate-900"
                title="삭제"
              >
                <Trash2 :size="13" />
              </button>
            </div>
            <div class="flex items-center justify-between">
              <div class="inline-flex items-center justify-center h-9 w-9 rounded-md bg-white dark:bg-slate-900 text-base shadow-sm">
                {{ findCategory(item.category).emoji }}
              </div>
              <span class="text-[11px] text-slate-500 dark:text-slate-400">{{ findCategory(item.category).label }}</span>
            </div>
            <h4 class="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{{ item.name }}</h4>
            <div v-if="item.time" class="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <Clock :size="11" /> {{ item.time }}
            </div>
            <p v-if="item.memo" class="mt-2 text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{{ item.memo }}</p>
            <div v-if="item.cost" class="mt-auto pt-4 text-[12px] font-medium text-slate-900 dark:text-slate-100">
              {{ won(item.cost) }}
            </div>
            <!-- Last edited by (mock, deterministic per item id) -->
            <span
              v-if="collab.lastEditorOf(item.id)"
              class="absolute bottom-2 right-2 inline-flex items-center justify-center
                     h-5 w-5 rounded-full text-[9px] font-semibold text-white shadow-sm
                     ring-2 ring-slate-50 dark:ring-slate-800/60"
              :style="{ backgroundColor: collab.lastEditorOf(item.id).color }"
              :title="`${collab.lastEditorOf(item.id).name} 님이 마지막으로 수정`"
            >{{ collab.lastEditorOf(item.id).name.charAt(0) }}</span>
          </div>

          <!-- between/trailing slot -->
          <div
            @dragover="onSlotDragOver($event, idx + 1)"
            :class="[
              'self-stretch rounded-full transition-all flex items-center justify-center',
              dropIndex === idx + 1
                ? 'bg-primary/70 w-1.5'
                : (idx < itemsOfSelectedDay.length - 1 ? 'w-auto px-1' : 'w-2'),
            ]"
          >
            <!-- Ghost slot (gap > 2h) -->
            <button
              v-if="idx < itemsOfSelectedDay.length - 1 && dropIndex !== idx + 1 && ghostSlots[idx]"
              type="button"
              class="ghost-slot group/ghost w-40 self-stretch rounded-xl px-3 py-2
                     flex flex-col items-center justify-center gap-1
                     text-[11px] font-medium text-[#00B7EB]
                     transition-all duration-300 hover:bg-[#00B7EB]/5"
              :title="`${ghostSlots[idx].gapMins}분의 여유 — 일정을 추가하세요`"
              @click.stop="addGhost(idx, ghostSlots[idx].suggestedTime)"
            >
              <span class="inline-flex items-center gap-1">
                <Plus :size="13" /> 일정 추가
              </span>
              <span class="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                {{ ghostSlots[idx].suggestedTime }} · {{ Math.round(ghostSlots[idx].gapMins / 60) }}h 여유
              </span>
            </button>
            <!-- Transit chip (no ghost slot here) -->
            <span
              v-else-if="idx < itemsOfSelectedDay.length - 1 && dropIndex !== idx + 1 && transits[idx]"
              class="inline-flex items-center gap-1 px-2 py-1 rounded-full
                     bg-white dark:bg-slate-900 text-[10px] font-medium
                     text-slate-500 dark:text-slate-400 shadow-sm whitespace-nowrap"
              :title="`예상 이동 시간`"
            >
              <Car :size="11" class="text-[#00B7EB]" />
              {{ transits[idx].mins }}분 · {{ transits[idx].km }}km
            </span>
          </div>
        </template>
      </div>

      <div
        v-else
        class="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-12 text-center text-sm text-slate-500 dark:text-slate-400 shadow-inner"
      >
        아직 일정이 없습니다. AI에게 추천을 요청하거나 직접 추가해 보세요.
      </div>
    </CardContent>

    <PlaceFormModal :open="formOpen" :initial="editing" @close="closeForm" @submit="submit" />
    <AutoComposeModal
      :open="autoComposeOpen"
      :date="selectedDate"
      @close="autoComposeOpen = false"
      @accept="acceptAutoCompose"
    />

    <BaseModal :open="!!detail" :title="detail?.name ?? ''" @close="detail = null">
      <div v-if="detail" class="space-y-4 text-sm">
        <div class="flex items-center gap-3 text-[12px] text-slate-500 dark:text-slate-400">
          <span>{{ findCategory(detail.category).emoji }} {{ findCategory(detail.category).label }}</span>
          <span v-if="detail.time" class="inline-flex items-center gap-1">
            <Clock :size="11" /> {{ detail.time }}
          </span>
        </div>
        <div v-if="detail.cost">
          <div class="text-[11px] text-slate-500 dark:text-slate-400">예상 비용</div>
          <div class="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{{ won(detail.cost) }}</div>
        </div>
        <div v-if="detail.memo">
          <div class="text-[11px] text-slate-500 dark:text-slate-400">메모</div>
          <p class="mt-1.5 whitespace-pre-wrap text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed">{{ detail.memo }}</p>
        </div>
        <div v-else class="text-[12px] text-slate-400 dark:text-slate-500">추가 메모가 없습니다.</div>
      </div>
      <template #footer>
        <Button variant="ghost" size="sm" class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30" @click="remove(detail)">
          <Trash2 :size="13" /> 삭제
        </Button>
        <Button size="sm" @click="openEdit(detail)">
          <Pencil :size="13" /> 수정
        </Button>
      </template>
    </BaseModal>
  </Card>
</template>

<style scoped>
.place-card--locked {
  box-shadow:
    0 0 0 1px rgba(0, 183, 235, 0.45),
    0 4px 14px -6px rgba(0, 183, 235, 0.35);
}
.place-card--hovered {
  transform: translateY(-2px);
  box-shadow:
    0 0 0 1px rgba(0, 183, 235, 0.55),
    0 8px 22px -6px rgba(0, 183, 235, 0.45);
}
.ghost-slot {
  border: 1.5px dashed rgba(0, 183, 235, 0.45);
  background: transparent;
}
.ghost-slot:hover {
  border-color: #00B7EB;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px -8px rgba(0, 183, 235, 0.45);
}
</style>
