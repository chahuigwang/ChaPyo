<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useTripStore } from '@/stores/tripStore'
import { useUiStore } from '@/stores/uiStore'
import { dayColorFor } from '@/composables/useDayColor'
import { geocodeAddress } from '@/composables/useGeocoder'
import { routeQuality, worstLegMidpoint } from '@/composables/useRouteQuality'

// 드래그 중 품질 색상
const QUALITY_COLOR = { good: '#22c55e', bad: '#ef4444', neutral: null }

const props = defineProps({ showAll: { type: Boolean, default: false } })

const trip = useTripStore()
const ui = useUiStore()
const { itemsOfSelectedDay, selectedDate, currentTrip } = storeToRefs(trip)
const { hoveredItemId, hoveredTransitId } = storeToRefs(ui)

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
    restrictToKorea(kakao)
    await resolveCoords(props.showAll ? allDayItems.value : sortedItems.value)
    renderRoute()
  } catch (err) {
    console.error('[TripMap] Kakao SDK failed to load', err)
    sdkError.value = true
  }
}

// 지도를 대한민국 범위로 제한: 너무 멀리 축소하지 못하게 하고(최대 레벨),
// 중심이 한반도 경계 밖으로 나가면 다시 안쪽으로 끌어당긴다.
const KOREA = { minLat: 33.0, maxLat: 38.9, minLng: 124.5, maxLng: 132.0 }
function restrictToKorea(kakao) {
  if (!mapInstance) return
  mapInstance.setMaxLevel(12) // 전국이 한 화면에 들어오는 수준까지만 축소 허용
  const clampCenter = () => {
    const c = mapInstance.getCenter()
    const lat = c.getLat()
    const lng = c.getLng()
    const nLat = Math.min(KOREA.maxLat, Math.max(KOREA.minLat, lat))
    const nLng = Math.min(KOREA.maxLng, Math.max(KOREA.minLng, lng))
    if (nLat !== lat || nLng !== lng) {
      mapInstance.setCenter(new kakao.maps.LatLng(nLat, nLng))
    }
  }
  kakao.maps.event.addListener(mapInstance, 'drag', clampCenter)
  kakao.maps.event.addListener(mapInstance, 'dragend', clampCenter)
  kakao.maps.event.addListener(mapInstance, 'zoom_changed', clampCenter)
}

let feedbackOverlays = [] // ⚠️/✨ 피드백 배지
let blinkFrames = [] // 빨강 깜빡임 rAF 핸들

function clearOverlays() {
  overlays.forEach(({ overlay }) => { try { overlay.setMap(null) } catch {} })
  overlays = []
  polylines.forEach(({ pl }) => { try { pl.setMap(null) } catch {} })
  polylines = []
  feedbackOverlays.forEach((ov) => { try { ov.setMap(null) } catch {} })
  feedbackOverlays = []
  blinkFrames.forEach((h) => cancelAnimationFrame(h))
  blinkFrames = []
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null }
  if (tourAnimFrame) { cancelAnimationFrame(tourAnimFrame); tourAnimFrame = null }
}

// 나쁨 경로: strokeOpacity 를 깜빡이게 (rAF)
function blinkPolyline(pl) {
  let t = 0
  const step = () => {
    t += 0.16
    try { pl.setOptions({ strokeOpacity: 0.35 + 0.65 * Math.abs(Math.sin(t)) }) } catch {}
    const h = requestAnimationFrame(step)
    blinkFrames[blinkFrames.length - 1] = h
  }
  blinkFrames.push(requestAnimationFrame(step))
}

