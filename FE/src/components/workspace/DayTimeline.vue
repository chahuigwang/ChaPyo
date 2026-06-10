<script setup>
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { Trash2 } from 'lucide-vue-next'
import PlaceCard from './PlaceCard.vue'
import DailySummary from './DailySummary.vue'
import TransitItem from './TransitItem.vue'
import { useTripStore } from '@/stores/tripStore'
import { useStorageStore } from '@/stores/storageStore'
import { useCollabStore } from '@/stores/collabStore'
import { useUiStore } from '@/stores/uiStore'
import { useTimelineLogic, snapTimeFor } from '@/composables/useTimelineLogic'
import { formatDayLabel } from '@/types/itinerary'
import { dayColorFor } from '@/composables/useDayColor'
import PlaceDetailModal from '@/components/common/PlaceDetailModal.vue'
import { Card, CardHeader, CardContent } from '@/components/common'

const trip = useTripStore()
const storage = useStorageStore()
const collab = useCollabStore()
const ui = useUiStore()
const { itemsOfSelectedDay, selectedDate } = storeToRefs(trip)
const { hoveredItemId } = storeToRefs(ui)

// 드래그(추가/순서변경) 진행 중 여부 — 이동거리 숨김 + 드롭 영역 확대에 사용
const isDragging = computed(() => !!storage.dragging)

const selectedDayIndex = computed(() => (trip.days || []).indexOf(selectedDate.value))
const selectedDayColor = computed(() => dayColorFor(selectedDayIndex.value))
const selectedDayLabel = computed(() => {
  if (!selectedDate.value) return ''
  const idx = selectedDayIndex.value
  return idx >= 0 ? formatDayLabel(selectedDate.value, idx) : selectedDate.value
})

const { transits, dailyCost } = useTimelineLogic(itemsOfSelectedDay)

watch(itemsOfSelectedDay, (list) => {
  if (list && list.length >= 2) collab.seedDemoEditing(list[1].id)
}, { immediate: true })

