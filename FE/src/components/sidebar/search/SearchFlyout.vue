<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { Search, X, Loader2, RotateCcw, ChevronDown } from 'lucide-vue-next'
import { useSearchStore, PROVINCES, PLACE_TYPE_GROUPS, SORT_OPTIONS } from '@/stores/searchStore'
import { useUiStore } from '@/stores/uiStore'
import draggable from 'vuedraggable'
import DiscoverPlaceCard from '@/components/common/DiscoverPlaceCard.vue'
import { useDragPreview } from '@/composables/useDragPreview'

const search = useSearchStore()
const ui = useUiStore()
const { onMove, onDragPreviewEnd } = useDragPreview()

// 플라이아웃 → 타임라인 clone 시 원본 참조 공유 방지 (얕은 복사본을 일정으로 삽입)
function cloneCard(item) { return { ...item } }
const { keyword, provinceId, districtId, typeId, sortBy, results, hasNext, loading, searched, searchError, districts } = storeToRefs(search)

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
  document.addEventListener('mousedown', onSortOutside)
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
  document.removeEventListener('mousedown', onSortOutside)
  if (observer) observer.disconnect()
})



function clearAll() {
  currentPage.value = 0
  search.resetFilters()
}

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

// ── Sort custom dropdown ─────────────────────────────────────
const sortOpen = ref(false)
const sortRef = ref(null)
const sortTriggerRef = ref(null)

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
function onSortOutside(e) {
  onOutside(e, sortOpen, sortTriggerRef, sortRef, () => { sortOpen.value = false })
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
            class="w-full h-9 pl-8 pr-3 text-[13px] rounded-md bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/30"
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
            class="w-full h-9 px-2.5 text-[13px] rounded-md bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span class="truncate">{{ selectedProvinceLabel }}</span>
            <ChevronDown :size="10" class="shrink-0 text-slate-400 transition-transform duration-200" :class="provinceOpen ? 'rotate-180' : ''" />
          </button>
          <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 scale-95 -translate-y-1" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition-all duration-150 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 -translate-y-1">
            <div v-if="provinceOpen" ref="provinceRef" class="absolute left-0 top-full mt-1 z-50 w-48 max-h-52 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg shadow-xl py-1">
              <button type="button" @click="selectProvince('')" class="w-full text-left px-3 py-1.5 text-[13px] transition-colors" :class="!provinceId ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'">시/도 전체</button>
              <button v-for="p in PROVINCES" :key="p.id" type="button" @click="selectProvince(p.id)" class="w-full text-left px-3 py-1.5 text-[13px] transition-colors" :class="provinceId === p.id ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'">{{ p.label }}</button>
            </div>
          </Transition>
        </div>

        <!-- District custom dropdown -->
        <div class="relative">
          <button
            ref="districtTriggerRef"
            type="button"
            @click="provinceId && (districtOpen = !districtOpen)"
            class="w-full h-9 px-2.5 text-[13px] rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1 transition-colors"
            :class="provinceId ? 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer' : 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'"
          >
            <span class="truncate">{{ selectedDistrictLabel }}</span>
            <ChevronDown :size="10" class="shrink-0 text-slate-400 transition-transform duration-200" :class="districtOpen ? 'rotate-180' : ''" />
          </button>
          <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 scale-95 -translate-y-1" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition-all duration-150 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 -translate-y-1">
            <div v-if="districtOpen" ref="districtRef" class="absolute left-0 top-full mt-1 z-50 w-48 max-h-52 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg shadow-xl py-1">
              <button type="button" @click="selectDistrict('')" class="w-full text-left px-3 py-1.5 text-[13px] transition-colors" :class="!districtId ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'">구/군 전체</button>
              <button v-for="d in districts" :key="d.id" type="button" @click="selectDistrict(d.id)" class="w-full text-left px-3 py-1.5 text-[13px] transition-colors" :class="districtId === d.id ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'">{{ d.label }}</button>
            </div>
          </Transition>
        </div>
      </div>
      <!-- Category + Sort (같은 비율 grid-cols-2) -->
      <div class="grid grid-cols-2 gap-2">
        <!-- Category custom dropdown -->
        <div class="relative">
          <button
            ref="categoryTriggerRef"
            type="button"
            @click="categoryOpen = !categoryOpen"
            class="w-full h-9 px-3 text-[13px] rounded-md bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
              class="absolute left-0 top-full mt-1 z-50 w-48 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg shadow-xl py-1"
            >
              <button
                type="button"
                @click="selectType('')"
                class="w-full text-left px-3 py-1.5 text-[13px] transition-colors"
                :class="!typeId ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'"
              >카테고리 전체</button>
              <template v-for="group in PLACE_TYPE_GROUPS" :key="group.id">
                <button
                  type="button"
                  @click="selectType(group.id)"
                  class="w-full text-left px-3 pt-2 pb-0.5 text-[13px] font-bold tracking-wider transition-colors"
                  :class="typeId === group.id
                    ? 'text-primary'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'"
                >{{ group.label }} <span class="font-normal text-[13px] opacity-70">전체</span></button>
                <button
                  v-for="t in group.children"
                  :key="t.id"
                  type="button"
                  @click="selectType(t.id)"
                  class="w-full text-left px-3 py-1.5 text-[13px] transition-colors pl-5"
                  :class="typeId === t.id ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'"
                >{{ t.label }}</button>
              </template>
            </div>
          </Transition>
        </div>

        <!-- Sort custom dropdown -->
        <div class="relative">
          <button
            ref="sortTriggerRef"
            type="button"
            @click="sortOpen = !sortOpen"
            class="w-full h-9 px-2.5 text-[13px] rounded-md bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span class="truncate">{{ SORT_OPTIONS.find(o => o.value === sortBy)?.label }}</span>
            <ChevronDown :size="10" class="shrink-0 text-slate-400 transition-transform duration-200" :class="sortOpen ? 'rotate-180' : ''" />
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
              v-if="sortOpen"
              ref="sortRef"
              class="absolute left-0 top-full mt-1 z-50 w-full bg-white dark:bg-slate-900 rounded-lg shadow-xl py-1"
            >
              <button
                v-for="opt in SORT_OPTIONS"
                :key="opt.value"
                type="button"
                @click="search.setSortBy(opt.value); sortOpen = false; onSubmit()"
                class="w-full text-left px-3 py-1.5 text-[13px] transition-colors"
                :class="sortBy === opt.value ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'"
              >{{ opt.label }}</button>
            </div>
          </Transition>
        </div>
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

        <!-- 드래그 온보딩 힌트 (결과가 있을 때만) -->
        <div v-if="results.length" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/8 dark:bg-primary/15 mb-1">
          <span class="text-[11px] text-primary font-medium">💡 카드를 오른쪽 일정 패널로 드래그하면 추가돼요</span>
        </div>

        <draggable
          :list="results"
          item-key="id"
          :group="{ name: 'itinerary', pull: 'clone', put: false }"
          :sort="false"
          :clone="cloneCard"
          :move="onMove"
          @end="onDragPreviewEnd"
          class="flex flex-col gap-3"
        >
          <template #item="{ element: item }">
            <DiscoverPlaceCard
              :item="item"
              :draggable="true"
              @detail="ui.setFocusedPlace($event, { editable: false })"
            />
          </template>
        </draggable>

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
