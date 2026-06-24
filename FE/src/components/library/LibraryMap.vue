<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

// dayGroups: [{ dayNumber, color:{pin,bg,fg}, items:[{ itemId, _num, title, latitude, longitude }] }]
const props = defineProps({
  dayGroups: { type: Array, default: () => [] },
  activeId: { type: [Number, String], default: null }, // 펄스로 강조할 itemId
  hiddenDays: { type: Array, default: () => [] },       // 숨길 dayNumber 목록
})
const emit = defineEmits(['pin-click'])

const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_MAP_APP_KEY
const hasKey = !!KAKAO_APP_KEY && !KAKAO_APP_KEY.includes('여기에') && !KAKAO_APP_KEY.includes('YOUR_')

const mapEl = ref(null)
let mapInstance = null
let overlays = [] // { itemId, overlay, el }
let polylines = []
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

function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function clearAll() {
  overlays.forEach((o) => { try { o.overlay.setMap(null) } catch {} })
  polylines.forEach((p) => { try { p.setMap(null) } catch {} })
  overlays = []
  polylines = []
}

function buildPin(libItem, color) {
  const wrap = document.createElement('div')
  wrap.className = 'lib-map-pin'
  wrap.style.setProperty('--pin-color', color)
  wrap.innerHTML = `
    <div class="lib-map-pin__bubble" title="${libItem._num}. ${libItem.title ?? ''}">${libItem._num}</div>
    <div class="lib-map-pin__tail"></div>
  `
  wrap.addEventListener('click', () => emit('pin-click', libItem))
  return wrap
}

async function render() {
  if (!hasKey || !mapEl.value) return
  if (mapEl.value.clientWidth === 0 || mapEl.value.clientHeight === 0) return
  try {
    const kakao = await loadSdk()
    if (!mapInstance) {
      mapInstance = new kakao.maps.Map(mapEl.value, {
        center: new kakao.maps.LatLng(37.5665, 126.978),
        level: 7,
      })
    }
    clearAll()
    const bounds = new kakao.maps.LatLngBounds()
    let hasAny = false

    for (const group of props.dayGroups) {
      if (props.hiddenDays.includes(group.dayNumber)) continue
      const color = group.color?.pin ?? '#00B7EB'
      const pts = []
      for (const it of group.items) {
        const lat = num(it.latitude)
        const lng = num(it.longitude)
        if (lat == null || lng == null) continue
        const pos = new kakao.maps.LatLng(lat, lng)
        pts.push(pos)
        bounds.extend(pos)
        hasAny = true
        const el = buildPin(it, color)
        const ov = new kakao.maps.CustomOverlay({
          position: pos, content: el, yAnchor: 1, xAnchor: 0.5,
          zIndex: 1000 - (Number(it._num) || 0),
        })
        ov.setMap(mapInstance)
        overlays.push({ itemId: it.itemId, overlay: ov, el })
      }
      if (pts.length >= 2) {
        const pl = new kakao.maps.Polyline({
          path: pts, strokeWeight: 3, strokeColor: color, strokeOpacity: 0.85, strokeStyle: 'shortdash',
        })
        pl.setMap(mapInstance)
        polylines.push(pl)
      }
    }

    mapInstance.relayout()
    if (hasAny) mapInstance.setBounds(bounds)
    applyActive()
  } catch {
    /* SDK 실패 시 placeholder 유지 */
  }
}

// 활성 핀: 펄스 강조 + 화면 이동
function applyActive() {
  let activeOverlay = null
  overlays.forEach(({ itemId, el, overlay }) => {
    const on = props.activeId != null && itemId === props.activeId
    if (el) el.classList.toggle('lib-map-pin--active', on)
    if (on) { activeOverlay = overlay; try { overlay.setZIndex(3000) } catch {} }
    else { try { overlay.setZIndex(1000) } catch {} }
  })
  if (activeOverlay && mapInstance) {
    try { mapInstance.panTo(activeOverlay.getPosition()) } catch {}
  }
}

onMounted(() => {
  if (!mapEl.value) return
  ro = new ResizeObserver(() => render())
  ro.observe(mapEl.value)
  render()
})
watch(() => props.dayGroups, render, { deep: true, flush: 'post' })
watch(() => props.hiddenDays, render, { deep: true, flush: 'post' })
watch(() => props.activeId, applyActive)
onBeforeUnmount(() => {
  try { ro?.disconnect() } catch {}
  clearAll()
  ro = null; mapInstance = null
})
</script>

<template>
  <div class="relative w-full h-full bg-slate-100 dark:bg-slate-800">
    <div ref="mapEl" class="absolute inset-0 w-full h-full" />
    <div
      v-if="!hasKey"
      class="absolute inset-0 flex items-center justify-center text-[12px] text-slate-400 dark:text-slate-500 px-3 text-center pointer-events-none"
    >
      지도 키가 필요합니다.
    </div>
  </div>
</template>

<style>
/* Kakao 오버레이는 scoped 경계 밖에 마운트되므로 전역 스타일 */
.lib-map-pin {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transform-origin: bottom center;
  transition: transform .2s ease;
  --pin-color: #00B7EB;
  animation: lib-pin-in .25s ease-out;
}
@keyframes lib-pin-in {
  from { opacity: 0; transform: translateY(4px) scale(0.92); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.lib-map-pin__bubble {
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: var(--pin-color);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 4px 10px -2px color-mix(in srgb, var(--pin-color) 55%, transparent);
  border: 2px solid #fff;
}
.lib-map-pin__tail {
  width: 2px;
  height: 8px;
  background: var(--pin-color);
  margin-top: -1px;
  border-radius: 1px;
}
/* 활성(클릭/둘러보기) — 확대 + 펄스 링 */
.lib-map-pin--active {
  transform: translateY(-6px) scale(1.35);
  z-index: 3000 !important;
}
.lib-map-pin--active .lib-map-pin__bubble {
  position: relative;
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--pin-color) 30%, transparent),
    0 8px 18px -2px color-mix(in srgb, var(--pin-color) 70%, transparent);
}
.lib-map-pin--active .lib-map-pin__bubble::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 9999px;
  border: 2.5px solid var(--pin-color);
  animation: lib-ping 1.3s cubic-bezier(0, 0, 0.2, 1) infinite;
}
@keyframes lib-ping {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.2); opacity: 0; }
}
</style>
