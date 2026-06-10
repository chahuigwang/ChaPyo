<script setup>
import { ref, watch } from 'vue'
import { X, MapPin, Phone, Heart, CalendarPlus, Loader2, Clock } from 'lucide-vue-next'
import { findCategory } from '@/types/itinerary'
import { useStorageStore } from '@/stores/storageStore'
import { placeService } from '@/api/placeService'
import PlaceMiniMap from '@/components/common/PlaceMiniMap.vue'

// item 이 null 이면 닫힘. 검색결과/타임라인 아이템 모두 받을 수 있다.
const props = defineProps({
  item: { type: Object, default: null },
  showAdd: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'add'])

const storage = useStorageStore()

const data = ref(null)
const loading = ref(false)
const error = ref(false)

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'

function placeIdOf(item) {
  const raw = item?.placeId ?? item?.sourceId ?? item?.id
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

// 열릴 때 기본 정보 즉시 표시 후 GET /places/{placeId} 로 개요/전화/좌표 보강
watch(() => props.item, async (item) => {
  if (!item) { data.value = null; return }
  data.value = { ...item }
  error.value = false
  const pid = placeIdOf(item)
  if (!pid) return
  loading.value = true
  try {
    const d = await placeService.detail(pid)
    if (placeIdOf(props.item) !== pid) return
    if (!d) { error.value = true; return }
    data.value = {
      ...data.value,
      address: d.addr1 || data.value.address,
      overview: d.overview ?? data.value.overview,
      tel: d.tel || data.value.tel || '',
      firstImage: d.firstImage1 || data.value.firstImage,
      lat: d.latitude != null ? Number(d.latitude) : data.value.lat,
      lng: d.longitude != null ? Number(d.longitude) : data.value.lng,
    }
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}, { immediate: true })
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="data"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click.self="emit('close')"
      >
        <div class="relative w-full max-w-3xl max-h-[88vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col sm:flex-row overflow-y-auto sm:overflow-hidden">
          <!-- Close -->
          <button
            @click="emit('close')"
            class="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-black/35 hover:bg-black/60 text-white backdrop-blur-sm transition-colors"
          >
            <X :size="16" />
          </button>

          <!-- Left: info -->
          <div class="flex flex-col sm:w-[55%] sm:min-h-0">
            <!-- Image -->
            <div class="relative w-full h-44 sm:h-52 shrink-0 bg-slate-100 dark:bg-slate-800">
              <img
                v-if="data.firstImage"
                :src="data.firstImage"
                :alt="data.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                <MapPin :size="32" />
              </div>
            </div>

            <!-- Scrollable content -->
            <div class="p-5 space-y-3 sm:flex-1 sm:overflow-y-auto">
              <div class="flex items-start gap-3">
                <div class="text-2xl leading-none mt-0.5">{{ findCategory(data.category)?.emoji }}</div>
                <div class="min-w-0 flex-1">
                  <h3 class="text-[17px] font-bold text-slate-900 dark:text-slate-100 leading-snug">{{ data.name }}</h3>
                  <p class="mt-0.5 text-[12px] text-slate-400 dark:text-slate-500">{{ findCategory(data.category)?.label }}</p>
                </div>
              </div>

              <!-- 일정 정보(타임라인 아이템) -->
              <div v-if="data.time || data.cost" class="flex items-center gap-3 text-[12px] text-slate-500 dark:text-slate-400">
                <span v-if="data.time" class="inline-flex items-center gap-1">
                  <Clock :size="13" class="text-slate-400" /> {{ data.time }}
                </span>
                <span v-if="data.cost" class="font-semibold text-primary">{{ won(data.cost) }}</span>
              </div>

              <div
                v-if="loading && !(data.overview || data.description)"
                class="flex items-center gap-1.5 text-[12px] text-slate-400"
              >
                <Loader2 :size="13" class="animate-spin" /> 상세 정보 불러오는 중…
              </div>
              <p v-else-if="data.overview || data.description" class="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {{ data.overview ?? data.description }}
              </p>
              <div v-else-if="error" class="text-[12px] text-slate-400 dark:text-slate-500">
                상세 정보를 불러오지 못했어요.
              </div>

              <!-- 메모 -->
              <div v-if="data.memo">
                <div class="text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1">메모</div>
                <p class="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
                  {{ data.memo }}
                </p>
              </div>

              <div v-if="data.address" class="flex items-start gap-1.5 text-[12px] text-slate-500 dark:text-slate-400">
                <MapPin :size="13" class="shrink-0 text-slate-400 mt-0.5" />
                <span>{{ data.address }}</span>
              </div>

              <div v-if="data.tel" class="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-slate-400">
                <Phone :size="13" class="shrink-0 text-slate-400" />
                <span>{{ data.tel }}</span>
              </div>

              <div v-if="storage.likeCountOf(data) > 0" class="flex items-center gap-1 text-[12px] text-slate-400">
                <Heart :size="12" class="fill-red-400 text-red-400" />
                {{ storage.likeCountOf(data).toLocaleString() }}
              </div>

              <div class="flex gap-2 pt-1">
                <button
                  @click="storage.toggleLike(data)"
                  class="flex-1 h-10 rounded-xl text-[13px] font-semibold transition-colors flex items-center justify-center gap-2"
                  :class="storage.isLiked(data)
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'"
                >
                  <Heart :size="14" :class="storage.isLiked(data) ? 'fill-red-500' : ''" />
                  {{ storage.isLiked(data) ? '좋아요 취소' : '좋아요' }}
                </button>
                <button
                  v-if="showAdd"
                  @click="emit('add', item)"
                  class="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
                >
                  <CalendarPlus :size="15" /> 일정에 추가
                </button>
              </div>
            </div>
          </div>

          <!-- Right: map (패딩으로 정보 영역과 구분) -->
          <div class="sm:w-[45%] shrink-0 p-3 sm:pl-1.5">
            <div class="h-64 sm:h-full sm:min-h-[316px] rounded-xl overflow-hidden ring-1 ring-slate-200/70 dark:ring-slate-700/60">
              <PlaceMiniMap :lat="data.lat ?? null" :lng="data.lng ?? null" :name="data.name" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
