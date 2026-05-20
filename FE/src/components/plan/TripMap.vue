<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { Maximize2, Minimize2 } from 'lucide-vue-next'
import { useTripStore } from '@/stores/tripStore'
import { useUiStore } from '@/stores/uiStore'
import { dayColorFor } from '@/composables/useDayColor'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common'

const trip = useTripStore()
const ui = useUiStore()
const { itemsOfSelectedDay, selectedDate } = storeToRefs(trip)
const { hoveredItemId } = storeToRefs(ui)

const dayColor = computed(() => {
  const days = trip.days || []
  const idx = days.indexOf(selectedDate.value)
  return dayColorFor(idx >= 0 ? idx : 0)
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
let polyline = null
let sdkPromise = null

const sortedItems = computed(() =>
  [...itemsOfSelectedDay.value].sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99')),
)
const positionedItems = computed(() => sortedItems.value.filter((i) => i.lat != null && i.lng != null))

function loadKakaoSdk() {
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise((resolve, reject) => {
    if (window.kakao?.maps) return resolve(window.kakao)
    const src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false`
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
async function initMap() {
  if (!hasKey.value || !mapEl.value || mapInstance) return
  try {
    const kakao = await loadKakaoSdk()
    mapInstance = new kakao.maps.Map(mapEl.value, {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 6,
    })
    renderRoute()
  } catch (err) {
    console.error('[TripMap] Kakao SDK failed to load', err)
    sdkError.value = true
  }
}

function clearOverlays() {
  overlays.forEach(({ overlay }) => overlay.setMap(null))
  overlays = []
  if (polyline) {
    polyline.setMap(null)
    polyline = null
  }
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

function renderRoute() {
  if (!mapInstance || !window.kakao?.maps) return
  const kakao = window.kakao
  clearOverlays()
  const items = positionedItems.value
  const pts = items.map((i) => new kakao.maps.LatLng(i.lat, i.lng))
  if (!pts.length) return
  const pinColor = dayColor.value.pin
  items.forEach((it, idx) => {
    const el = buildPinEl(idx + 1, it.name, it.id, pinColor)
    const overlay = new kakao.maps.CustomOverlay({
      position: pts[idx],
      content: el,
      yAnchor: 1,
      xAnchor: 0.5,
      zIndex: 3,
    })
    overlay.setMap(mapInstance)
    overlays.push({ itemId: it.id, overlay, el })
  })
  if (pts.length >= 2) {
    polyline = new kakao.maps.Polyline({
      path: pts,
      strokeWeight: 3,
      strokeColor: pinColor,
      strokeOpacity: 0.9,
      strokeStyle: 'shortdash',
    })
    polyline.setMap(mapInstance)
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
    el.classList.toggle('trip-map-pin--active', !!id && itemId === id)
  })
}

onMounted(() => {
  if (hasKey.value) nextTick(initMap)
})

onBeforeUnmount(() => {
  clearOverlays()
  mapInstance = null
})

watch(positionedItems, renderRoute, { deep: true })
watch(selectedDate, renderRoute)
watch(hoveredItemId, (id) => applyHoverHighlight(id))

const expanded = ref(false)
function toggleExpanded() {
  expanded.value = !expanded.value
  // Kakao map needs a relayout when its container size changes.
  nextTick(() => {
    if (!mapInstance || !window.kakao?.maps) return
    mapInstance.relayout()
    renderRoute()
  })
}
function onOverlayKeydown(e) {
  if (e.key === 'Escape' && expanded.value) toggleExpanded()
}
</script>

<template>
  <Card class="h-full flex flex-col">
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle>동선 지도</CardTitle>
        <div class="flex items-center gap-2">
          <span class="text-[12px] text-slate-500 dark:text-slate-400">{{ selectedDate || '—' }}</span>
          <button
            type="button"
            class="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-medium
                   text-[#00B7EB] bg-[#00B7EB]/10 hover:bg-[#00B7EB] hover:text-white
                   hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
            title="지도 크게 보기"
            @click="toggleExpanded"
          >
            <Maximize2 :size="12" /> 크게 보기
          </button>
        </div>
      </div>
    </CardHeader>

    <CardContent class="flex-1 min-h-[260px]" @keydown="onOverlayKeydown">
      <!--
        Kakao Map 마운트 영역.
        .env 의 VITE_KAKAO_MAP_APP_KEY 에 발급받은 JavaScript 키를 입력하면 즉시 표시됩니다.
      -->
      <Teleport to="#map-expand-target" :disabled="!expanded">
      <div
        :class="expanded
          ? 'pointer-events-auto absolute inset-4 lg:inset-6 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xl flex flex-col ring-1 ring-slate-200/70 dark:ring-slate-700/70'
          : 'relative w-full h-full min-h-[260px] rounded-md overflow-hidden bg-slate-50 dark:bg-slate-800/50'"
      >
        <div
          v-if="expanded"
          class="h-12 shrink-0 flex items-center justify-between px-4 bg-white dark:bg-slate-900"
        >
          <div class="flex items-center gap-2 text-[13px] font-semibold text-slate-900 dark:text-slate-100">
            동선 지도
            <span class="text-[11px] font-normal text-slate-500 dark:text-slate-400">{{ selectedDate || '—' }}</span>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-medium
                   text-slate-500 dark:text-slate-400
                   hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="닫기"
            @click="toggleExpanded"
          >
            <Minimize2 :size="12" /> 작게 보기
          </button>
        </div>
        <div :class="expanded ? 'relative flex-1' : 'absolute inset-0'">
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
            v-if="hasKey && !positionedItems.length"
            class="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-md bg-white/90 dark:bg-slate-900/80 text-[11px] text-slate-500 dark:text-slate-400 shadow-sm pointer-events-none"
          >
            이 날짜에 좌표가 있는 장소가 없습니다.
          </div>
        </div>
      </div>
      </Teleport>
    </CardContent>
  </Card>
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
