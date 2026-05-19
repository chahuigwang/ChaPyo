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
    class="flex h-10 w-full rounded-md bg-slate-100 dark:bg-slate-800 px-3 py-1 text-sm text-slate-900 dark:text-slate-100
           placeholder:text-slate-400 dark:placeholder:text-slate-500
           ring-1 ring-transparent focus-visible:outline-none focus-visible:ring-primary
           disabled:opacity-50 disabled:cursor-not-allowed transition-all"
  />
</template>
