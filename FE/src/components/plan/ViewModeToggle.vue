<script setup>
import { storeToRefs } from 'pinia'
import { Map, Columns, List } from 'lucide-vue-next'
import { useUiStore } from '@/stores/uiStore'

const ui = useUiStore()
const { viewMode } = storeToRefs(ui)

const MODES = [
  { id: 'map', label: '지도', icon: Map, title: 'Map Only' },
  { id: 'split', label: 'Split', icon: Columns, title: 'Split (Default)' },
  { id: 'timeline', label: '타임라인', icon: List, title: 'Timeline Only' },
]
</script>

<template>
  <div
    class="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 shadow-inner"
    role="tablist"
    aria-label="보기 모드"
  >
    <button
      v-for="m in MODES"
      :key="m.id"
      type="button"
      role="tab"
      :aria-selected="viewMode === m.id"
      :title="m.title"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md
             transition-all duration-200"
      :class="viewMode === m.id
        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'"
      @click="ui.setViewMode(m.id)"
    >
      <component :is="m.icon" :size="13" />
      {{ m.label }}
    </button>
  </div>
</template>
