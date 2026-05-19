<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'default' }, // default | secondary | outline | success | brand
})

const VARIANTS = {
  default: 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900',
  secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  outline: 'bg-transparent text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700',
  brand: 'bg-brand-50 dark:bg-brand-700/30 text-brand-700 dark:text-brand-200',
  success: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
}

const cls = computed(() => [
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
  VARIANTS[props.variant] ?? VARIANTS.default,
])
</script>

<template>
  <span :class="cls"><slot /></span>
</template>
