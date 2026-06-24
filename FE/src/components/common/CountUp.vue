<script setup>
import { ref, watch, onUnmounted } from 'vue'

// 숫자 값이 바뀌면 이전 값 → 새 값으로 촤르륵 카운트 애니메이션.
// 폴링으로 금액/할당액이 갱신될 때 뚝 바뀌지 않고 자연스럽게 흐르도록 한다.
const props = defineProps({
  value: { type: Number, default: 0 },
  duration: { type: Number, default: 650 }, // ms
  // 표시 포맷터(기본: ko-KR 천단위 콤마)
  format: { type: Function, default: (n) => Math.round(n).toLocaleString('ko-KR') },
})

const display = ref(props.value)
let frame = null
let startVal = props.value
let startTime = 0

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3) }

function animate(to) {
  cancelAnimationFrame(frame)
  startVal = display.value
  startTime = performance.now()
  const delta = to - startVal
  if (delta === 0) { display.value = to; return }
  const step = (now) => {
    const p = Math.min(1, (now - startTime) / props.duration)
    display.value = startVal + delta * easeOutCubic(p)
    if (p < 1) frame = requestAnimationFrame(step)
    else display.value = to
  }
  frame = requestAnimationFrame(step)
}

watch(() => props.value, (v) => animate(v))
onUnmounted(() => cancelAnimationFrame(frame))
</script>

<template>
  <span class="tabular-nums">{{ format(display) }}</span>
</template>
