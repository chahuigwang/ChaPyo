<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useTripStore } from '@/stores/tripStore'
import { useUiStore } from '@/stores/uiStore'
import { dayColorFor } from '@/composables/useDayColor'
import { geocodeAddress } from '@/composables/useGeocoder'

const props = defineProps({ showAll: { type: Boolean, default: false } })

const trip = useTripStore()
const ui = useUiStore()
const { itemsOfSelectedDay, selectedDate, currentTrip } = storeToRefs(trip)
const { hoveredItemId, hoveredTransitIndex } = storeToRefs(ui)

const dayColor = computed(() => {
  const days = trip.days || []
  const idx = days.indexOf(selectedDate.value)
  return dayColorFor(idx >= 0 ? idx : 0)
})

// All items across all days for total view (flat, enriched with dayIndex for coloring)
const allDayItems = computed(() => {
  const t = currentTrip.value
  if (!t) return []
  const days = trip.days || []
  return days.flatMap((iso, dayIdx) =>
    (t.itemsByDay[iso] ?? []).map((item) => ({ ...item, _dayIdx: dayIdx, _dayIso: iso }))
  )
})

// .env 의 VITE_KAKAO_MAP_APP_KEY 값만 채우면 자동으로 동작합니다.
// 키가 비어 있으면 placeholder 가 노출됩니다.
const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_MAP_APP_KEY
const hasKey = computed(
  () => !!KAKAO_APP_KEY && !KAKAO_APP_KEY.includes('여기에') && !KAKAO_APP_KEY.includes('YOUR_'),
)

const mapEl = ref(null)
let mapInstance = null
let overlays = [] // { itemId, overlay, el }
let polylines = [] // daily segments: [{ polyline, color }] indexed by segment position
let sdkPromise = null
let animFrame = null

// 핀 번호/경로는 일정(타임라인) 배열 순서를 따른다 — 순서 변경 시 핀 번호도 함께 갱신됨
const sortedItems = computed(() => itemsOfSelectedDay.value)

// Items that need geocoding (have an address but no coords)
const itemsMissingCoords = computed(() => {
  const src = props.showAll ? allDayItems.value : sortedItems.value
  return src.filter((i) => (i.lat == null || i.lng == null) && !!(i.address || i.memo))
})

const positionedItems = computed(() => {
  if (props.showAll) return allDayItems.value.filter((i) => i.lat != null && i.lng != null)
  return sortedItems.value.filter((i) => i.lat != null && i.lng != null)
})

