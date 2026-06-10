<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: String, default: '' },
  minDate: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const triggerRef = ref(null)
const panelRef = ref(null)

function parseISO(s) {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  return { y, m, d }
}
function toISO(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

const today = new Date()
const init = computed(() => {
  const p = parseISO(props.modelValue)
  if (p) return { year: p.y, month: p.m }
  return { year: today.getFullYear(), month: today.getMonth() + 1 }
})

const cursor = ref({ ...init.value })
watch(() => props.modelValue, () => { cursor.value = { ...init.value } })

const monthLabel = computed(() => `${cursor.value.year}년 ${cursor.value.month}월`)

function prev() {
  let { year, month } = cursor.value
  if (month === 1) { year--; month = 12 } else month--
  cursor.value = { year, month }
}
function next() {
  let { year, month } = cursor.value
  if (month === 12) { year++; month = 1 } else month++
  cursor.value = { year, month }
}

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

const cells = computed(() => {
  const { year, month } = cursor.value
  const first = new Date(year, month - 1, 1)
  const startDow = first.getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const arr = []
  for (let i = 0; i < startDow; i++) arr.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toISO(year, month, d)
    const isSelected = iso === props.modelValue
    const isDisabled = !!(props.minDate && iso < props.minDate)
    arr.push({ day: d, iso, isSelected, isDisabled })
  }
  while (arr.length % 7 !== 0) arr.push(null)
  return arr
})

function pick(cell) {
  if (!cell || cell.isDisabled) return
  emit('update:modelValue', cell.iso)
  open.value = false
}

function toggle() { open.value = !open.value }

function onOutsideClick(e) {
  if (!open.value) return
  if (triggerRef.value?.contains(e.target)) return
  if (panelRef.value?.contains(e.target)) return
  open.value = false
}

onMounted(() => document.addEventListener('mousedown', onOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', onOutsideClick))

const displayValue = computed(() => {
  if (!props.modelValue) return '날짜 선택'
  const p = parseISO(props.modelValue)
  if (!p) return props.modelValue
  return `${p.y}. ${p.m}. ${p.d}.`
})
</script>

<template>
  <div class="relative">
    <button
      ref="triggerRef"
      type="button"
      @click="toggle"
      class="bg-transparent text-[16px] font-semibold text-slate-800 dark:text-slate-100 outline-none cursor-pointer text-right hover:text-primary transition-colors"
    >
      {{ displayValue }}
    </button>

    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="open"
        ref="panelRef"
        class="absolute right-0 z-50 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-4"
        style="border: none"
      >
        <!-- Month navigation -->
        <div class="flex items-center justify-between mb-3">
          <span class="text-[13px] font-semibold text-slate-900 dark:text-slate-100">{{ monthLabel }}</span>
          <div class="flex gap-0.5">
            <button
              type="button"
              @click="prev"
              class="h-7 w-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft :size="14" />
            </button>
            <button
              type="button"
              @click="next"
              class="h-7 w-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight :size="14" />
            </button>
          </div>
        </div>

        <!-- Weekdays -->
        <div class="grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1">
          <div v-for="w in weekdays" :key="w">{{ w }}</div>
        </div>

        <!-- Day cells -->
        <div class="grid grid-cols-7 gap-0.5">
          <template v-for="(cell, i) in cells" :key="i">
            <div v-if="!cell" class="h-8" />
            <button
              v-else
              type="button"
              @click="pick(cell)"
              :disabled="cell.isDisabled"
              :class="[
                'h-8 w-full rounded-full text-[12px] flex items-center justify-center transition-all font-medium',
                cell.isSelected
                  ? 'text-white font-semibold'
                  : cell.isDisabled
                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer',
              ]"
              :style="cell.isSelected ? { backgroundColor: '#00B7EB' } : {}"
            >
              {{ cell.day }}
            </button>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>
