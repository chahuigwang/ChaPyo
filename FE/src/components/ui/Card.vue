<script setup>
defineProps({ padded: { type: Boolean, default: false } })
</script>

<template>
  <div
    class="rounded-md border border-border bg-card text-card-foreground"
    :class="padded && 'p-4'"
  >
    <slot />
  </div>
</template>
