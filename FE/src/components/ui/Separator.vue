<script setup>
defineProps({
  orientation: { type: String, default: 'horizontal' },
})
</script>

<template>
  <div
    role="separator"
    :class="[
      'bg-border shrink-0',
      orientation === 'vertical' ? 'w-px h-full' : 'h-px w-full',
    ]"
  />
</template>
