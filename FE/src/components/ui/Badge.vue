<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'default' }, // default | secondary | outline | success | brand
})

const VARIANTS = {
  default: 'bg-primary text-primary-foreground border-transparent',
  secondary: 'bg-secondary text-secondary-foreground border-transparent',
  outline: 'border-border text-foreground',
  brand: 'bg-brand-50 text-brand-700 border-transparent',
  success: 'bg-emerald-50 text-emerald-700 border-transparent',
}

const cls = computed(() => [
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
  VARIANTS[props.variant] ?? VARIANTS.default,
])
</script>

<template>
  <span :class="cls"><slot /></span>
</template>
