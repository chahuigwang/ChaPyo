<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

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
let ro = null

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

const hasCoords = () => props.lat != null && props.lng != null

async function render() {
  if (!hasKey || !hasCoords() || !mapEl.value) return
  // 컨테이너가 아직 0 크기면(모달 오픈 직후) 그릴 수 없음 — ResizeObserver가 이후 다시 호출
  if (mapEl.value.clientWidth === 0 || mapEl.value.clientHeight === 0) return
  try {
    const kakao = await loadSdk()
    const pos = new kakao.maps.LatLng(props.lat, props.lng)
    if (!mapInstance) {
      mapInstance = new kakao.maps.Map(mapEl.value, { center: pos, level: 4 })
    }
    if (!marker) marker = new kakao.maps.Marker({ position: pos })
    marker.setPosition(pos)
    marker.setMap(mapInstance)
    mapInstance.relayout()
    mapInstance.setCenter(pos)
  } catch {
    /* SDK 실패 시 placeholder 유지 */
  }
}

onMounted(() => {
  if (!mapEl.value) return
  ro = new ResizeObserver(() => render())
  ro.observe(mapEl.value)
  render()
})
watch(() => [props.lat, props.lng], render, { flush: 'post' })
onBeforeUnmount(() => {
  try { ro?.disconnect() } catch {}
  try { marker?.setMap(null) } catch {}
  ro = null; marker = null; mapInstance = null
})
</script>

<template>
  <div class="relative w-full h-full bg-slate-100 dark:bg-slate-800">
    <div ref="mapEl" class="absolute inset-0 w-full h-full" />
    <div
      v-if="!hasKey || lat == null || lng == null"
      class="absolute inset-0 flex items-center justify-center text-[12px] text-slate-400 dark:text-slate-500 px-3 text-center pointer-events-none"
    >
      위치 정보가 없습니다.
    </div>
  </div>
</template>
