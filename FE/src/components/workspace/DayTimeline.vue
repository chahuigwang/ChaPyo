<script setup>
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import draggable from 'vuedraggable'
import PlaceCard from './PlaceCard.vue'
import TransitItem from './TransitItem.vue'
import { useTripStore } from '@/stores/tripStore'
import { useCollabStore } from '@/stores/collabStore'
import { useUiStore } from '@/stores/uiStore'
import { useTimelineLogic } from '@/composables/useTimelineLogic'
import { dayColorFor } from '@/composables/useDayColor'
import PlaceDetailModal from '@/components/common/PlaceDetailModal.vue'

// 전체 일정 아코디언 안에서 특정 날짜의 상세 타임라인을 인라인으로 렌더한다.
// 드래그는 vuedraggable(SortableJS) 공유 그룹 'itinerary' 로 통일:
//   같은 날 순서변경 / 다른 날 이동 / 플라이아웃(검색·좋아요·AI) clone 추가
const props = defineProps({
  date: { type: String, required: true },
})

const trip = useTripStore()
const collab = useCollabStore()
const ui = useUiStore()
const { hoveredItemId } = storeToRefs(ui)

// 이 타임라인이 대상으로 하는 날짜의 store 배열(드래그가 직접 정렬/이동 → SSOT)
const dayList = computed(() => trip.currentTrip?.itemsByDay?.[props.date] ?? [])

// 지도 핀과 동일한 Day 색상 — 리스트 번호 배지에 사용
const dayColor = computed(() => dayColorFor((trip.days || []).indexOf(props.date)))

// 이전 날짜들의 아이템 수 합 = 이 날짜 시작 오프셋(지도와 동일한 전역 연속 번호)
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

const { transits } = useTimelineLogic(dayList)

// 일정 아이템인지(다른 날 이동) vs 플라이아웃 raw 카드인지(검색/좋아요/AI 추가) 판별
function isItineraryItem(el) {
  return /^(srv_|i_)/.test(String(el?.id ?? ''))
}

function onDragStart() {
  ui.setDraggingDay(props.date)
}
function onDragEnd() {
  ui.clearDraggingDay()
}
// vuedraggable @change: 배열은 이미 :list 가 이동/정렬했으므로 서버 반영만 트리거
function onChange(evt) {
  if (evt.moved) {
    trip.persistDayOrder(props.date)
  } else if (evt.added) {
    const el = evt.added.element
    if (isItineraryItem(el)) {
      // 다른 날에서 이 날로 이동 (source 날의 removed 가 source 순서 저장 담당)
      trip.commitItemMoved(el.id, null, props.date)
      collab.pushHistory({ type: 'add', itemName: el.name, byName: collab.me.name })
    } else {
      // 플라이아웃 clone → 정식 일정으로 교체
      trip.replaceDroppedRaw(props.date, evt.added.newIndex, el)
      collab.pushHistory({ type: 'add', itemName: el.name ?? el.title, byName: collab.me.name })
    }
  } else if (evt.removed) {
    trip.persistDayOrder(props.date)
  }
}

