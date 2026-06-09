<script setup>
import { computed } from 'vue'

const props = defineProps({
  date: { type: String, default: '' },
  dayLabel: { type: String, default: '' },
  dayColor: { type: Object, required: true },
  itemCount: { type: Number, default: 0 },
  dailyCost: { type: Number, default: 0 },
})

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
// dayLabel("Day 1 · 6/9(화)") → "Day 1"
const dayBadge = computed(() => (props.dayLabel || '').split('·')[0].trim() || 'Day')
const dateWithWeekday = computed(() => {
  if (!props.date) return ''
  const d = new Date(props.date)
  if (Number.isNaN(d.getTime())) return props.date
  return `${props.date}(${WEEKDAYS[d.getDay()]})`
})
</script>

<template>
  <div>
    <div class="flex items-center gap-3 min-w-0">
      <span
        v-if="date"
        class="px-2.5 py-1 rounded-lg text-[13px] font-bold border whitespace-nowrap shrink-0"
        :style="{ backgroundColor: dayColor.bg, borderColor: dayColor.pin, color: dayColor.fg }"
      >{{ dayBadge }}</span>
      <div class="flex-1 min-w-0">
        <p class="text-[16px] font-bold text-slate-900 dark:text-slate-100 truncate">{{ dateWithWeekday || '날짜를 선택하세요' }}</p>
        <p class="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">{{ itemCount }}건의 일정</p>
      </div>
    </div>
    <div v-if="date" class="mt-3 flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
      <span class="text-[11px] text-slate-400">장소 {{ itemCount }}건</span>
      <span class="text-[12px] font-semibold text-slate-900 dark:text-slate-100">{{ won(dailyCost) }}</span>
    </div>
  </div>
</template>
