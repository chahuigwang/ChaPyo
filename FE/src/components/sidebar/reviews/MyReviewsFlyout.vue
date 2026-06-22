<script setup>
import { ref, onMounted } from 'vue'
import { Star, Loader2, MessageSquare } from 'lucide-vue-next'
import { reviewService } from '@/api/reviewService'
import { useAuthStore } from '@/stores/authStore'
import PlaceDetailModal from '@/components/common/PlaceDetailModal.vue'

const auth = useAuthStore()

const reviews = ref([])
const loading = ref(false)
const detailItem = ref(null)

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

async function load() {
  if (!auth.isAuthed) { reviews.value = []; return }
  loading.value = true
  try {
    const { content } = await reviewService.mine({ size: 100 })
    reviews.value = content
  } catch {
    reviews.value = []
  } finally {
    loading.value = false
  }
}

// 리뷰 클릭 → 해당 장소 상세 모달(거기서 리뷰 수정/삭제 가능)
function openPlace(r) {
  detailItem.value = {
    placeId: r.placeId,
    id: String(r.placeId),
    name: r.placeTitle,
    firstImage: r.placeImage,
    category: 'place',
  }
}

onMounted(load)
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <header class="px-5 pt-5 pb-3">
      <div class="flex items-center gap-2 mb-1">
        <h2 class="text-xl font-bold text-gray-900 dark:text-slate-100">내 리뷰</h2>
        <span class="ml-auto text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">
          {{ reviews.length }}<span class="text-[13px] font-semibold text-slate-400 ml-0.5">개</span>
        </span>
      </div>
      <p class="mt-2 text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
        내가 작성한 리뷰입니다. 항목을 누르면 장소 상세에서 수정/삭제할 수 있어요.
      </p>
    </header>

    <div class="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
      <div v-if="loading" class="flex items-center justify-center gap-1.5 text-[12px] text-slate-400 py-8">
        <Loader2 :size="14" class="animate-spin" /> 불러오는 중…
      </div>

      <template v-else>
        <button
          v-for="r in reviews"
          :key="r.reviewId"
          @click="openPlace(r)"
          class="w-full text-left rounded-xl bg-white dark:bg-slate-800 shadow-sm overflow-hidden
                 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex gap-0"
        >
          <!-- 장소 이미지 -->
          <div class="shrink-0 w-20 self-stretch min-h-20 bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <img
              v-if="r.placeImage"
              :src="r.placeImage"
              :alt="r.placeTitle"
              class="w-full h-full object-cover"
              draggable="false"
              loading="lazy"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-500 px-1 text-center">
              이미지<br />없음
            </div>
          </div>

          <!-- 내용 -->
          <div class="flex-1 min-w-0 py-2.5 px-3">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate">{{ r.placeTitle }}</h3>
              <span class="shrink-0 text-[11px] text-slate-400">{{ formatDate(r.createdAt) }}</span>
            </div>
            <div class="mt-1 flex items-center">
              <Star
                v-for="n in 5" :key="n" :size="12"
                :class="n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-600'"
              />
            </div>
            <p class="mt-1 text-[12px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed whitespace-pre-wrap">
              {{ r.content }}
            </p>
          </div>
        </button>

        <div
          v-if="!reviews.length"
          class="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-10 text-center text-[12px] text-slate-500 dark:text-slate-400 shadow-inner flex flex-col items-center gap-2"
        >
          <MessageSquare :size="20" class="text-slate-300 dark:text-slate-600" />
          아직 작성한 리뷰가 없습니다.
        </div>
      </template>
    </div>

    <!-- 장소 상세 모달 (리뷰 수정/삭제) -->
    <PlaceDetailModal
      :item="detailItem"
      :show-add="false"
      @close="detailItem = null"
    />
  </div>
</template>
