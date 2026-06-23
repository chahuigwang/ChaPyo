<script setup>
import { ref, computed, watch } from 'vue'
import { Car, Navigation, Pencil, Check, X, Clock, Wallet } from 'lucide-vue-next'

const props = defineProps({
  item: { type: Object, required: true },
  next: { type: Object, default: null },
  autoKm: { type: String, default: null },
  autoMins: { type: Number, default: null },
})
const emit = defineEmits(['hover-transit', 'leave-transit', 'save-route'])

const canRoute = computed(() => {
  const a = props.item, b = props.next
  return a?.lat != null && a?.lng != null && b?.lat != null && b?.lng != null
})
const directionsUrl = computed(() => {
  if (!canRoute.value) return ''
  const a = props.item, b = props.next
  const from = `${encodeURIComponent(a.name || '출발')},${a.lat},${a.lng}`
  const to = `${encodeURIComponent(b.name || '도착')},${b.lat},${b.lng}`
  return `https://map.kakao.com/link/from/${from}/to/${to}`
})
function openDirections(e) {
  e.stopPropagation()
  if (directionsUrl.value) window.open(directionsUrl.value, '_blank', 'noopener,noreferrer')
}

const displayKm = computed(() => props.autoKm ?? '?')

// 저장된 이동 정보(소요시간/비용). 서버 route 가 있으면 그 값, 없으면 추정치(autoMins).
const savedMins = computed(() => props.item?.transitAfter?.mins ?? null)
const savedCost = computed(() => Number(props.item?.transitAfter?.cost) || 0)
const displayMins = computed(() => savedMins.value ?? props.autoMins ?? null)
// 사용자가 직접 저장한 값이 있는지(추정치와 구분 표시)
const hasSaved = computed(() => savedMins.value != null || savedCost.value > 0)

// 서버 itemId 가 양쪽 다 있어야 저장 가능(로컬 전용 아이템은 편집 불가)
const canSave = computed(() => props.item?.serverId != null && props.next?.serverId != null)

// ── 인라인 편집 ──
const editing = ref(false)
const draftMins = ref(0)
const draftCost = ref(0)
function startEdit(e) {
  e.stopPropagation()
  draftMins.value = displayMins.value ?? 0
  draftCost.value = savedCost.value
  editing.value = true
}
function cancel(e) {
  e?.stopPropagation()
  editing.value = false
}
function save(e) {
  e?.stopPropagation()
  emit('save-route', {
    moveTime: Math.max(0, Math.round(Number(draftMins.value) || 0)),
    cost: Math.max(0, Math.round(Number(draftCost.value) || 0)),
  })
  editing.value = false
}
// 외부에서 데이터가 갱신되면 편집 중 드래프트는 유지하되, 닫힌 상태면 동기화는 computed 가 처리
watch(() => props.item?.id, () => { editing.value = false })

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR')
</script>

<template>
  <div class="w-full py-1 flex flex-col">
    <div
      class="w-full flex items-center gap-2 px-4 py-2 rounded-xl
             bg-slate-50 dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800
             transition-all duration-200"
      @mouseenter="emit('hover-transit')"
      @mouseleave="emit('leave-transit')"
    >
      <Car :size="18" class="text-primary shrink-0" />

      <!-- 보기 모드 -->
      <template v-if="!editing">
        <div class="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <span class="text-[12px] font-medium text-slate-600 dark:text-slate-300">{{ displayKm }}km</span>
          <span v-if="displayMins != null" class="inline-flex items-center gap-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Clock :size="11" /> {{ displayMins }}분
          </span>
          <span v-if="savedCost > 0" class="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary">
            <Wallet :size="11" /> {{ won(savedCost) }}원
          </span>
        </div>

        <button
          v-if="canSave"
          @click.stop="startEdit"
          class="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-lg text-slate-400
                 hover:text-primary hover:bg-primary/10 transition-colors"
          :title="hasSaved ? '이동 정보 수정' : '이동 시간·비용 입력'"
        >
          <Pencil :size="13" />
        </button>
        <button
          v-if="canRoute"
          @click.stop="openDirections"
          class="shrink-0 inline-flex items-center gap-1 px-2.5 h-7 rounded-lg text-[11px] font-semibold
                 text-primary bg-primary/10 hover:bg-primary hover:text-white transition-colors"
          title="카카오맵에서 길찾기"
        >
          <Navigation :size="12" /> 길찾기
        </button>
      </template>

      <!-- 편집 모드 -->
      <template v-else>
        <div class="flex-1 min-w-0 flex items-center gap-1.5" @click.stop>
          <div class="flex items-center gap-1 rounded-lg bg-white dark:bg-slate-800 px-2 h-7 shadow-sm">
            <Clock :size="12" class="text-slate-400 shrink-0" />
            <input
              v-model.number="draftMins"
              type="number" min="0"
              class="w-10 bg-transparent outline-none text-[12px] text-right text-slate-800 dark:text-slate-100"
              @keydown.enter="save" @keydown.esc="cancel"
            />
            <span class="text-[11px] text-slate-400">분</span>
          </div>
          <div class="flex items-center gap-1 rounded-lg bg-white dark:bg-slate-800 px-2 h-7 shadow-sm">
            <Wallet :size="12" class="text-slate-400 shrink-0" />
            <input
              v-model.number="draftCost"
              type="number" min="0"
              class="w-14 bg-transparent outline-none text-[12px] text-right text-slate-800 dark:text-slate-100"
              @keydown.enter="save" @keydown.esc="cancel"
            />
            <span class="text-[11px] text-slate-400">원</span>
          </div>
        </div>
        <button
          @click.stop="save"
          class="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-lg text-white bg-primary hover:bg-primary/90 transition-colors"
          title="저장"
        >
          <Check :size="14" />
        </button>
        <button
          @click.stop="cancel"
          class="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="취소"
        >
          <X :size="14" />
        </button>
      </template>
    </div>
  </div>
</template>
