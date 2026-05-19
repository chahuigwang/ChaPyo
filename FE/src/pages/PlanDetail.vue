<script setup>
import { storeToRefs } from 'pinia'
import { PanelLeftOpen } from 'lucide-vue-next'
import SidebarContainer from '@/components/plan/SidebarContainer.vue'
import TripDetailPanel from '@/components/plan/TripDetailPanel.vue'
import { useUiStore } from '@/stores/uiStore'

const ui = useUiStore()
const { sidebarOpen } = storeToRefs(ui)
</script>

<template>
  <div class="flex-1 flex overflow-hidden relative">
    <SidebarContainer v-if="sidebarOpen" />
    <button
      v-if="!sidebarOpen"
      @click="ui.openSidebar"
      class="absolute top-3 left-3 z-20 h-9 w-9 rounded-md bg-white dark:bg-slate-900 shadow-md ring-1 ring-slate-200 dark:ring-slate-700
             flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
      title="사이드바 열기"
    >
      <PanelLeftOpen :size="16" />
    </button>
    <main class="flex-1 h-full overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <TripDetailPanel />
    </main>
  </div>
</template>
