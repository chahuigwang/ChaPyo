<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { Search, X, MapPin, Loader2, RotateCcw, Heart, CalendarPlus, ChevronDown } from 'lucide-vue-next'
import { useSearchStore, PROVINCES, PLACE_TYPE_GROUPS } from '@/stores/searchStore'
import { useStorageStore } from '@/stores/storageStore'
import { useChatStore } from '@/stores/chatStore'
import { useTripStore } from '@/stores/tripStore'
import { findCategory } from '@/types/itinerary'
import DiscoverPlaceCard from '@/components/common/DiscoverPlaceCard.vue'

const search = useSearchStore()
const storage = useStorageStore()
const chat = useChatStore()
const trip = useTripStore()

function onSearchDragStart(e, item) {
  storage.setDragging({ source: 'search', item })
  try { e.dataTransfer.effectAllowed = 'copy'; e.dataTransfer.setData('text/plain', item.id) } catch {}
}
function onSearchDragEnd() { storage.clearDragging() }
const { keyword, provinceId, districtId, typeId, results, hasNext, loading, searched, searchError, districts } = storeToRefs(search)

const currentPage = ref(0)
const observerTarget = ref(null)
let observer = null

function onSubmit() {
  currentPage.value = 0
  search.search(0)
}

function onLoadMore() {
  // 이미 로딩 중이거나 다음 페이지가 없으면 중단
  if (loading.value || !hasNext.value) return
  
  const next = currentPage.value + 1
  currentPage.value = next
  search.search(next)
}

// IntersectionObserver 설정
onMounted(() => {
  document.addEventListener('mousedown', onCategoryOutside)
  document.addEventListener('mousedown', onProvinceOutside)
  document.addEventListener('mousedown', onDistrictOutside)
  if (!search.searched) nextTick(() => search.search(0))
  observer = new IntersectionObserver((entries) => {
    const target = entries[0]
    if (target.isIntersecting && hasNext.value && !loading.value) {
      onLoadMore()
    }
  }, {
    root: null,
    rootMargin: '100px',
    threshold: 0
  })

  if (observerTarget.value) {
    observer.observe(observerTarget.value)
  }
})

watch(observerTarget, (newVal) => {
  if (observer) {
    observer.disconnect()
    if (newVal) observer.observe(newVal)
  }
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onCategoryOutside)
  document.removeEventListener('mousedown', onProvinceOutside)
  document.removeEventListener('mousedown', onDistrictOutside)
  if (observer) observer.disconnect()
})



function addToItinerary(item) {
  const date = trip.selectedDate ?? trip.days?.[0] ?? null
  if (!date) return
  trip.addItemToDate(date, {
    name: item.name,
    category: item.category,
    memo: item.memo || '',
    address: item.address || '',
    cost: item.cost ?? 0,
    lat: item.lat,
    lng: item.lng,
    firstImage: item.firstImage,
  })
}
function clearAll() {
  currentPage.value = 0
  search.resetFilters()
}

const detailItem = ref(null)

// ── Province custom dropdown ─────────────────────────────────
const provinceOpen = ref(false)
const provinceRef = ref(null)
const provinceTriggerRef = ref(null)
const selectedProvinceLabel = computed(() =>
  PROVINCES.find((p) => p.id === provinceId.value)?.label ?? '시/도 전체',
)
function selectProvince(id) { search.setProvince(id); provinceOpen.value = false }

// ── District custom dropdown ─────────────────────────────────
const districtOpen = ref(false)
const districtRef = ref(null)
const districtTriggerRef = ref(null)
const selectedDistrictLabel = computed(() =>
  districts.value.find((d) => d.id === districtId.value)?.label ?? '구/군 전체',
)
function selectDistrict(id) { search.setDistrict(id); districtOpen.value = false }

// ── Category custom dropdown ─────────────────────────────────
const categoryOpen = ref(false)
const categoryRef = ref(null)
const categoryTriggerRef = ref(null)

const selectedTypeLabel = computed(() => {
  if (!typeId.value) return '카테고리 전체'
  for (const g of PLACE_TYPE_GROUPS) {
    if (g.id === typeId.value) return g.label
    const child = g.children.find((c) => c.id === typeId.value)
    if (child) return child.label
  }
  return '카테고리 전체'
})

function selectType(id) {
  search.setType(id)
  categoryOpen.value = false
}

function onOutside(e, open, triggerRef, panelRef, cb) {
  if (!open.value) return
  if (triggerRef.value?.contains(e.target)) return
  if (panelRef.value?.contains(e.target)) return
  cb()
}

