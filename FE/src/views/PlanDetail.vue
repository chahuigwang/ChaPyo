<script setup>
import SidebarContainer from '@/components/sidebar/SidebarContainer.vue'
import TripDetailPanel from '@/components/workspace/TripDetailPanel.vue'
import HistoryDrawer from '@/components/workspace/HistoryDrawer.vue'
</script>

<template>
  <div class="flex-1 flex overflow-hidden relative">
    <SidebarContainer />
    <main class="flex-1 h-full overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <TripDetailPanel />
    </main>
    <HistoryDrawer />
  </div>
</template>
