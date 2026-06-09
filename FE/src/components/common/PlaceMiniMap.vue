<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  name: { type: String, default: '' },
})

const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_MAP_APP_KEY
const hasKey = !!KAKAO_APP_KEY && !KAKAO_APP_KEY.includes('여기에') && !KAKAO_APP_KEY.includes('YOUR_')

const mapEl = ref(null)
let mapInstance = null
let marker = null
let sdkPromise = null

function loadSdk() {
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise((resolve, reject) => {
    if (window.kakao?.maps) return resolve(window.kakao)
    const src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&libraries=services&autoload=false`
    const existing = document.querySelector('script[src^="https://dapi.kakao.com/v2/maps/sdk.js"]')
    const onLoad = () => window.kakao.maps.load(() => resolve(window.kakao))
    if (existing) {
      if (window.kakao?.maps) return onLoad()
      existing.addEventListener('load', onLoad, { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = onLoad
    s.onerror = reject
    document.head.appendChild(s)
  })
  return sdkPromise
}

async function render() {
  if (!hasKey || props.lat == null || props.lng == null || !mapEl.value) return
  try {
    const kakao = await loadSdk()
    const pos = new kakao.maps.LatLng(props.lat, props.lng)
    if (!mapInstance) {
      mapInstance = new kakao.maps.Map(mapEl.value, { center: pos, level: 4 })
    }
    if (!marker) marker = new kakao.maps.Marker({ position: pos })
    marker.setPosition(pos)
    marker.setMap(mapInstance)
    // 모달이 막 열려 컨테이너 크기가 0이었을 수 있으니 레이아웃 재계산
    setTimeout(() => { mapInstance.relayout(); mapInstance.setCenter(pos) }, 60)
  } catch {
    /* SDK 로드 실패 시 placeholder 유지 */
  }
}

watch(() => [props.lat, props.lng], render, { immediate: true, flush: 'post' })
onBeforeUnmount(() => { try { marker?.setMap(null) } catch {} marker = null; mapInstance = null })
</script>

<template>
  <div class="relative w-full h-full bg-slate-100 dark:bg-slate-800">
    <div v-if="hasKey && lat != null && lng != null" ref="mapEl" class="absolute inset-0 w-full h-full" />
    <div
      v-else
      class="absolute inset-0 flex items-center justify-center text-[12px] text-slate-400 dark:text-slate-500 px-3 text-center"
    >
      위치 정보가 없습니다.
    </div>
  </div>
</template>
