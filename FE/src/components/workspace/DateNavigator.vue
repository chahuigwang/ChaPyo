<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronLeft, ChevronRight, LayoutGrid, ChevronDown } from 'lucide-vue-next'
import { useTripStore } from '@/stores/tripStore'
import { useUiStore } from '@/stores/uiStore'
import { formatDayLabel } from '@/types/itinerary'

const trip = useTripStore()
const ui = useUiStore()
const { days, selectedDate } = storeToRefs(trip)
const { currentView } = storeToRefs(ui)

const currentIndex = computed(() => {
  if (!selectedDate.value) return -1
  return days.value.indexOf(selectedDate.value)
})

const isDaily = computed(() => currentView.value === 'daily')
const hasPrev = computed(() => isDaily.value && currentIndex.value > 0)
const hasNext = computed(() => isDaily.value && currentIndex.value >= 0 && currentIndex.value < days.value.length - 1)

function goTotal() { ui.setCurrentView('total') }
function goPrev() { if (hasPrev.value) trip.selectDate(days.value[currentIndex.value - 1]) }
function goNext() { if (hasNext.value) trip.selectDate(days.value[currentIndex.value + 1]) }
function pickDay(iso) { trip.selectDate(iso); ui.setCurrentView('daily'); dropdownOpen.value = false }

// Custom dropdown
const dropdownOpen = ref(false)
const dropdownRef = ref(null)
const triggerRef = ref(null)

function toggleDropdown() { dropdownOpen.value = !dropdownOpen.value }

function onOutside(e) {
  if (!dropdownOpen.value) return
  if (triggerRef.value?.contains(e.target)) return
  if (dropdownRef.value?.contains(e.target)) return
  dropdownOpen.value = false
}

onMounted(() => document.addEventListener('mousedown', onOutside))
onUnmounted(() => document.removeEventListener('mousedown', onOutside))

const currentLabel = computed(() => {
  if (currentIndex.value < 0) return '날짜 선택'
  return formatDayLabel(selectedDate.value, currentIndex.value)
})
</script>

<template>
  <div class="flex items-center gap-2">

    <!-- Total view icon bento block -->
    <button
      @click="goTotal"
      class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-2.5 flex items-center justify-center
             transition-all hover:shadow-md shrink-0"
      :class="!isDaily ? 'text-primary ring-2 ring-primary/20' : 'text-slate-400 dark:text-slate-500'"
      title="전체 일정"
    >
      <LayoutGrid :size="18" />
    </button>

    <!-- State A: Total view — label block -->
    <div
      v-if="!isDaily"
      class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm px-4 py-2.5 flex items-center"
    >
      <span class="text-[12px] font-semibold text-slate-700 dark:text-slate-200">전체 일정</span>
    </div>

    <!-- State B: Daily view — Prev + Date dropdown + Next as separate blocks -->
    <template v-else>
      <!-- Prev block -->
      <button
        @click="goPrev"
        :disabled="!hasPrev"
        class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-2.5 flex items-center justify-center
               transition-all shrink-0"
        :class="hasPrev
          ? 'text-slate-600 dark:text-slate-300 hover:shadow-md cursor-pointer'
          : 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50'"
      >
        <ChevronLeft :size="16" />
      </button>

      <!-- Date dropdown block -->
      <div class="relative flex-1 min-w-0">
        <button
          ref="triggerRef"
          type="button"
          @click="toggleDropdown"
          class="w-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm px-3 py-2 flex items-center justify-between gap-1 cursor-pointer transition-all hover:shadow-md"
        >
          <span class="text-[12px] font-semibold text-slate-900 dark:text-slate-100 truncate">{{ currentLabel }}</span>
          <ChevronDown
            :size="11"
            class="shrink-0 text-slate-400 transition-transform duration-200"
            :class="dropdownOpen ? 'rotate-180' : ''"
          />
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
            v-if="dropdownOpen"
            ref="dropdownRef"
            class="absolute left-0 top-full mt-1.5 z-50 w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl py-1.5 overflow-hidden"
          >
            <button
              v-for="(iso, idx) in days"
              :key="iso"
              type="button"
              @click="pickDay(iso)"
              class="w-full text-left px-3 py-2 text-[12px] font-medium transition-colors"
              :class="iso === selectedDate
                ? 'text-white font-semibold'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'"
              :style="iso === selectedDate ? { backgroundColor: '#00B7EB' } : {}"
            >
              {{ formatDayLabel(iso, idx) }}
            </button>
            <div v-if="!days.length" class="px-3 py-2 text-[11px] text-slate-400">날짜 없음</div>
          </div>
        </Transition>
      </div>

      <!-- Next block -->
      <button
        @click="goNext"
        :disabled="!hasNext"
        class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-2.5 flex items-center justify-center
               transition-all shrink-0"
        :class="hasNext
          ? 'text-slate-600 dark:text-slate-300 hover:shadow-md cursor-pointer'
          : 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50'"
      >
        <ChevronRight :size="16" />
      </button>
    </template>

  </div>
</template>
