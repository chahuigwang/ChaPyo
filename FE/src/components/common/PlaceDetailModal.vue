<script setup>
import { ref, computed, watch } from 'vue'
import { X, MapPin, Phone, Heart, CalendarPlus, Loader2, UserRound, Check, Star } from 'lucide-vue-next'
import { findCategory } from '@/types/itinerary'
import { useStorageStore } from '@/stores/storageStore'
import { placeService } from '@/api/placeService'
import PlaceMiniMap from '@/components/common/PlaceMiniMap.vue'
import PlaceReviews from '@/components/common/PlaceReviews.vue'

// item 이 null 이면 닫힘. 검색결과/타임라인 아이템 모두 받을 수 있다.
const props = defineProps({
  item: { type: Object, default: null },
  showAdd: { type: Boolean, default: false },
  editable: { type: Boolean, default: false }, // 타임라인 아이템이면 메모/비용 편집
})
const emit = defineEmits(['close', 'add', 'save'])

const storage = useStorageStore()

const data = ref(null)
const loading = ref(false)
const error = ref(false)

// 편집용 드래프트(메모/비용)
const memoDraft = ref('')
const costDraft = ref(0)
function saveEdit() {
  emit('save', { memo: (memoDraft.value || '').trim(), cost: Number(costDraft.value) || 0 })
  emit('close')
}

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'

function placeIdOf(item) {
  const raw = item?.placeId ?? item?.sourceId ?? item?.id
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

const reviewPlaceId = computed(() => placeIdOf(props.item))

// 리뷰 평점/개수 — 평점이 있을 때만 노출, 개수 필드가 오면 함께 표시
const avgRating = computed(() => {
  const v = Number(data.value?.avgRating)
  return Number.isFinite(v) && v > 0 ? v : null
})
const ratingText = computed(() => (avgRating.value != null ? avgRating.value.toFixed(1) : ''))
const reviewCount = computed(() => {
  const v = Number(data.value?.reviewCount)
  return Number.isFinite(v) ? v : null
})

// 리뷰 작성/수정/삭제 시 모달 헤더와 원본 아이템(검색/좋아요/AI 카드)에 즉시 반영
function onReviewsChanged({ avgRating: avg, reviewCount: cnt }) {
  if (data.value) {
    data.value.avgRating = avg
    data.value.reviewCount = cnt
  }
  if (props.item && typeof props.item === 'object') {
    props.item.avgRating = avg
    props.item.reviewCount = cnt
  }
}

// 열릴 때 기본 정보 즉시 표시 후 GET /places/{placeId} 로 개요/전화/좌표 보강
watch(() => props.item, async (item) => {
  if (!item) { data.value = null; return }
  data.value = { ...item }
  memoDraft.value = item.memo || ''
  costDraft.value = item.cost || 0
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
      avgRating: d.avgRating ?? data.value.avgRating,
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
        <div class="relative w-full max-w-5xl max-h-[88vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col sm:flex-row overflow-y-auto sm:overflow-hidden">
          <!-- Close -->
          <button
            @click="emit('close')"
            class="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-black/35 hover:bg-black/60 text-white backdrop-blur-sm transition-colors"
          >
            <X :size="16" />
          </button>

          <!-- Left: info -->
          <div class="flex flex-col sm:w-[42%] sm:min-h-0">
            <!-- Image -->
            <div class="relative w-full h-44 sm:h-52 shrink-0 bg-slate-100 dark:bg-slate-800">
              <img
                v-if="data.firstImage"
                :src="data.firstImage"
                :alt="data.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-[13px] text-slate-400 dark:text-slate-500 select-none">
                이미지가 없습니다
              </div>
            </div>

            <!-- Scrollable content -->
            <div class="p-5 space-y-3 sm:flex-1 sm:overflow-y-auto">
              <div class="flex items-start gap-3">
                <div class="text-2xl leading-none mt-0.5">{{ findCategory(data.category)?.emoji }}</div>
                <div class="min-w-0 flex-1">
                  <h3 class="text-[17px] font-bold text-slate-900 dark:text-slate-100 leading-snug">{{ data.name }}</h3>
                  <p class="mt-0.5 text-[12px] text-slate-400 dark:text-slate-500">{{ findCategory(data.category)?.label }}</p>
                  <div v-if="avgRating != null" class="mt-1 flex items-center gap-1 text-[12px]">
                    <Star :size="13" class="fill-amber-400 text-amber-400" />
                    <span class="font-bold text-slate-700 dark:text-slate-200">{{ ratingText }}</span>
                    <span v-if="reviewCount != null" class="text-slate-400">· 리뷰 {{ reviewCount.toLocaleString() }}</span>
                  </div>
                </div>
                <!-- 좋아요 (이름/카테고리 줄 오른쪽 끝) -->
                <button
                  @click="storage.toggleLike(data)"
                  class="shrink-0 h-9 w-9 rounded-xl flex items-center justify-center transition-colors"
                  :class="storage.isLiked(data)
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-slate-200'"
                  :title="storage.isLiked(data) ? '좋아요 취소' : '좋아요'"
                >
                  <Heart :size="18" :class="storage.isLiked(data) ? 'fill-red-500' : ''" />
                </button>
              </div>

              <!-- 추가한 사람 -->
              <div v-if="data.nickname" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[12px] font-semibold">
                <UserRound :size="13" /> {{ data.nickname }} 님이 추가
              </div>

              <!-- 일정 정보(읽기 전용) -->
              <div v-if="!editable && data.cost" class="flex items-center gap-3 text-[12px] text-slate-500 dark:text-slate-400">
                <span class="font-semibold text-primary">{{ won(data.cost) }}</span>
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

              <!-- 메모 (읽기 전용) -->
              <div v-if="!editable && data.memo">
                <div class="text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1">메모</div>
                <p class="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
                  {{ data.memo }}
                </p>
              </div>

              <!-- 비용/메모 편집 (타임라인 아이템) -->
              <div v-if="editable" class="space-y-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <label class="block">
                  <span class="text-[11px] font-medium text-slate-400 dark:text-slate-500">비용 (원)</span>
                  <input
                    v-model.number="costDraft"
                    type="number" min="0" placeholder="0"
                    class="mt-1 w-full h-9 rounded-lg bg-white dark:bg-slate-900 px-3 text-[13px]
                           text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </label>
                <label class="block">
                  <span class="text-[11px] font-medium text-slate-400 dark:text-slate-500">메모</span>
                  <textarea
                    v-model="memoDraft"
                    rows="3" placeholder="추천 메뉴, 예약 정보 등"
                    class="mt-1 w-full rounded-lg bg-white dark:bg-slate-900 px-3 py-2 text-[13px]
                           text-slate-900 dark:text-slate-100 resize-none outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </label>
                <button
                  @click="saveEdit"
                  class="w-full h-9 rounded-lg bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check :size="14" /> 저장
                </button>
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

              <div v-if="showAdd" class="pt-1">
                <button
                  @click="emit('add', item)"
                  class="w-full h-10 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
                >
                  <CalendarPlus :size="15" /> 일정에 추가
                </button>
              </div>

              <!-- 리뷰 -->
              <div v-if="reviewPlaceId" class="pt-2 border-t border-slate-100 dark:border-slate-800">
                <PlaceReviews :place-id="reviewPlaceId" @changed="onReviewsChanged" />
              </div>
            </div>
          </div>

          <!-- Right: map (패딩으로 정보 영역과 구분) -->
          <div class="sm:w-[58%] shrink-0 p-3 sm:pl-1.5">
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
