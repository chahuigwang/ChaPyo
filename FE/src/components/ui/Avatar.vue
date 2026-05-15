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
  muted: 'bg-muted text-muted-foreground',
  brand: 'bg-brand-50 text-brand-700',
  secondary: 'bg-secondary text-secondary-foreground',
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
