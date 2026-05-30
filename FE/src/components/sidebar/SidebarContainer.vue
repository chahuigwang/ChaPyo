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
  MapPin,
  ChevronLeft,
} from 'lucide-vue-next'
import { useUiStore } from '@/stores/uiStore'
import { useTheme } from '@/composables/useTheme'
import { useTripStore } from '@/stores/tripStore'
import ChatFlyout from '@/components/sidebar/chat/ChatFlyout.vue'
import ProfileFlyout from '@/components/sidebar/ProfileFlyout.vue'
import StorageFlyout from '@/components/sidebar/storage/StorageFlyout.vue'
import SearchFlyout from '@/components/sidebar/search/SearchFlyout.vue'
import PlanFlyout from '@/components/sidebar/PlanFlyout.vue'

const ui = useUiStore()
const trip = useTripStore()
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
    <!-- Navigation Rail: 3 groups -->
    <div class="w-16 h-full flex flex-col items-center py-3">

      <!-- Group 1: Collapse toggle only -->
      <button
        @click="ui.toggleSidebar"
        :class="railBtn"
        :title="sidebarOpen ? '사이드바 접기' : '사이드바 열기'"
      >
        <PanelLeftClose v-if="sidebarOpen" :size="18" />
        <PanelLeftOpen v-else :size="18" />
      </button>

      <!-- Group 2: Trip Settings only -->
      <div class="mt-4 flex flex-col items-center">
        <button
          @click="ui.togglePanel('plan')"
          :class="isActive('plan') ? railBtnActive : railBtn"
          title="여행 설정"
        >
          <MapPin :size="18" />
        </button>
      </div>

      <!-- Group 3: Chat / Search / Storage / Profile -->
      <div class="mt-4 flex flex-col items-center gap-1">
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
      </div>

      <!-- Bottom: theme toggle + branding + back button -->
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
        <button
          @click="trip.exitTrip"
          class="h-10 w-10 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 flex items-center justify-center transition-colors"
          title="여행 리스트로 이동"
        >
          <ChevronLeft :size="18" />
        </button>
      </div>
    </div>

    <!-- Flyout panel -->
    <div
      :class="[
        'h-full border-l border-slate-100 dark:border-slate-800 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden',
        'transition-[width] duration-300 ease-in-out',
        sidebarOpen ? 'w-100' : 'w-0',
      ]"
    >
      <ChatFlyout v-if="activePanel === 'chat'" />
      <SearchFlyout v-else-if="activePanel === 'search'" />
      <PlanFlyout v-else-if="activePanel === 'plan'" />
      <ProfileFlyout v-else-if="activePanel === 'profile'" />
      <StorageFlyout v-else-if="activePanel === 'storage'" />
    </div>
  </aside>
</template>