// Map → Timeline: scroll hovered card into view
const cardRefs = ref({})
watch(hoveredItemId, (id) => {
  if (!id) return
  nextTick(() => {
    const el = cardRefs.value[id]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
})

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

function setCardRef(el, id) {
  if (el?.$el) cardRefs.value[id] = el.$el
  else if (el) cardRefs.value[id] = el
}

// ── 둘러보기(자동 재생): 현재 active 장소 카드를 화면 중앙으로 자동 스크롤 ──
watch(() => ui.tourActiveId, (id) => {
  if (!ui.tourMode || !id) return
  nextTick(() => {
    const el = cardRefs.value[id]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
})
</script>

<template>
  <div>
    <!-- 드래그 존 래퍼: 아이템이 없으면 힌트 위에 draggable이 겹쳐 실제 드롭을 받는다 -->
    <div class="relative" :class="!dayList.length ? 'min-h-[104px]' : ''">
      <draggable
        :list="dayList"
        item-key="id"
        :group="{ name: 'itinerary', pull: true, put: true }"
        :animation="180"
        :disabled="ui.tourMode"
        handle=".place-card"
        filter="button"
        :prevent-on-filter="false"
        ghost-class="sr-ghost"
        chosen-class="sr-chosen"
        drag-class="sr-drag"
        :class="!dayList.length ? 'absolute inset-0 z-10' : 'flex flex-col gap-0.5 min-h-[44px]'"
        @start="onDragStart"
        @end="onDragEnd"
        @change="onChange"
      >
        <template #item="{ element: item, index: idx }">
          <div
            class="sr-row transition-all duration-300"
            :class="ui.tourMode
              ? (ui.tourActiveId === item.id ? 'tour-active' : 'tour-dim')
              : ''"
          >
            <PlaceCard
              :ref="el => setCardRef(el, item.id)"
              :item="item"
              :index="idx"
              :number="startNumber + idx + 1"
              :color="dayColor.pin"
              :hovered="hoveredItemId === item.id"
              :pending-delete="pendingDelete"
              @click="detail = item"
              @mouseenter="ui.setHoveredItem(item.id)"
              @mouseleave="ui.clearHoveredItem(item.id)"
              @save="onItemSave(item, $event)"
              @request-delete="requestDelete(item)"
              @confirm-delete="confirmDelete(item)"
            />
            <TransitItem
              v-if="idx < dayList.length - 1"
              :item="item"
              :next="dayList[idx + 1]"
              :auto-km="transits[idx]?.km ?? null"
              :auto-mins="transits[idx]?.mins ?? null"
              @hover-transit="ui.setHoveredTransit(item.id)"
              @leave-transit="ui.clearHoveredTransit()"
              @save-route="trip.setRoute(item.id, dayList[idx + 1].id, $event)"
            />
          </div>
        </template>
      </draggable>

      <!-- 빈 드롭 존 힌트 (pointer-events-none 으로 draggable 이벤트가 아래로 통과) -->
      <div
        v-if="!dayList.length"
        class="pointer-events-none absolute inset-0 rounded-xl border-2 border-dashed border-primary/25 bg-primary/5 dark:bg-primary/10 flex flex-col items-center justify-center gap-1.5"
      >
        <div class="drag-hint-icon">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <path d="M10 6v10M10 6L7 9M10 6l3 3" stroke="#00B7EB" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="6" y="14" width="16" height="10" rx="3" fill="#00B7EB" fill-opacity="0.15" stroke="#00B7EB" stroke-width="1.5"/>
          </svg>
        </div>
        <p class="text-[12px] font-semibold text-primary">장소를 여기로 드래그하세요</p>
        <p class="text-[11px] text-slate-400 dark:text-slate-500">검색 · 좋아요 · AI 추천 카드를 끌어다 놓으면 추가돼요</p>
      </div>
    </div>

    <!-- 상세보기 모달 -->
    <PlaceDetailModal
      :item="detail"
      :show-add="false"
      :editable="true"
      @close="detail = null"
      @save="onDetailSave"
    />
  </div>
</template>

<style scoped>
/* SortableJS 드래그 상태 연출 */
.sr-ghost { opacity: 0.4; }
.sr-chosen { cursor: grabbing; }
.sr-drag { opacity: 0.9; }

/* 빈 드롭존 아이콘 위아래 bounce */
@keyframes drag-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
.drag-hint-icon { animation: drag-bounce 1.8s ease-in-out infinite; }

/* 둘러보기 모드: 중앙 카드 강조 / 나머지 디밍 */
.tour-active { transform: scale(1.03); }
.tour-active :deep(.place-card) {
  box-shadow: 0 0 0 2px rgba(0,183,235,.55), 0 10px 26px -6px rgba(0,183,235,.4);
}
.tour-dim { opacity: 0.45; }
</style>