// Map → Timeline: scroll hovered card into view
const cardRefs = ref({})
watch(hoveredItemId, (id) => {
  if (!id) return
  nextTick(() => {
    const el = cardRefs.value[id]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
})

// ── Drag & Drop ──────────────────────────────────────────────
const dropActive = ref(false)
const dropIndex = ref(null)

function dragPayload() { return storage.dragging }

function onTimelineDragOver(e) {
  if (!selectedDate.value || !dragPayload()) return
  e.preventDefault()
  e.dataTransfer.dropEffect = dragPayload()?.source === 'timeline' ? 'move' : 'copy'
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
  } else if (p.source === 'timeline') {
    // 다른 날짜의 기존 일정 → 현재 날짜로 이동 (PATCH visitDate)
    const snapped = snapTimeFor(insertAt ?? itemsOfSelectedDay.value.length)
    trip.moveItemToDate(p.fromDate, selectedDate.value, p.item.id, snapped ? { time: snapped } : {})
  } else {
    const snapped = snapTimeFor(insertAt ?? itemsOfSelectedDay.value.length)
    trip.addItemToDate(selectedDate.value, snapped ? { ...p.item, time: snapped } : p.item)
    // 보관함(좋아요)에서 일정으로 가져와도 좋아요는 유지(복사)
  }
  storage.clearDragging()
}
function onSlotDragOver(e, i) {
  if (!dragPayload()) return
  e.preventDefault(); e.stopPropagation()
  e.dataTransfer.dropEffect = dragPayload()?.source === 'timeline' ? 'move' : 'copy'
  dropIndex.value = i
  dropActive.value = true
}
function onCardDragStart(e, item, idx) {
  storage.setDragging({ source: 'timeline', item, fromDate: selectedDate.value, fromIdx: idx })
  try { e.dataTransfer.setData('text/plain', item.id); e.dataTransfer.effectAllowed = 'move' } catch {}
}
function onCardDragEnd() {
  storage.clearDragging(); dropActive.value = false; dropIndex.value = null
}

// ── CRUD ────────────────────────────────────────────────────
const detail = ref(null)
const pendingDelete = ref(null)

function onItemSave(item, patch) {
  trip.updateItem(item.id, patch)
  collab.pushHistory({ type: 'edit', itemName: item.name, byName: collab.me.name })
}
function onDetailSave(patch) {
  if (detail.value) trip.updateItem(detail.value.id, patch)
}
function onDocClick() { if (pendingDelete.value) pendingDelete.value = null }
watch(pendingDelete, (id) => {
  if (id) document.addEventListener('click', onDocClick)
  else document.removeEventListener('click', onDocClick)
})
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

function requestDelete(item) { pendingDelete.value = item.id }
function confirmDelete(item) {
  trip.removeItem(item.id)
  collab.pushHistory({ type: 'remove', itemName: item.name, byName: collab.me.name })
  pendingDelete.value = null
  if (detail.value?.id === item.id) detail.value = null
}

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'
</script>

<template>
  <Card class="flex flex-col min-h-0">
    <CardHeader>
      <DailySummary
        :date="selectedDate"
        :day-label="selectedDayLabel"
        :day-color="selectedDayColor"
        :item-count="itemsOfSelectedDay.length"
        :daily-cost="dailyCost"
      />
    </CardHeader>

    <CardContent
      class="flex-1 overflow-y-auto overflow-x-hidden pt-2 rounded-lg transition-all"
      :class="dropActive ? 'ring-2 ring-dashed ring-primary bg-primary/5' : ''"
      @dragover="onTimelineDragOver"
      @dragleave="onTimelineDragLeave"
      @drop="onTimelineDrop"
    >
      <div v-if="itemsOfSelectedDay.length" class="flex flex-col pb-4">
        <!-- 맨 앞 드롭 영역 -->
        <div
          @dragover="onSlotDragOver($event, 0)"
          class="mx-4 rounded-lg transition-all"
          :class="isDragging
            ? (dropIndex === 0 ? 'h-9 bg-primary/15 ring-2 ring-dashed ring-primary/50 mb-1' : 'h-6')
            : 'h-1'"
        />
        <template v-for="(item, idx) in itemsOfSelectedDay" :key="item.id">
          <PlaceCard
            :ref="el => { if (el?.$el) cardRefs[item.id] = el.$el; else if (el) cardRefs[item.id] = el }"
            :item="item"
            :index="idx"
            :hovered="hoveredItemId === item.id"
            :pending-delete="pendingDelete"
            @click="detail = item"
            @mouseenter="ui.setHoveredItem(item.id)"
            @mouseleave="ui.clearHoveredItem(item.id)"
            @dragstart="onCardDragStart($event, item, idx)"
            @dragend="onCardDragEnd"
            @save="onItemSave(item, $event)"
            @request-delete="requestDelete(item)"
            @confirm-delete="confirmDelete(item)"
          />

          <div
            @dragover="onSlotDragOver($event, idx + 1)"
            class="relative flex flex-col items-center transition-all"
          >
            <!-- 드래그 중: 이동거리 숨기고 잡기 쉬운 드롭 영역 표시 (맨 뒤 영역 포함) -->
            <div
              v-if="isDragging"
              class="w-full mx-4 rounded-lg transition-all"
              :class="dropIndex === idx + 1 ? 'h-9 bg-primary/15 ring-2 ring-dashed ring-primary/50' : 'h-6'"
            />
            <TransitItem
              v-else-if="idx < itemsOfSelectedDay.length - 1"
              :item="item"
              :next="itemsOfSelectedDay[idx + 1]"
              :auto-km="transits[idx]?.km ?? null"
              :auto-mins="transits[idx]?.mins ?? null"
              @hover-transit="ui.setHoveredTransit(idx)"
              @leave-transit="ui.clearHoveredTransit()"
            />
          </div>
        </template>
      </div>

      <div v-else class="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-12 text-center text-sm text-slate-500 dark:text-slate-400 shadow-inner">
        아직 일정이 없습니다. AI에게 추천을 요청하거나 직접 추가해 보세요.
      </div>
    </CardContent>

    <!-- 상세보기 모달 (검색과 동일한 리치 모달 + 메모/비용 편집) -->
    <PlaceDetailModal
      :item="detail"
      :show-add="false"
      :editable="true"
      @close="detail = null"
      @save="onDetailSave"
    />
  </Card>
</template>
