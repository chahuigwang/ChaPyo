<script setup>
defineProps({
  date: { type: String, default: '' },
  dayLabel: { type: String, default: '' },
  dayColor: { type: Object, required: true },
  itemCount: { type: Number, default: 0 },
  dailyCost: { type: Number, default: 0 },
})

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'
</script>

<template>
  <div>
    <div class="flex items-center gap-3 min-w-0">
      <span
        v-if="date"
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
        :style="{ backgroundColor: dayColor.bg, color: dayColor.fg }"
      >
        <span class="h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: dayColor.pin }" />
        {{ dayLabel }}
      </span>
      <div class="flex-1 min-w-0">
        <p class="text-[15px] font-semibold text-slate-900 dark:text-slate-100">{{ date || '날짜를 선택하세요' }}</p>
        <p class="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">{{ itemCount }}건의 일정</p>
      </div>
    </div>
    <div v-if="date" class="mt-3 flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
      <span class="text-[11px] text-slate-400">장소 {{ itemCount }}건</span>
      <span class="text-[12px] font-semibold text-slate-900 dark:text-slate-100">{{ won(dailyCost) }}</span>
    </div>
  </div>
</template>
