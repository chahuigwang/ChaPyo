<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import {
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  Sun,
  Moon,
  Ticket,
  Archive,
  MessageSquare,
  Search,
} from 'lucide-vue-next'
import { useUiStore } from '@/stores/uiStore'
import { useTheme } from '@/composables/useTheme'
import ChatFlyout from './ChatFlyout.vue'
import ProfileFlyout from './ProfileFlyout.vue'
import StorageFlyout from './StorageFlyout.vue'
import SearchFlyout from './SearchFlyout.vue'

const ui = useUiStore()
const { activePanel, sidebarOpen } = storeToRefs(ui)
const { theme, toggle } = useTheme()
const isDark = computed(() => theme.value === 'dark')

const railBtn =
  'h-10 w-10 rounded-md text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors'
const railBtnActive =
  'h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center'

function isActive(name) {
  return activePanel.value === name
}
</script>

<template>
  <aside class="shrink-0 h-full flex bg-white dark:bg-slate-900 shadow-sm">
    <!-- Navigation Rail (always visible) -->
    <div class="w-16 h-full flex flex-col items-center py-3 gap-1">
      <button
        @click="ui.toggleSidebar"
        :class="railBtn"
        :title="sidebarOpen ? '사이드바 접기' : '사이드바 열기'"
      >
        <PanelLeftClose v-if="sidebarOpen" :size="18" />
        <PanelLeftOpen v-else :size="18" />
      </button>

      <div class="my-1 h-px w-8 bg-slate-100 dark:bg-slate-800" />

      <button
        @click="ui.togglePanel('chat')"
        :class="isActive('chat') ? railBtnActive : railBtn"
        title="AI 채팅"
      >
        <MessageSquare :size="18" />
      </button>
      <button
        @click="ui.togglePanel('search')"
        :class="isActive('search') ? railBtnActive : railBtn"
        title="장소 검색"
      >
        <Search :size="18" />
      </button>
      <button
        @click="ui.togglePanel('storage')"
        :class="isActive('storage') ? railBtnActive : railBtn"
        title="보관함"
      >
        <Archive :size="18" />
      </button>
      <button
        @click="ui.togglePanel('profile')"
        :class="isActive('profile') ? railBtnActive : railBtn"
        title="내 프로필"
      >
        <UserRound :size="18" />
      </button>

      <div class="mt-auto flex flex-col items-center gap-1">
        <button
          @click="toggle"
          :class="railBtn"
          :title="isDark ? '라이트 모드' : '다크 모드'"
        >
          <Sun v-if="isDark" :size="18" />
          <Moon v-else :size="18" />
        </button>
        <span class="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center" title="차표">
          <Ticket :size="15" />
        </span>
      </div>
    </div>

    <!-- Flyout panel -->
    <div
      :class="[
        'h-full border-l border-slate-100 dark:border-slate-800 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden',
        'transition-[width] duration-300 ease-in-out',
        sidebarOpen ? 'w-[340px]' : 'w-0',
      ]"
    >
      <ChatFlyout v-if="activePanel === 'chat'" />
      <SearchFlyout v-else-if="activePanel === 'search'" />
      <ProfileFlyout v-else-if="activePanel === 'profile'" />
      <StorageFlyout v-else-if="activePanel === 'storage'" />
    </div>
  </aside>
</template>