// 지도 위 피드백 배지(⚠️/✨) — CSS 애니메이션
function addFeedbackBadge({ lat, lng }, emoji, kind) {
  if (!window.kakao?.maps || lat == null || lng == null) return
  const el = document.createElement('div')
  el.className = `trip-fb trip-fb--${kind}`
  el.textContent = emoji
  const ov = new window.kakao.maps.CustomOverlay({
    position: new window.kakao.maps.LatLng(lat, lng),
    content: el, yAnchor: 0.5, xAnchor: 0.5, zIndex: 9,
  })
  ov.setMap(mapInstance)
  feedbackOverlays.push(ov)
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

// ── 둘러보기(스크롤 매직) 렌더링 ───────────────────────────
let lastTourDay = null
let lastTourActiveIdx = -1
let tourAnimFrame = null
function clearTourAnim() { if (tourAnimFrame) { cancelAnimationFrame(tourAnimFrame); tourAnimFrame = null } }

// 마지막 트레일 구간을 점→점 성장 드로잉(easeOutCubic)
function animateSegment(prev, target, color) {
  const kakao = window.kakao
  const pl = new kakao.maps.Polyline({ path: [prev, prev], strokeWeight: 4, strokeColor: color, strokeOpacity: 0.95, strokeStyle: 'solid' })
  pl.setMap(mapInstance)
  polylines.push({ pl, color, segIdx: -1 })
  const t0 = performance.now()
  const dur = 420
  const lat0 = prev.getLat(), lng0 = prev.getLng()
  const lat1 = target.getLat(), lng1 = target.getLng()
  const step = (now) => {
    const k = Math.min(1, (now - t0) / dur)
    const e = 1 - Math.pow(1 - k, 3)
    const cur = new kakao.maps.LatLng(lat0 + (lat1 - lat0) * e, lng0 + (lng1 - lng0) * e)
    try { pl.setPath([prev, cur]) } catch {}
    if (k < 1) tourAnimFrame = requestAnimationFrame(step)
  }
  tourAnimFrame = requestAnimationFrame(step)
}

function renderTour() {
  if (!mapInstance || !window.kakao?.maps) return
  const kakao = window.kakao
  clearOverlays()
  clearTourAnim()
  const flat = allDayItems.value
  if (!flat.length) return
  let activeIdx = flat.findIndex((i) => i.id === ui.tourActiveId)
  if (activeIdx < 0) activeIdx = 0
  const active = flat[activeIdx]
  const activeDay = active._dayIso

  // 날짜별 그룹(전역 순서 gi 보존)
  const byDay = {}
  flat.forEach((it, gi) => {
    const iso = it._dayIso ?? 'unknown'
    if (!byDay[iso]) byDay[iso] = { dayIdx: it._dayIdx ?? 0, list: [] }
    byDay[iso].list.push({ it, gi })
  })

  Object.entries(byDay).forEach(([iso, { dayIdx, list }]) => {
    const color = dayColorFor(dayIdx)
    const isActiveDay = iso === activeDay
    const coords = list.filter(({ it }) => it.lat != null && it.lng != null)
    const ll = (it) => new kakao.maps.LatLng(it.lat, it.lng)

    if (!isActiveDay) {
      // 다른 날: 옅은 고스트 라인
      const pts = coords.map(({ it }) => ll(it))
      if (pts.length >= 2) {
        const pl = new kakao.maps.Polyline({ path: pts, strokeWeight: 2, strokeColor: color.pin, strokeOpacity: 0.16, strokeStyle: 'solid' })
        pl.setMap(mapInstance); polylines.push({ pl, color: color.pin, segIdx: dayIdx })
      }
    } else {
      // 현재 날: 직전까지 누적 트레일(solid) + 마지막 구간 성장 드로잉 + 이후 고스트
      const past = coords.filter(({ gi }) => gi < activeIdx).map(({ it }) => ll(it))
      const activeCoord = active.lat != null ? ll(active) : null
      if (past.length >= 2) {
        const pl = new kakao.maps.Polyline({ path: past, strokeWeight: 4, strokeColor: color.pin, strokeOpacity: 0.95, strokeStyle: 'solid' })
        pl.setMap(mapInstance); polylines.push({ pl, color: color.pin, segIdx: dayIdx })
      }
      if (past.length >= 1 && activeCoord) {
        animateSegment(past[past.length - 1], activeCoord, color.pin)
      }
      const up = coords.filter(({ gi }) => gi >= activeIdx).map(({ it }) => ll(it))
      if (up.length >= 2) {
        const pl = new kakao.maps.Polyline({ path: up, strokeWeight: 2, strokeColor: color.pin, strokeOpacity: 0.22, strokeStyle: 'shortdash' })
        pl.setMap(mapInstance); polylines.push({ pl, color: color.pin, segIdx: dayIdx })
      }
    }

    // 핀
    list.forEach(({ it, gi }) => {
      if (it.lat == null || it.lng == null) return
      const ping = isActiveDay && gi === activeIdx
      const el = buildPinEl(gi + 1, it.name, it.id, color.pin)
      if (ping) el.classList.add('trip-map-pin--ping')
      el.style.opacity = !isActiveDay ? '0.3' : (gi < activeIdx ? '1' : (gi === activeIdx ? '1' : '0.45'))
      const ov = new kakao.maps.CustomOverlay({ position: ll(it), content: el, yAnchor: 1, xAnchor: 0.5, zIndex: ping ? 8 : 3 })
      ov.setMap(mapInstance); overlays.push({ itemId: it.id, overlay: ov, el })
    })
  })

  // 카메라: 최초 진입은 bounds 맞춤, 이후 모든 이동은 panTo (Day 변경 포함)
  if (active.lat != null && active.lng != null) {
    const target = new kakao.maps.LatLng(active.lat, active.lng)
    if (lastTourDay === null) {
      // 첫 진입: 오늘 전체 핀이 보이도록 한 번만 setBounds
      const dayCoords = (byDay[activeDay]?.list ?? []).filter(({ it }) => it.lat != null).map(({ it }) => new kakao.maps.LatLng(it.lat, it.lng))
      if (dayCoords.length >= 2) {
        const b = new kakao.maps.LatLngBounds(); dayCoords.forEach((p) => b.extend(p)); mapInstance.setBounds(b)
      } else {
        mapInstance.panTo(target)
      }
    } else {
      // 이후 모든 이동(같은 날·다른 날 모두): panTo 로 부드럽게
      mapInstance.panTo(target)
    }
  }

  lastTourDay = activeDay
  lastTourActiveIdx = activeIdx
  applyHoverHighlight(hoveredItemId.value)
}

// 현재 좌표 구성의 지문. 동일하면 다시 그리지 않아 폴링 시 지도 깜빡임/점프를 막는다.
let lastSig = ''
// 마지막으로 화면을 맞춘(setBounds) 좌표 지문. 좌표가 바뀐 경우에만 다시 맞춘다.
// (경로 표시/숨김 토글은 좌표가 그대로이므로 화면이 움직이지 않는다)
let lastFitSig = ''
function routeSignature(items) {
  return items.map((i) => `${i.id}:${i.lat}:${i.lng}`).join('|')
}

function renderRoute() {
  if (!mapInstance || !window.kakao?.maps) return
  if (props.showAll && ui.tourMode) { renderTour(); return } // 둘러보기 모드는 별도 렌더
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
    const dragIso = ui.draggingDayIso
    Object.entries(byDay).forEach(([iso, { dayIdx, items: dItems, pts: dPts }]) => {
      // 경로 숨김 처리된 날짜는 핀과 경로를 모두 그리지 않는다.
      if (ui.routeHiddenDays[iso]) return
      const color = dayColorFor(dayIdx)
      const isDrag = dragIso && iso === dragIso
      const dim = dragIso && iso !== dragIso // 드래그 중엔 다른 날 디밍
      // 드래그 중인 날의 동선 품질 → 색/연출
      const quality = isDrag ? routeQuality(dItems) : null
      const qColor = quality ? QUALITY_COLOR[quality.status] : null

      dItems.forEach((it, i) => {
        const el = buildPinEl(it._globalNum, it.name, it.id, qColor || color.pin)
        if (dim) el.style.opacity = '0.25'
        const ov = new kakao.maps.CustomOverlay({ position: dPts[i], content: el, yAnchor: 1, xAnchor: 0.5, zIndex: isDrag ? 6 : 3 })
        ov.setMap(mapInstance)
        overlays.push({ itemId: it.id, overlay: ov, el })
      })

      if (dPts.length >= 2) {
        const strokeColor = qColor || color.pin
        // 구간별 폴리라인 — fromId 로 이동거리 hover 하이라이트 식별, baseColor 는 해당 Day 색
        for (let i = 0; i < dPts.length - 1; i++) {
          const pl = new kakao.maps.Polyline({
            path: [dPts[i], dPts[i + 1]],
            strokeWeight: isDrag ? 5 : 3,
            strokeColor,
            strokeOpacity: dim ? 0.2 : (isDrag ? 1 : 0.85),
            strokeStyle: isDrag && quality.status === 'good' ? 'solid' : 'shortdash',
          })
          pl.setMap(mapInstance)
          polylines.push({ pl, color: strokeColor, baseColor: color.pin, fromId: dItems[i].id, dayIdx })
          if (isDrag && quality.status === 'bad') blinkPolyline(pl)
        }
        // 드래그 품질 배지(날 단위 1회)
        if (isDrag && quality.status === 'bad') {
          const mid = worstLegMidpoint(dItems)
          if (mid) addFeedbackBadge(mid, '⚠️', 'bad')
        } else if (isDrag && quality.status === 'good') {
          const mid = dPts[Math.floor(dPts.length / 2)]
          addFeedbackBadge({ lat: mid.getLat(), lng: mid.getLng() }, '✨', 'good')
        }
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
  // 좌표 구성이 바뀐 경우에만 화면을 다시 맞춘다. 단순 경로 토글 시에는 시점 고정.
  if (sig !== lastFitSig) {
    lastFitSig = sig
    if (pts.length === 1) {
      mapInstance.setCenter(pts[0])
      if (mapInstance.getLevel() > 5) mapInstance.setLevel(5)
    } else {
      const bounds = new kakao.maps.LatLngBounds()
      pts.forEach((p) => bounds.extend(p))
      mapInstance.setBounds(bounds)
    }
  }
  applyHoverHighlight(hoveredItemId.value)
}

// ── 드래그 미리보기 핀(드롭 전, 손 떼기 전) ──────────────────
let previewOverlay = null
let previewToken = 0 // 비동기 geocode 경쟁 방지 토큰
function clearPreviewPin() {
  previewToken++
  if (previewOverlay) { try { previewOverlay.setMap(null) } catch {} previewOverlay = null }
}
async function renderPreviewPin(p) {
  if (!mapInstance || !window.kakao?.maps || !p) { clearPreviewPin(); return }
  const token = ++previewToken
  let lat = p.lat
  let lng = p.lng
  // 검색 결과 등 좌표가 없는 아이템은 주소로 즉시 변환(캐시됨)
  if ((lat == null || lng == null) && p.address) {
    const c = await geocodeAddress(p.address)
    if (token !== previewToken) return // 그새 다른 아이템/종료로 바뀜
    if (!c) return
    lat = c.lat; lng = c.lng
  }
  if (lat == null || lng == null) return
  if (token !== previewToken) return
  // 기존 미리보기 제거(토큰은 유지)
  if (previewOverlay) { try { previewOverlay.setMap(null) } catch {} previewOverlay = null }
  const kakao = window.kakao
  const days = trip.days || []
  const idx = days.indexOf(p.dayIso)
  const color = dayColorFor(idx >= 0 ? idx : 0).pin
  const el = document.createElement('div')
  el.className = 'trip-map-pin trip-map-pin--preview'
  el.style.setProperty('--pin-color', color)
  el.innerHTML = `
    <div class="trip-map-pin__bubble" title="${p.name ?? ''}">+</div>
    <div class="trip-map-pin__tail"></div>
  `
  previewOverlay = new kakao.maps.CustomOverlay({
    position: new kakao.maps.LatLng(lat, lng),
    content: el, yAnchor: 1, xAnchor: 0.5, zIndex: 12,
  })
  previewOverlay.setMap(mapInstance)
  // 미리보기 위치가 현재 화면 밖이면 부드럽게 이동
  const bounds = mapInstance.getBounds()
  if (bounds && !bounds.contain(previewOverlay.getPosition())) {
    mapInstance.panTo(previewOverlay.getPosition())
  }
}

function applyHoverHighlight(id) {
  overlays.forEach(({ itemId, el }) => {
    if (el) el.classList.toggle('trip-map-pin--active', !!id && itemId === id)
  })
}

// 이동거리 hover: from 장소 id 가 일치하는 구간을 해당 Day 색으로 강조
function applyTransitHighlight(id) {
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null }
  polylines.forEach(({ pl, color, baseColor, fromId }) => {
    if (id != null && fromId === id) {
      pl.setOptions({ strokeWeight: 6, strokeColor: baseColor || color, strokeOpacity: 1, strokeStyle: 'solid' })
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
  clearPreviewPin()
  mapInstance = null
  if (animFrame) cancelAnimationFrame(animFrame)
})

watch(itemsMissingCoords, async (items) => {
  if (!items.length || !window.kakao?.maps?.services) return
  await resolveCoords(items)
  // 둘러보기 중에는 좌표/메타 보강으로 인한 재렌더를 막아 트레일 성장 애니메이션이
  // 같은 구간을 반복해서 다시 그리지 않도록 한다(둘러보기 렌더는 tourActiveId 만 구동).
  if (!ui.tourMode) renderRoute()
}, { deep: true })
// 둘러보기 중에는 deep 워치(좌표/메타 변동)로 renderTour 가 재호출되어 같은 선이
// 여러 번 그어지는 현상이 발생 → tourMode 일 때는 건너뛴다.
watch(positionedItems, () => { if (!ui.tourMode) renderRoute() }, { deep: true })
watch(selectedDate, () => { if (!ui.tourMode) renderRoute() })
watch(allDayItems, () => { if (props.showAll && !ui.tourMode) renderRoute() }, { deep: true })
watch(hoveredItemId, (id) => applyHoverHighlight(id))
// 드래그 미리보기 핀: 드래그 중 해당 Day 위에 올라오면 표시, 드롭/종료 시 제거
watch(() => ui.dragPreview, (p) => {
  if (p) renderPreviewPin(p)
  else clearPreviewPin()
}, { deep: true })
watch(hoveredTransitId, (id) => applyTransitHighlight(id))
// 드래그 시작/종료 시 라이브 연출(색/디밍/오버레이) 갱신 — 좌표 동일해도 강제 재렌더
watch(() => ui.draggingDayIso, () => {
  if (!props.showAll) return
  lastSig = ''
  renderRoute()
})
// 둘러보기 모드 진입/종료
watch(() => ui.tourMode, (on) => {
  if (!props.showAll) return
  if (on) {
    lastTourDay = null
    lastTourActiveIdx = -1
    renderTour()
  } else {
    clearTourAnim()
    lastSig = ''
    renderRoute()
  }
})
// 둘러보기 중 현재 장소 변경 → 트레일/카메라 갱신
watch(() => ui.tourActiveId, () => {
  if (props.showAll && ui.tourMode) renderTour()
})
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

/* 드래그 중 동선 품질 피드백 배지 (⚠️ 나쁨 / ✨ 좋음) */
.trip-fb {
  font-size: 26px;
  line-height: 1;
  pointer-events: none;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));
  will-change: transform, opacity;
}
.trip-fb--bad { animation: trip-fb-warn 0.6s ease-in-out infinite; }
.trip-fb--good { animation: trip-fb-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
@keyframes trip-fb-warn {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-4px) scale(1.18); }
}
@keyframes trip-fb-pop {
  0% { transform: scale(0.2); opacity: 0; }
  60% { transform: scale(1.35); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.trip-map-pin {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transform-origin: bottom center;
  transition: transform .2s ease;
  --pin-color: #00B7EB;
  /* 폴링 등으로 핀이 새로 그려질 때 부드럽게 등장 */
  animation: trip-pin-in .28s ease-out;
}
@keyframes trip-pin-in {
  from { opacity: 0; transform: translateY(4px) scale(0.92); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
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
/* 드래그 미리보기 핀(드롭 전) — 크게 + 펄스 */
.trip-map-pin--preview {
  transform: translateY(-8px) scale(1.45);
  z-index: 12 !important;
  pointer-events: none;
  animation: trip-pin-in .2s ease-out;
}
.trip-map-pin--preview .trip-map-pin__bubble {
  min-width: 38px;
  height: 38px;
  font-size: 22px;
  font-weight: 800;
  position: relative;
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--pin-color) 35%, transparent),
    0 8px 18px -2px color-mix(in srgb, var(--pin-color) 70%, transparent);
}
.trip-map-pin--preview .trip-map-pin__bubble::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 9999px;
  border: 2.5px solid var(--pin-color);
  animation: trip-ping 1.1s cubic-bezier(0, 0, 0.2, 1) infinite;
}
.trip-map-pin--preview .trip-map-pin__tail {
  height: 12px;
  width: 3px;
}

.trip-map-pin--active {
  transform: translateY(-4px) scale(1.12);
  z-index: 5 !important;
}
/* 둘러보기: 현재 장소 핑 펄스 */
.trip-map-pin--ping { transform: translateY(-4px) scale(1.18); }
.trip-map-pin--ping .trip-map-pin__bubble {
  position: relative;
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--pin-color) 30%, transparent),
    0 6px 14px -2px color-mix(in srgb, var(--pin-color) 70%, transparent);
}
.trip-map-pin--ping .trip-map-pin__bubble::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 9999px;
  border: 2px solid var(--pin-color);
  animation: trip-ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;
}
@keyframes trip-ping {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.4); opacity: 0; }
}
.trip-map-pin--active .trip-map-pin__bubble {
  filter: brightness(0.92);
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--pin-color) 25%, transparent),
    0 6px 14px -2px color-mix(in srgb, var(--pin-color) 65%, transparent);
}
</style>
