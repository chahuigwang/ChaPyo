<script setup>
import { computed } from 'vue'
import { PanelLeftClose, UserRound, Sun, Moon } from 'lucide-vue-next'
import { useUiStore } from '@/stores/uiStore'
import { useTheme } from '@/composables/useTheme'
import AuthPanel from './AuthPanel.vue'
import PersonaSelector from './PersonaSelector.vue'
import MessageList from './MessageList.vue'
import ChatComposer from './ChatComposer.vue'

const ui = useUiStore()
const { theme, toggle } = useTheme()
const isDark = computed(() => theme.value === 'dark')
</script>

<template>
  <aside class="w-[380px] shrink-0 h-full bg-white dark:bg-slate-900 shadow-sm flex flex-col transition-colors">
    <div class="flex items-center gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
      <button
        class="h-8 w-8 rounded-md text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
        title="내 프로필"
      >
        <UserRound :size="15" />
      </button>
      <button
        @click="toggle"
        class="h-8 w-8 rounded-md text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
        :title="isDark ? '라이트 모드' : '다크 모드'"
      >
        <Sun v-if="isDark" :size="15" />
        <Moon v-else :size="15" />
      </button>
      <button
        @click="ui.closeSidebar"
        class="ml-auto h-8 w-8 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
        title="사이드바 접기"
      >
        <PanelLeftClose :size="15" />
      </button>
    </div>
    <AuthPanel />
    <PersonaSelector />
    <MessageList />
    <ChatComposer />
  </aside>
</template>
