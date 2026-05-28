<script setup>
import PersonaSelector from './PersonaSelector.vue'
import MessageList from './MessageList.vue'
import ChatComposer from './ChatComposer.vue'
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <PersonaSelector />
    <MessageList />
    <ChatComposer />
  </div>
</template>
