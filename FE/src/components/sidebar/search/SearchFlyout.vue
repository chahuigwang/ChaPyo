<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Search, Plus, X, MapPin, Loader2 } from 'lucide-vue-next'
import { useSearchStore, PROVINCES, PLACE_TYPE_GROUPS } from '@/stores/searchStore'
import { useStorageStore } from '@/stores/storageStore'
import { useChatStore } from '@/stores/chatStore'
import { findCategory } from '@/types/itinerary'
import SearchResultItem from './SearchResultItem.vue'

const search = useSearchStore()
const storage = useStorageStore()
const chat = useChatStore()
const { keyword, provinceId, districtId, typeId, results, hasNext, loading, searched, districts } = storeToRefs(search)

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
  if (observer) observer.disconnect()
})



function addToStorage(item) {
  storage.addItem({
    name: item.name,
    category: item.category,
    memo: item.address,
    cost: 0,
  })
  chat.pushSystemNotice?.(`"${item.name}"을(를) 보관함에 추가했어요.`)
}
function clearAll() {
  currentPage.value = 0
  search.resetFilters()
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <!-- Top: Search input -->
    <header class="px-5 pt-5 pb-3">
      <div class="flex items-center gap-2 mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-slate-100">장소 검색</h2>
        <button
          @click="clearAll"
          class="ml-auto inline-flex items-center gap-1 px-2 h-7 rounded-md text-[11px] text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="초기화"
        >
          <X :size="11" /> 초기화
        </button>
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
          class="inline-flex items-center gap-1 px-3 h-9 rounded-md bg-primary text-primary-foreground text-[12px] font-medium hover:bg-brand-600 disabled:opacity-60 transition-colors"
        >
          <Loader2 v-if="loading" :size="12" class="animate-spin" />
          <Search v-else :size="12" />
          검색
        </button>
      </form>
    </header>

    <!-- Middle: Filters -->
    <section class="px-5 pb-3 space-y-2">
      <div class="grid grid-cols-2 gap-2">
        <select
          :value="provinceId"
          @change="search.setProvince($event.target.value)"
          class="h-8 px-2 text-[11px] rounded-md bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">시/도 전체</option>
          <option v-for="p in PROVINCES" :key="p.id" :value="p.id">{{ p.label }}</option>
        </select>
        <select
          :value="districtId"
          @change="search.setDistrict($event.target.value)"
          :disabled="!provinceId"
          class="h-8 px-2 text-[11px] rounded-md bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
        >
          <option value="">구/군 전체</option>
          <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.label }}</option>
        </select>
      </div>
      <select
        :value="typeId"
        @change="search.setType($event.target.value)"
        class="w-full h-8 px-2 text-[11px] rounded-md bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="">카테고리 전체</option>
        <optgroup v-for="group in PLACE_TYPE_GROUPS" :key="group.id" :label="group.label">
          <option v-for="t in group.children" :key="t.id" :value="t.id">{{ t.label }}</option>
        </optgroup>
      </select>
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

        <SearchResultItem
          v-for="item in results"
          :key="item.id"
          :item="item"
          @add="addToStorage"
        />

        <div ref="observerTarget" class="h-4 w-full" />

        <div v-if="loading && results.length > 0" class="flex items-center justify-center py-4 text-[12px] text-slate-400">
          <Loader2 :size="14" class="animate-spin mr-2" /> 추가 장소 불러오는 중…
        </div>
        
        <div
          v-if="searched && !results.length"
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
