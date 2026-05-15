<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'default' }, // default | outline | ghost | destructive | secondary | link
  size: { type: String, default: 'md' },          // sm | md | lg | icon
  as: { type: String, default: 'button' },
})

const VARIANTS = {
  default: 'bg-primary text-primary-foreground hover:bg-brand-600',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-slate-300',
  outline: 'border border-border bg-card text-foreground hover:bg-muted',
  ghost: 'text-foreground hover:bg-muted',
  destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
  link: 'text-primary hover:underline',
}
const SIZES = {
  sm: 'h-8 px-3 text-xs rounded-md',
  md: 'h-9 px-4 text-sm rounded-md',
  lg: 'h-10 px-5 text-sm rounded-md',
  icon: 'h-8 w-8 rounded-md',
}

const cls = computed(() => [
  'inline-flex items-center justify-center gap-1.5 font-medium transition-colors',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
  VARIANTS[props.variant] ?? VARIANTS.default,
  SIZES[props.size] ?? SIZES.md,
])
</script>

<template>
  <component :is="as" :class="cls">
    <slot />
  </component>
</template>
