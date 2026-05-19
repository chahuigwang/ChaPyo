<script setup>
import { computed } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  fallback: { type: String, default: '' },
  size: { type: String, default: 'md' }, // xs | sm | md | lg
  variant: { type: String, default: 'muted' }, // muted | brand | secondary
})

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
}
const VARIANTS = {
  muted: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
  brand: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
}

const cls = computed(() => [
  'inline-flex items-center justify-center rounded-full font-medium overflow-hidden shrink-0',
  SIZES[props.size] ?? SIZES.md,
  VARIANTS[props.variant] ?? VARIANTS.muted,
])

const initials = computed(() =>
  (props.fallback || '?').slice(0, 2).toUpperCase()
)
</script>

<template>
  <span :class="cls">
    <img v-if="src" :src="src" alt="" class="h-full w-full object-cover" />
    <slot v-else>{{ initials }}</slot>
  </span>
</template>
