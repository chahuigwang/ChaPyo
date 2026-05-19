<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useTripStore } from '@/stores/tripStore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common'

const trip = useTripStore()
const { itemsOfSelectedDay, selectedDate } = storeToRefs(trip)

// .env 의 VITE_KAKAO_MAP_APP_KEY 값만 채우면 자동으로 동작합니다.
// 키가 비어 있으면 placeholder 가 노출됩니다.
const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_MAP_APP_KEY
const hasKey = computed(
  () => !!KAKAO_APP_KEY && !KAKAO_APP_KEY.includes('여기에') && !KAKAO_APP_KEY.includes('YOUR_'),
)

const mapEl = ref(null)
let mapInstance = null
let markers = []
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

async function initMap() {
  if (!hasKey.value || !mapEl.value || mapInstance) return
  const kakao = await loadKakaoSdk()
  mapInstance = new kakao.maps.Map(mapEl.value, {
    center: new kakao.maps.LatLng(37.5665, 126.9780),
    level: 6,
  })
  renderRoute()
}

function clearOverlays() {
  markers.forEach((m) => m.setMap(null))
  markers = []
  if (polyline) {
    polyline.setMap(null)
    polyline = null
  }
}

function renderRoute() {
  if (!mapInstance || !window.kakao?.maps) return
  const kakao = window.kakao
  clearOverlays()
  const pts = positionedItems.value.map((i) => new kakao.maps.LatLng(i.lat, i.lng))
  if (!pts.length) return
  pts.forEach((latlng, idx) => {
    const marker = new kakao.maps.Marker({
      map: mapInstance,
      position: latlng,
      title: `${idx + 1}. ${positionedItems.value[idx].name}`,
    })
    markers.push(marker)
  })
  if (pts.length >= 2) {
    polyline = new kakao.maps.Polyline({
      path: pts,
      strokeWeight: 3,
      strokeColor: '#00B7EB',
      strokeOpacity: 0.9,
      strokeStyle: 'shortdash',
    })
    polyline.setMap(mapInstance)
  }
  const bounds = new kakao.maps.LatLngBounds()
  pts.forEach((p) => bounds.extend(p))
  mapInstance.setBounds(bounds)
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
</script>

<template>
  <Card class="h-full flex flex-col">
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle>동선 지도</CardTitle>
        <span class="text-[12px] text-slate-500 dark:text-slate-400">{{ selectedDate || '—' }}</span>
      </div>
    </CardHeader>

    <CardContent class="flex-1 min-h-[260px]">
      <!--
        Kakao Map 마운트 영역.
        .env 의 VITE_KAKAO_MAP_APP_KEY 에 발급받은 JavaScript 키를 입력하면 즉시 표시됩니다.
      -->
      <div class="relative w-full h-full min-h-[260px] rounded-md overflow-hidden bg-slate-50 dark:bg-slate-800/50">
        <div v-if="hasKey" ref="mapEl" class="absolute inset-0 w-full h-full" />
        <div
          v-else
          class="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[12px] text-slate-400 dark:text-slate-500 px-4 text-center"
        >
          <span class="font-medium text-slate-500 dark:text-slate-400">Kakao Map 키가 필요합니다</span>
          <span>.env 의 <code class="text-primary">VITE_KAKAO_MAP_APP_KEY</code> 값을 채워주세요.</span>
        </div>

        <div
          v-if="hasKey && !positionedItems.length"
          class="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-md bg-white/90 dark:bg-slate-900/80 text-[11px] text-slate-500 dark:text-slate-400 shadow-sm pointer-events-none"
        >
          이 날짜에 좌표가 있는 장소가 없습니다.
        </div>
      </div>
    </CardContent>
  </Card>
</template>