function loadKakaoSdk() {
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise((resolve, reject) => {
    if (window.kakao?.maps) return resolve(window.kakao)
    const src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&libraries=services&autoload=false`
    const existing = document.querySelector(`script[src^="https://dapi.kakao.com/v2/maps/sdk.js"]`)
    const onLoad = () => window.kakao.maps.load(() => resolve(window.kakao))
    if (existing) {
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

const sdkError = ref(false)
const geocoding = ref(false)

async function resolveCoords(items) {
  if (!window.kakao?.maps?.services) return
  const unresolved = items.filter((i) => (i.lat == null || i.lng == null) && !!(i.address || i.memo))
  if (!unresolved.length) return
  geocoding.value = true
  await Promise.allSettled(
    unresolved.map(async (item) => {
      const addr = (item.address && item.address.trim()) || ''
      if (!addr) return
      try {
        const coords = await geocodeAddress(addr)
        if (coords) trip.patchItemCoords(item.id, coords.lat, coords.lng)
      } catch {}
    })
  )
  geocoding.value = false
}

async function initMap() {
  if (!hasKey.value || !mapEl.value || mapInstance) return
  try {
    const kakao = await loadKakaoSdk()
    mapInstance = new kakao.maps.Map(mapEl.value, {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 6,
    })
    await resolveCoords(props.showAll ? allDayItems.value : sortedItems.value)
    renderRoute()
  } catch (err) {
    console.error('[TripMap] Kakao SDK failed to load', err)
    sdkError.value = true
  }
}

function clearOverlays() {
  overlays.forEach(({ overlay }) => { try { overlay.setMap(null) } catch {} })
  overlays = []
  polylines.forEach(({ pl }) => { try { pl.setMap(null) } catch {} })
  polylines = []
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null }
}

function buildPinEl(num, name, itemId, color) {
  const wrap = document.createElement('div')
  wrap.className = 'trip-map-pin'
  wrap.dataset.itemId = itemId
  wrap.style.setProperty('--pin-color', color)
  wrap.innerHTML = `
    <div class="trip-map-pin__bubble" title="${num}. ${name}">${num}</div>
    <div class="trip-map-pin__tail"></div>
  `
  wrap.addEventListener('mouseenter', () => ui.setHoveredItem(itemId))
  wrap.addEventListener('mouseleave', () => ui.clearHoveredItem(itemId))
  return wrap
}

// 현재 좌표 구성의 지문. 동일하면 다시 그리지 않아 폴링 시 지도 깜빡임/점프를 막는다.
let lastSig = ''
function routeSignature(items) {
  return items.map((i) => `${i.id}:${i.lat}:${i.lng}`).join('|')
}

function renderRoute() {
  if (!mapInstance || !window.kakao?.maps) return
  const kakao = window.kakao
  const items = positionedItems.value
  const sig = routeSignature(items)
  // 좌표 구성이 그대로면(예: 폴링으로 동일 데이터 재수신) 재렌더 생략 → 지도 유지
  if (sig === lastSig && overlays.length) return
  lastSig = sig
  clearOverlays()
  const pts = items.map((i) => new kakao.maps.LatLng(i.lat, i.lng))
  if (!pts.length) return

  // In showAll mode: continuous global numbering, per-day polylines with per-day color
  if (props.showAll) {
    const byDay = {}
    items.forEach((it, globalIdx) => {
      const key = it._dayIso ?? 'unknown'
      if (!byDay[key]) byDay[key] = { dayIdx: it._dayIdx ?? 0, items: [], pts: [], startNum: globalIdx + 1 }
      byDay[key].items.push({ ...it, _globalNum: globalIdx + 1 })
      byDay[key].pts.push(pts[globalIdx])
    })
    Object.entries(byDay).forEach(([iso, { dayIdx, items: dItems, pts: dPts }]) => {
      // 경로 숨김 처리된 날짜는 핀과 경로를 모두 그리지 않는다.
      if (ui.routeHiddenDays[iso]) return
      const color = dayColorFor(dayIdx)
      dItems.forEach((it, i) => {
        const el = buildPinEl(it._globalNum, it.name, it.id, color.pin)
        const ov = new kakao.maps.CustomOverlay({ position: dPts[i], content: el, yAnchor: 1, xAnchor: 0.5, zIndex: 3 })
        ov.setMap(mapInstance)
        overlays.push({ itemId: it.id, overlay: ov, el })
      })
      // 경로 토글: 숨김 처리된 날짜는 폴리라인(경로)을 그리지 않는다 (핀은 유지)
      if (dPts.length >= 2 && !ui.routeHiddenDays[iso]) {
        const pl = new kakao.maps.Polyline({ path: dPts, strokeWeight: 3, strokeColor: color.pin, strokeOpacity: 0.85, strokeStyle: 'shortdash' })
        pl.setMap(mapInstance)
        polylines.push({ pl, color: color.pin, segIdx: dayIdx })
      }
    })
  } else {
    const pinColor = dayColor.value.pin
    items.forEach((it, idx) => {
      const el = buildPinEl(idx + 1, it.name, it.id, pinColor)
      const overlay = new kakao.maps.CustomOverlay({ position: pts[idx], content: el, yAnchor: 1, xAnchor: 0.5, zIndex: 3 })
      overlay.setMap(mapInstance)
      overlays.push({ itemId: it.id, overlay, el })
    })
    // Per-segment polylines for transit hover
    for (let i = 0; i < pts.length - 1; i++) {
      const pl = new kakao.maps.Polyline({
        path: [pts[i], pts[i + 1]],
        strokeWeight: 3,
        strokeColor: pinColor,
        strokeOpacity: 0.85,
        strokeStyle: 'shortdash',
      })
      pl.setMap(mapInstance)
      polylines.push({ pl, color: pinColor, segIdx: i })
    }
  }
  if (pts.length === 1) {
    mapInstance.setCenter(pts[0])
    if (mapInstance.getLevel() > 5) mapInstance.setLevel(5)
  } else {
    const bounds = new kakao.maps.LatLngBounds()
    pts.forEach((p) => bounds.extend(p))
    mapInstance.setBounds(bounds)
  }
  applyHoverHighlight(hoveredItemId.value)
}

function applyHoverHighlight(id) {
  overlays.forEach(({ itemId, el }) => {
    if (el) el.classList.toggle('trip-map-pin--active', !!id && itemId === id)
  })
}

function applyTransitHighlight(segIdx) {
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null }
  polylines.forEach(({ pl, color, segIdx: si }) => {
    if (segIdx != null && si === segIdx) {
      pl.setOptions({ strokeWeight: 5, strokeColor: '#00B7EB', strokeOpacity: 1, strokeStyle: 'solid' })
      animateDash(pl)
    } else {
      pl.setOptions({ strokeWeight: 3, strokeColor: color, strokeOpacity: 0.85, strokeStyle: 'shortdash' })
    }
  })
}

function animateDash(pl) {
  let offset = 0
  function step() {
    offset = (offset + 1) % 30
    try {
      pl.setOptions({ strokeStyle: 'shortdash', strokeOpacity: 0.9 + 0.1 * Math.sin(offset / 5) })
    } catch {}
    animFrame = requestAnimationFrame(step)
  }
  animFrame = requestAnimationFrame(step)
}

onMounted(() => {
  if (hasKey.value) nextTick(initMap)
})

onBeforeUnmount(() => {
  clearOverlays()
  mapInstance = null
  if (animFrame) cancelAnimationFrame(animFrame)
})

watch(itemsMissingCoords, async (items) => {
  if (!items.length || !window.kakao?.maps?.services) return
  await resolveCoords(items)
  renderRoute()
}, { deep: true })
watch(positionedItems, renderRoute, { deep: true })
watch(selectedDate, renderRoute)
watch(allDayItems, () => { if (props.showAll) renderRoute() }, { deep: true })
watch(hoveredItemId, (id) => applyHoverHighlight(id))
watch(hoveredTransitIndex, (idx) => applyTransitHighlight(idx))
// 경로 표시/숨김 토글 시 폴리라인 재구성 (좌표는 그대로라 lastSig 초기화로 강제 재렌더)
watch(() => ({ ...ui.routeHiddenDays }), () => {
  if (!props.showAll) return
  lastSig = ''
  renderRoute()
}, { deep: true })

function onRelayout() {
  nextTick(() => {
    if (!mapInstance || !window.kakao?.maps) return
    mapInstance.relayout()
    renderRoute()
  })
}

defineExpose({ onRelayout })
</script>

<template>
  <div class="h-full w-full overflow-hidden relative bg-slate-50 dark:bg-slate-800/50">
    <div v-if="hasKey" ref="mapEl" class="absolute inset-0 w-full h-full" />
    <div
      v-else
      class="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[12px] text-slate-400 dark:text-slate-500 px-4 text-center"
    >
      <span class="font-medium text-slate-500 dark:text-slate-400">Kakao Map 키가 필요합니다</span>
      <span>.env 의 <code class="text-primary">VITE_KAKAO_MAP_APP_KEY</code> 값을 채워주세요.</span>
    </div>
    <div
      v-if="hasKey && sdkError"
      class="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[12px] text-red-500 px-4 text-center bg-white/90 dark:bg-slate-900/80"
    >
      <span class="font-medium">Kakao Map SDK 로드에 실패했어요</span>
      <span class="text-slate-500 dark:text-slate-400">키와 도메인 허용 설정을 확인해주세요.</span>
    </div>
    <div
      v-if="hasKey && geocoding"
      class="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/80 text-[11px] text-slate-500 dark:text-slate-400 shadow-sm pointer-events-none flex items-center gap-1.5"
    >
      <span class="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
      주소 변환 중…
    </div>
    <div
      v-if="hasKey && !positionedItems.length && !geocoding"
      class="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-md bg-white/90 dark:bg-slate-900/80 text-[11px] text-slate-500 dark:text-slate-400 shadow-sm pointer-events-none"
    >
      좌표가 있는 장소가 없습니다.
    </div>
  </div>
</template>

<style>
/* Global — Kakao mounts content outside scoped boundary. */
.trip-map-pin {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transform-origin: bottom center;
  transition: transform .2s ease;
  --pin-color: #00B7EB;
}
.trip-map-pin__bubble {
  min-width: 26px;
  height: 26px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: var(--pin-color);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 4px 10px -2px color-mix(in srgb, var(--pin-color) 55%, transparent);
  border: 2px solid #fff;
}
.trip-map-pin__tail {
  width: 2px;
  height: 8px;
  background: var(--pin-color);
  margin-top: -1px;
  border-radius: 1px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.15);
}
.trip-map-pin--active {
  transform: translateY(-4px) scale(1.12);
  z-index: 5 !important;
}
.trip-map-pin--active .trip-map-pin__bubble {
  filter: brightness(0.92);
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--pin-color) 25%, transparent),
    0 6px 14px -2px color-mix(in srgb, var(--pin-color) 65%, transparent);
}
</style>
