<script setup>
defineProps({ padded: { type: Boolean, default: false } })
</script>

<template>
  <div
    class="rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm transition-colors"
    :class="padded && 'p-6'"
  >
    <slot />
  </div>
</template>
