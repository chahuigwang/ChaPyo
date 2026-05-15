<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <input
    :type="type"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
    class="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm
           placeholder:text-muted-foreground
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring
           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  />
</template>