function onCategoryOutside(e) {
  onOutside(e, categoryOpen, categoryTriggerRef, categoryRef, () => { categoryOpen.value = false })
}
function onProvinceOutside(e) {
  onOutside(e, provinceOpen, provinceTriggerRef, provinceRef, () => { provinceOpen.value = false })
}
function onDistrictOutside(e) {
  onOutside(e, districtOpen, districtTriggerRef, districtRef, () => { districtOpen.value = false })
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <!-- Top: Search input -->
    <header class="px-5 pt-5 pb-3">
      <div class="flex items-center gap-2 mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-slate-100">장소 검색</h2>
      </div>

      <form @submit.prevent="onSubmit" class="flex items-center gap-2">
        <div class="relative flex-1">
          <Search :size="13" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="keyword"
            type="text"
            placeholder="키워드 (예: 한옥마을)"
            class="w-full h-9 pl-8 pr-3 text-[12px] rounded-md bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          type="submit"
          :disabled="loading"
          class="inline-flex items-center justify-center w-9 h-9 rounded-md bg-primary text-primary-foreground hover:bg-brand-600 disabled:opacity-60 transition-colors"
          title="검색"
        >
          <Loader2 v-if="loading" :size="16" class="animate-spin" />
          <Search v-else :size="16" />
        </button>
        <button
          type="button"
          @click="clearAll"
          class="inline-flex items-center justify-center w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          title="초기화"
        >
          <RotateCcw :size="15" />
        </button>
      </form>
    </header>

    <!-- Middle: Filters -->
    <section class="px-5 pb-3 space-y-2">
      <div class="grid grid-cols-2 gap-2">
        <!-- Province custom dropdown -->
        <div class="relative">
          <button
            ref="provinceTriggerRef"
            type="button"
            @click="provinceOpen = !provinceOpen"
            class="w-full h-8 px-2.5 text-[11px] rounded-md bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span class="truncate">{{ selectedProvinceLabel }}</span>
            <ChevronDown :size="10" class="shrink-0 text-slate-400 transition-transform duration-200" :class="provinceOpen ? 'rotate-180' : ''" />
          </button>
          <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 scale-95 -translate-y-1" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition-all duration-150 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 -translate-y-1">
            <div v-if="provinceOpen" ref="provinceRef" class="absolute left-0 top-full mt-1 z-50 w-48 max-h-52 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg shadow-xl py-1">
              <button type="button" @click="selectProvince('')" class="w-full text-left px-3 py-1.5 text-[11px] transition-colors" :class="!provinceId ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'">시/도 전체</button>
              <button v-for="p in PROVINCES" :key="p.id" type="button" @click="selectProvince(p.id)" class="w-full text-left px-3 py-1.5 text-[11px] transition-colors" :class="provinceId === p.id ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'">{{ p.label }}</button>
            </div>
          </Transition>
        </div>

        <!-- District custom dropdown -->
        <div class="relative">
          <button
            ref="districtTriggerRef"
            type="button"
            @click="provinceId && (districtOpen = !districtOpen)"
            class="w-full h-8 px-2.5 text-[11px] rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1 transition-colors"
            :class="provinceId ? 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer' : 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'"
          >
            <span class="truncate">{{ selectedDistrictLabel }}</span>
            <ChevronDown :size="10" class="shrink-0 text-slate-400 transition-transform duration-200" :class="districtOpen ? 'rotate-180' : ''" />
          </button>
          <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 scale-95 -translate-y-1" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition-all duration-150 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 -translate-y-1">
            <div v-if="districtOpen" ref="districtRef" class="absolute left-0 top-full mt-1 z-50 w-48 max-h-52 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg shadow-xl py-1">
              <button type="button" @click="selectDistrict('')" class="w-full text-left px-3 py-1.5 text-[11px] transition-colors" :class="!districtId ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'">구/군 전체</button>
              <button v-for="d in districts" :key="d.id" type="button" @click="selectDistrict(d.id)" class="w-full text-left px-3 py-1.5 text-[11px] transition-colors" :class="districtId === d.id ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'">{{ d.label }}</button>
            </div>
          </Transition>
        </div>
      </div>
      <!-- Category custom dropdown -->
      <div class="relative">
        <button
          ref="categoryTriggerRef"
          type="button"
          @click="categoryOpen = !categoryOpen"
          class="w-full h-8 px-3 text-[11px] rounded-md bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span class="truncate">{{ selectedTypeLabel }}</span>
          <ChevronDown :size="11" class="shrink-0 text-slate-400 transition-transform duration-200" :class="categoryOpen ? 'rotate-180' : ''" />
        </button>

        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-1"
        >
          <div
            v-if="categoryOpen"
            ref="categoryRef"
            class="absolute left-0 top-full mt-1 z-50 w-full max-h-56 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg shadow-xl py-1"
          >
            <button
              type="button"
              @click="selectType('')"
              class="w-full text-left px-3 py-1.5 text-[11px] transition-colors"
              :class="!typeId ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'"
            >카테고리 전체</button>
            <template v-for="group in PLACE_TYPE_GROUPS" :key="group.id">
              <div class="px-3 pt-2 pb-0.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{{ group.label }}</div>
              <button
                v-for="t in group.children"
                :key="t.id"
                type="button"
                @click="selectType(t.id)"
                class="w-full text-left px-3 py-1.5 text-[11px] transition-colors pl-5"
                :class="typeId === t.id ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'"
              >{{ t.label }}</button>
            </template>
          </div>
        </Transition>
      </div>
    </section>

    <span class="mx-5 h-px bg-slate-100 dark:bg-slate-800" />

    <!-- Bottom: Results -->
    <div class="flex-1 overflow-y-auto px-4 py-3 space-y-2">
      
      <div
        v-if="loading && results.length === 0"
        class="flex items-center justify-center py-10 text-[12px] text-slate-400"
      >
        <Loader2 :size="14" class="animate-spin mr-2" /> 검색 중…
      </div>

      <template v-else>

        <DiscoverPlaceCard
          v-for="item in results"
          :key="item.id"
          :item="item"
          :draggable="true"
          @detail="detailItem = $event"
          @dragstart="onSearchDragStart($event, item)"
          @dragend="onSearchDragEnd"
        />

        <div ref="observerTarget" class="h-4 w-full" />

        <div v-if="loading && results.length > 0" class="flex items-center justify-center py-4 text-[12px] text-slate-400">
          <Loader2 :size="14" class="animate-spin mr-2" /> 추가 장소 불러오는 중…
        </div>
        
        <div
          v-if="searchError"
          class="rounded-xl bg-red-50 dark:bg-red-900/20 p-8 text-center text-[12px] text-red-500 dark:text-red-400 shadow-inner"
        >
          {{ searchError }}
        </div>
        <div
          v-else-if="searched && !results.length"
          class="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-10 text-center text-[12px] text-slate-500 dark:text-slate-400 shadow-inner"
        >
          조건에 맞는 장소가 없습니다.
        </div>
        <div
          v-else-if="!searched"
          class="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-10 text-center text-[12px] text-slate-400 dark:text-slate-500 shadow-inner"
        >
          키워드와 필터로 장소를 찾아보세요.
        </div>
      </template>
    </div>     
    <!-- Detail modal overlay -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="detailItem"
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          @click.self="detailItem = null"
        >
          <div class="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
            <!-- Image -->
            <div class="relative w-full h-48 bg-slate-100 dark:bg-slate-800">
              <img
                v-if="detailItem.firstImage"
                :src="detailItem.firstImage"
                :alt="detailItem.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                <MapPin :size="32" />
              </div>
              <button
                @click="detailItem = null"
                class="absolute top-3 right-3 p-1.5 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition-colors"
              >
                <X :size="14" />
              </button>
            </div>

            <!-- Content -->
            <div class="p-5 space-y-3">
              <div class="flex items-start gap-3">
                <div class="text-2xl leading-none mt-0.5">{{ findCategory(detailItem.category)?.emoji }}</div>
                <div class="min-w-0 flex-1">
                  <h3 class="text-[16px] font-bold text-slate-900 dark:text-slate-100 leading-snug">{{ detailItem.name }}</h3>
                  <p class="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{{ findCategory(detailItem.category)?.label }}</p>
                </div>
              </div>

              <div v-if="detailItem.overview || detailItem.description" class="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
                {{ detailItem.overview ?? detailItem.description }}
              </div>

              <div class="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <MapPin :size="12" class="shrink-0 text-slate-400" />
                <span>{{ detailItem.address }}</span>
              </div>

              <div v-if="detailItem.likeCount > 0" class="flex items-center gap-1 text-[11px] text-slate-400">
                <Heart :size="11" class="fill-red-400 text-red-400" />
                {{ detailItem.likeCount.toLocaleString() }}
              </div>

              <div class="flex gap-2">
                <button
                  @click="storage.toggleLike(detailItem)"
                  class="flex-1 h-10 rounded-xl text-[13px] font-semibold transition-colors flex items-center justify-center gap-2"
                  :class="storage.isLiked(detailItem)
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'"
                >
                  <Heart :size="14" :class="storage.isLiked(detailItem) ? 'fill-red-500' : ''" />
                  {{ storage.isLiked(detailItem) ? '좋아요 취소' : '좋아요' }}
                </button>
                <button
                  @click="addToItinerary(detailItem); detailItem = null"
                  class="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
                >
                  <CalendarPlus :size="15" /> 일정에 추가
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
