<script setup>
import SidebarContainer from '@/components/plan/SidebarContainer.vue'
import TripDetailPanel from '@/components/plan/TripDetailPanel.vue'
import StaleViewToast from '@/components/plan/StaleViewToast.vue'
import HistoryDrawer from '@/components/plan/HistoryDrawer.vue'
</script>

<template>
  <div class="flex-1 flex overflow-hidden relative">
    <SidebarContainer />
    <main class="flex-1 h-full overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <TripDetailPanel />
    </main>
    <StaleViewToast />
    <HistoryDrawer />
  </div>
</template>
