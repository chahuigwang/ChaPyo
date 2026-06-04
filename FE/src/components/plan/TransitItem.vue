<script setup>
import { ref, computed } from 'vue'
import { Car, Pencil, Check, X } from 'lucide-vue-next'
import { useTripStore } from '@/stores/tripStore'

const props = defineProps({
  item: { type: Object, required: true },
  autoKm: { type: String, default: null },
  autoMins: { type: Number, default: null },
})

const trip = useTripStore()

const editing = ref(false)
const draftCost = ref(0)
const draftMins = ref('')

const displayMins = computed(() => {
  if (props.item.transitAfter?.mins != null) return props.item.transitAfter.mins
  return props.autoMins ?? '?'
})
const displayKm = computed(() => props.autoKm ?? '?')
const transitCost = computed(() => Number(props.item.transitAfter?.cost) || 0)

function startEdit() {
  draftCost.value = transitCost.value
  draftMins.value = props.item.transitAfter?.mins ?? props.autoMins ?? ''
  editing.value = true
}
function cancel() { editing.value = false }
function save() {
  trip.updateTransit(props.item.id, {
    cost: Number(draftCost.value) || 0,
    mins: draftMins.value !== '' ? Number(draftMins.value) : null,
  })
  editing.value = false
}

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'
</script>

<template>
  <div class="w-full px-4 py-1 flex flex-col">
    <!-- Transit display block — full width, taller click target -->
    <div
      v-if="!editing"
      class="group relative w-full min-h-[52px] flex items-center gap-3 px-4 py-3 rounded-xl
             bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800
             cursor-pointer hover:border-primary/40 hover:shadow-md transition-all duration-200"
      @click="startEdit"
    >
      <!-- Left vertical accent -->
      <div class="w-0.5 h-full absolute left-0 top-0 rounded-l-xl bg-slate-200 dark:bg-slate-700" />
      <Car :size="14" class="text-primary shrink-0 ml-1" />
      <div class="flex-1 min-w-0">
        <div class="text-[11px] font-medium text-slate-600 dark:text-slate-300">
          {{ displayMins }}분 · {{ displayKm }}km
        </div>
        <div v-if="transitCost > 0" class="text-[10px] text-primary font-semibold mt-0.5">
          {{ won(transitCost) }}
        </div>
        <div v-else class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">이동 비용 없음</div>
      </div>
      <Pencil
        :size="12"
        class="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      />
    </div>

    <!-- Inline edit — full width -->
    <div
      v-else
      class="w-full rounded-xl bg-white dark:bg-slate-900 shadow-md border border-primary/30 p-4"
      @click.stop
    >
      <div class="flex items-center gap-1.5 mb-3">
        <Car :size="13" class="text-primary" />
        <span class="text-[11px] font-semibold text-slate-700 dark:text-slate-200">이동 정보 편집</span>
      </div>
      <div class="flex gap-3">
        <label class="flex-1 flex flex-col gap-1">
          <span class="text-[10px] text-slate-400">소요 시간 (분)</span>
          <input
            v-model="draftMins"
            type="number" min="0" placeholder="분"
            class="w-full rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                   text-slate-900 dark:text-slate-100 outline-none focus:border-primary px-2 py-1.5 text-[12px]"
          />
        </label>
        <label class="flex-1 flex flex-col gap-1">
          <span class="text-[10px] text-slate-400">비용 (원)</span>
          <input
            v-model="draftCost"
            type="number" min="0" placeholder="0"
            class="w-full rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                   text-slate-900 dark:text-slate-100 outline-none focus:border-primary px-2 py-1.5 text-[12px]"
          />
        </label>
      </div>
      <div class="flex justify-end gap-1.5 mt-3">
        <button @click="cancel" class="h-7 px-3 rounded-lg text-[11px] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          취소
        </button>
        <button @click="save" class="h-7 px-3 rounded-lg text-[11px] font-semibold bg-primary text-white hover:bg-primary/90 transition-colors">
          저장
        </button>
      </div>
    </div>
  </div>
</template>
