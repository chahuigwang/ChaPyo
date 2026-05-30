<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { Pencil, Trash2, Clock } from 'lucide-vue-next'
import PlaceCard from './PlaceCard.vue'
import DailySummary from './DailySummary.vue'
import TransitItem from './TransitItem.vue'
import { useTripStore } from '@/stores/tripStore'
import { useStorageStore } from '@/stores/storageStore'
import { useCollabStore } from '@/stores/collabStore'
import { useUiStore } from '@/stores/uiStore'
import { useTimelineLogic, snapTimeFor } from '@/composables/useTimelineLogic'
import { findCategory, formatDayLabel } from '@/types/itinerary'
import { dayColorFor } from '@/composables/useDayColor'
import PlaceFormModal from '@/components/modal/PlaceFormModal.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { Card, CardHeader, CardContent, Button } from '@/components/common'

const trip = useTripStore()
const storage = useStorageStore()
const collab = useCollabStore()
const ui = useUiStore()
const { itemsOfSelectedDay, selectedDate } = storeToRefs(trip)
const { hoveredItemId } = storeToRefs(ui)

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

// ── Drag & Drop ─────────────────────────────────────────────
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
  } else {
    const snapped = snapTimeFor(insertAt ?? itemsOfSelectedDay.value.length)
    trip.addItemToDate(selectedDate.value, snapped ? { ...p.item, time: snapped } : p.item)
    if (p.source === 'storage') storage.removeItem(p.item.id)
    else if (p.source === 'timeline') trip.removeItemFromDate(p.fromDate, p.item.id)
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


// ── CRUD ─────────────────────────────────────────────────────
const formOpen = ref(false)
const editing = ref(null)
const detail = ref(null)
const pendingDelete = ref(null)

function openEdit(item) { detail.value = null; editing.value = item; formOpen.value = true }
function closeForm() { formOpen.value = false; editing.value = null }
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
function requestDelete(item) { pendingDelete.value = item.id }
function cancelDelete() { pendingDelete.value = null }
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
        <div
          @dragover="onSlotDragOver($event, 0)"
          :class="['mx-4 rounded-full transition-all', dropIndex === 0 ? 'h-1.5 bg-primary/70 mb-1' : 'h-1']"
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
            @edit="openEdit(item)"
            @request-delete="requestDelete(item)"
            @confirm-delete="confirmDelete(item)"
            @cancel-delete="cancelDelete"
          />

          <div
            @dragover="onSlotDragOver($event, idx + 1)"
            class="relative flex flex-col items-center transition-all"
            :class="dropIndex === idx + 1 ? 'py-0.5' : ''"
          >
            <div v-if="dropIndex === idx + 1" class="w-full h-1.5 rounded-full bg-primary/70" />
            <TransitItem
              v-else-if="idx < itemsOfSelectedDay.length - 1"
              :item="item"
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

    <PlaceFormModal :open="formOpen" :initial="editing" @close="closeForm" @submit="submit" />

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
        <Button
          v-if="pendingDelete !== detail?.id"
          variant="ghost" size="sm"
          class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
          @click="requestDelete(detail)"
        >
          <Trash2 :size="13" /> 삭제
        </Button>
        <div v-else class="flex items-center gap-1">
          <Button size="sm" class="bg-red-500 hover:bg-red-600 text-white" @click="confirmDelete(detail)">정말 삭제</Button>
          <Button variant="ghost" size="sm" @click="cancelDelete">취소</Button>
        </div>
        <Button size="sm" @click="openEdit(detail)">
          <Pencil :size="13" /> 수정
        </Button>
      </template>
    </BaseModal>
  </Card>
</template>

