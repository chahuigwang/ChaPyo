<script setup>
import { storeToRefs } from 'pinia'
import { Search, Plus, X, MapPin, Loader2 } from 'lucide-vue-next'
import { useSearchStore, PROVINCES, PLACE_TYPES } from '@/stores/searchStore'
import { useStorageStore } from '@/stores/storageStore'
import { useChatStore } from '@/stores/chatStore'
import { findCategory } from '@/types/itinerary'

const search = useSearchStore()
const storage = useStorageStore()
const chat = useChatStore()
const { keyword, provinceId, districtId, typeId, results, loading, searched, districts } = storeToRefs(search)

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'

function onSubmit() {
  search.search()
}
function addToStorage(item) {
  storage.addItem({
    name: item.name,
    category: item.category,
    memo: item.address,
    cost: item.cost,
  })
  chat.pushSystemNotice?.(`"${item.name}"을(를) 보관함에 추가했어요.`)
}
function clearAll() {
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
        <option value="">관광지 타입 전체</option>
        <option v-for="t in PLACE_TYPES" :key="t.id" :value="t.id">{{ t.label }}</option>
      </select>
    </section>

    <span class="mx-5 h-px bg-slate-100 dark:bg-slate-800" />

    <!-- Bottom: Results -->
    <div class="flex-1 overflow-y-auto px-4 py-3 space-y-2">
      <div
        v-if="loading"
        class="flex items-center justify-center py-10 text-[12px] text-slate-400"
      >
        <Loader2 :size="14" class="animate-spin mr-2" /> 검색 중…
      </div>

      <template v-else>
        <div
          v-for="item in results"
          :key="item.id"
          class="group rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5 flex items-start gap-2.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
        >
          <span class="text-base shrink-0 mt-0.5">{{ findCategory(item.category).emoji }}</span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="text-[12px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                {{ item.name }}
              </span>
              <span class="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                {{ findCategory(item.category).label }}
              </span>
            </div>
            <div class="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              <MapPin :size="10" class="shrink-0" />
              <span class="truncate">{{ item.address }}</span>
            </div>
            <div v-if="item.cost" class="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
              ₩ {{ won(item.cost) }}
            </div>
          </div>
          <button
            @click="addToStorage(item)"
            class="shrink-0 inline-flex items-center gap-1 px-2 h-7 rounded-md bg-white dark:bg-slate-900 text-primary text-[11px] font-medium hover:bg-primary hover:text-primary-foreground shadow-sm transition-colors"
            title="보관함에 추가"
          >
            <Plus :size="11" /> 보관
          </button>
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
