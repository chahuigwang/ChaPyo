<script setup>
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import PlaceCard from './PlaceCard.vue'
import TransitItem from './TransitItem.vue'
import { useTripStore } from '@/stores/tripStore'
import { useStorageStore } from '@/stores/storageStore'
import { useCollabStore } from '@/stores/collabStore'
import { useUiStore } from '@/stores/uiStore'
import { useTimelineLogic, snapTimeFor } from '@/composables/useTimelineLogic'
import { dayColorFor } from '@/composables/useDayColor'
import PlaceDetailModal from '@/components/common/PlaceDetailModal.vue'

// 전체 일정 아코디언 안에서 특정 날짜의 상세 타임라인을 인라인으로 렌더한다.
const props = defineProps({
  date: { type: String, required: true },
})

const trip = useTripStore()
const storage = useStorageStore()
const collab = useCollabStore()
const ui = useUiStore()
const { hoveredItemId } = storeToRefs(ui)

// 이 타임라인이 대상으로 하는 날짜의 아이템 목록
const dayItems = computed(() => trip.currentTrip?.itemsByDay?.[props.date] ?? [])

// 지도 핀과 동일한 Day 색상(예: Day2 = 초록) — 리스트 번호 배지에 사용
const dayColor = computed(() => dayColorFor((trip.days || []).indexOf(props.date)))

// 지도와 동일하게 번호를 날짜별로 1부터 새로 시작하지 않고 전역 연속으로 매긴다.
// (이전 날짜들의 아이템 수 합 = 이 날짜의 시작 오프셋)
const startNumber = computed(() => {
  const t = trip.currentTrip
  if (!t) return 0
  let n = 0
  for (const iso of (trip.days || [])) {
    if (iso === props.date) break
    n += t.itemsByDay?.[iso]?.length ?? 0
  }
  return n
})

// 드래그(추가/순서변경) 진행 중 여부 — 이동거리 숨김 + 드롭 영역 확대에 사용
const isDragging = computed(() => !!storage.dragging)

const { transits } = useTimelineLogic(dayItems)

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
  if (!dragPayload()) return
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
  if (!p?.item) { storage.clearDragging(); return }
  if (p.source === 'timeline' && p.fromDate === props.date) {
    if (insertAt != null) {
      trip.reorderInDate(props.date, p.fromIdx, insertAt)
      const newIdx = insertAt > p.fromIdx ? insertAt - 1 : insertAt
      const snapped = snapTimeFor(newIdx)
      if (snapped) trip.updateItem(p.item.id, { time: snapped })
    }
  } else if (p.source === 'timeline') {
    // 다른 날짜의 기존 일정 → 이 날짜로 이동 (PATCH visitDate)
    const snapped = snapTimeFor(insertAt ?? dayItems.value.length)
    trip.moveItemToDate(p.fromDate, props.date, p.item.id, snapped ? { time: snapped } : {})
    collab.pushHistory({ type: 'add', itemName: p.item.name, byName: collab.me.name })
  } else {
    const snapped = snapTimeFor(insertAt ?? dayItems.value.length)
    trip.addItemToDate(props.date, snapped ? { ...p.item, time: snapped } : p.item)
    collab.pushHistory({ type: 'add', itemName: p.item.name, byName: collab.me.name })
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
// 카드 전체를 드롭 타겟으로 — 커서가 카드 상단 절반이면 앞에, 하단이면 뒤에 삽입
function onCardDragOver(e, idx) {
  if (!dragPayload()) return
  e.preventDefault()
  e.dataTransfer.dropEffect = dragPayload()?.source === 'timeline' ? 'move' : 'copy'
  const rect = e.currentTarget.getBoundingClientRect()
  dropIndex.value = (e.clientY - rect.top) < rect.height / 2 ? idx : idx + 1
  dropActive.value = true
}
function onCardDragStart(e, item, idx) {
  storage.setDragging({ source: 'timeline', item, fromDate: props.date, fromIdx: idx })
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
  trip.removeItemFromDate(props.date, item.id)
  collab.pushHistory({ type: 'remove', itemName: item.name, byName: collab.me.name })
  pendingDelete.value = null
  if (detail.value?.id === item.id) detail.value = null
}
</script>

<template>
  <div
    class="rounded-lg transition-all"
    :class="dropActive ? 'ring-2 ring-dashed ring-primary bg-primary/5' : ''"
    @dragover="onTimelineDragOver"
    @dragleave="onTimelineDragLeave"
    @drop="onTimelineDrop"
  >
    <!-- 드래그 중에도 레이아웃 높이가 변하지 않도록 TransitItem을 항상 표시하고,
         삽입 위치는 높이 변화 없는 오버레이 선으로만 표시한다.
         (여러 날이 한 스크롤에 쌓인 상태에서 dragstart 시 전체가 수축하며
          커서 아래 카드가 바뀌어 드래그가 깨지던 문제 해결) -->
    <div v-if="dayItems.length" class="flex flex-col pb-1">
      <!-- 맨 앞 드롭 영역 (높이 고정) -->
      <div
        @dragover="onSlotDragOver($event, 0)"
        class="h-2 rounded transition-colors"
        :class="isDragging && dropIndex === 0 ? 'bg-primary/30' : ''"
      />
      <template v-for="(item, idx) in dayItems" :key="item.id">
        <PlaceCard
          :ref="el => { if (el?.$el) cardRefs[item.id] = el.$el; else if (el) cardRefs[item.id] = el }"
          :item="item"
          :index="idx"
          :number="startNumber + idx + 1"
          :color="dayColor.pin"
          :hovered="hoveredItemId === item.id"
          :pending-delete="pendingDelete"
          @click="detail = item"
          @mouseenter="ui.setHoveredItem(item.id)"
          @mouseleave="ui.clearHoveredItem(item.id)"
          @dragstart="onCardDragStart($event, item, idx)"
          @dragend="onCardDragEnd"
          @dragover="onCardDragOver($event, idx)"
          @save="onItemSave(item, $event)"
          @request-delete="requestDelete(item)"
          @confirm-delete="confirmDelete(item)"
        />

        <!-- 카드 사이/뒤 드롭 영역 (TransitItem 항상 유지 → 레이아웃 고정) -->
        <div
          @dragover="onSlotDragOver($event, idx + 1)"
          class="relative"
        >
          <!-- 삽입 위치 표시선 (오버레이 — 레이아웃에 영향 없음) -->
          <div
            v-show="isDragging && dropIndex === idx + 1"
            class="absolute left-2 right-2 top-1 h-1 rounded-full bg-primary z-10 pointer-events-none"
          />
          <TransitItem
            v-if="idx < dayItems.length - 1"
            :item="item"
            :next="dayItems[idx + 1]"
            :auto-km="transits[idx]?.km ?? null"
            :auto-mins="transits[idx]?.mins ?? null"
            @hover-transit="ui.setHoveredTransit(idx)"
            @leave-transit="ui.clearHoveredTransit()"
          />
          <!-- 마지막 카드 뒤 드롭 여백 (고정 높이) -->
          <div v-else class="h-3" />
        </div>
      </template>
    </div>

    <div v-else class="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-6 text-center text-[12px] text-slate-500 dark:text-slate-400">
      아직 일정이 없습니다. 검색·좋아요 또는 AI 추천에서 장소를 드래그해 추가해 보세요.
    </div>

    <!-- 상세보기 모달 (검색과 동일한 리치 모달 + 메모/비용 편집) -->
    <PlaceDetailModal
      :item="detail"
      :show-add="false"
      :editable="true"
      @close="detail = null"
      @save="onDetailSave"
    />
  </div>
</template>
