<script setup>
import AuthPanel from './AuthPanel.vue'
import PersonaSelector from './PersonaSelector.vue'
import MessageList from './MessageList.vue'
import ChatComposer from './ChatComposer.vue'
</script>

<template>
  <aside class="w-[360px] shrink-0 h-full border-r border-border bg-card flex flex-col">
    <AuthPanel />
    <PersonaSelector />
    <MessageList />
    <ChatComposer />
  </aside>
</template>
