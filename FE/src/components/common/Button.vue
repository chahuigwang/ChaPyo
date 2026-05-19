<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'default' }, // default | outline | ghost | destructive | secondary | link
  size: { type: String, default: 'md' },          // sm | md | lg | icon
  as: { type: String, default: 'button' },
})

const VARIANTS = {
  default: 'bg-primary text-primary-foreground hover:bg-brand-600',
  secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700',
  outline: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700',
  ghost: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
  link: 'text-slate-900 dark:text-slate-100 underline-offset-4 hover:underline',
}
const SIZES = {
  sm: 'h-8 px-3 text-xs rounded-md',
  md: 'h-9 px-4 text-sm rounded-md',
  lg: 'h-11 px-6 text-sm rounded-md',
  icon: 'h-8 w-8 rounded-md',
}

const cls = computed(() => [
  'inline-flex items-center justify-center gap-1.5 font-medium transition-colors',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900',
  VARIANTS[props.variant] ?? VARIANTS.default,
  SIZES[props.size] ?? SIZES.md,
])
</script>

<template>
  <component :is="as" :class="cls">
    <slot />
  </component>
</template>
