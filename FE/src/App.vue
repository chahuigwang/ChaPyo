<script setup>
import { storeToRefs } from 'pinia'
import AppHeader from './components/layout/AppHeader.vue'
import SidebarContainer from './components/sidebar/SidebarContainer.vue'
import WorkspaceContainer from './components/workspace/WorkspaceContainer.vue'
import LoginModal from './components/auth/LoginModal.vue'
import { useAuthStore } from '@/stores/authStore'

const { isAuthed } = storeToRefs(useAuthStore())
</script>

<template>
  <div class="h-screen flex flex-col bg-background">
    <AppHeader />
    <div class="flex-1 flex overflow-hidden">
      <SidebarContainer v-if="isAuthed" />
      <WorkspaceContainer />
    </div>
    <LoginModal />
  </div>
</template>
