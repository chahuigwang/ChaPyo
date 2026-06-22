<script setup>
import { ref, onMounted } from 'vue'
import { Star, Loader2, MessageSquare, Pencil, Trash2, Check, X } from 'lucide-vue-next'
import { reviewService } from '@/api/reviewService'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'

const auth = useAuthStore()
const toast = useToastStore()

const reviews = ref([])
const loading = ref(false)
const submitting = ref(false)

// 수정 상태
const editingId = ref(null)
const editRating = ref(0)
const editHover = ref(0)
const editContent = ref('')

// 삭제 확인 상태 (한 번 더 클릭 시 삭제)
const pendingDeleteId = ref(null)

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

function startEdit(r) {
  pendingDeleteId.value = null
  editingId.value = r.reviewId
  editRating.value = r.rating
  editHover.value = 0
  editContent.value = r.content
}
function cancelEdit() { editingId.value = null }

async function saveEdit(r) {
  if (submitting.value) return
  if (!editRating.value || !editContent.value.trim()) { toast.error('별점과 내용을 입력해주세요.'); return }
  submitting.value = true
  try {
    await reviewService.update(r.placeId, r.reviewId, {
      content: editContent.value.trim(),
      rating: editRating.value,
    })
    // 서버 재조회 없이 목록에 즉시 반영
    r.content = editContent.value.trim()
    r.rating = editRating.value
    editingId.value = null
    toast.success?.('리뷰를 수정했습니다.')
  } catch (err) {
    toast.error(err?.message ?? '리뷰 수정에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

function requestDelete(r) { pendingDeleteId.value = r.reviewId }
function cancelDelete() { pendingDeleteId.value = null }

async function remove(r) {
  if (pendingDeleteId.value !== r.reviewId) { requestDelete(r); return }
  try {
    await reviewService.remove(r.placeId, r.reviewId)
    reviews.value = reviews.value.filter((x) => x.reviewId !== r.reviewId)
    pendingDeleteId.value = null
    toast.success?.('리뷰를 삭제했습니다.')
  } catch (err) {
    toast.error(err?.message ?? '리뷰 삭제에 실패했습니다.')
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
        내가 작성한 리뷰입니다. 항목에서 바로 수정/삭제할 수 있어요.
      </p>
    </header>

    <div class="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
      <div v-if="loading" class="flex items-center justify-center gap-1.5 text-[12px] text-slate-400 py-8">
        <Loader2 :size="14" class="animate-spin" /> 불러오는 중…
      </div>

      <template v-else>
        <div
          v-for="r in reviews"
          :key="r.reviewId"
          class="w-full rounded-xl bg-white dark:bg-slate-800 shadow-sm overflow-hidden flex gap-0"
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

            <!-- 수정 모드 -->
            <template v-if="editingId === r.reviewId">
              <div class="mt-1.5 flex items-center gap-0.5">
                <button
                  v-for="n in 5" :key="n" type="button"
                  @click="editRating = n"
                  @mouseenter="editHover = n" @mouseleave="editHover = 0"
                  class="p-0.5"
                >
                  <Star :size="16" :class="n <= (editHover || editRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'" />
                </button>
              </div>
              <textarea
                v-model="editContent" rows="2"
                class="mt-1 w-full rounded-lg bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-[12px] text-slate-900 dark:text-slate-100 resize-none outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div class="flex gap-1.5 mt-1.5">
                <button @click="saveEdit(r)" :disabled="submitting" class="flex-1 h-7 rounded-lg bg-primary text-white text-[12px] font-semibold flex items-center justify-center gap-1 disabled:opacity-50">
                  <Check :size="12" /> 저장
                </button>
                <button @click="cancelEdit" class="flex-1 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-[12px] text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1">
                  <X :size="12" /> 취소
                </button>
              </div>
            </template>

            <!-- 읽기 모드 -->
            <template v-else>
              <div class="mt-1 flex items-center justify-between gap-2">
                <div class="flex items-center">
                  <Star
                    v-for="n in 5" :key="n" :size="12"
                    :class="n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-600'"
                  />
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <button @click="startEdit(r)" class="p-1 rounded text-slate-400 hover:text-primary transition-colors" title="수정">
                    <Pencil :size="13" />
                  </button>
                  <button
                    v-if="pendingDeleteId === r.reviewId"
                    @click="remove(r)"
                    @mouseleave="cancelDelete"
                    class="px-2 h-6 rounded bg-red-500 text-white text-[11px] font-semibold hover:bg-red-600 transition-colors"
                    title="한 번 더 클릭하면 삭제됩니다"
                  >
                    삭제
                  </button>
                  <button
                    v-else
                    @click="remove(r)"
                    class="p-1 rounded text-slate-400 hover:text-red-500 transition-colors"
                    title="삭제"
                  >
                    <Trash2 :size="13" />
                  </button>
                </div>
              </div>
              <p class="mt-1 text-[12px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed whitespace-pre-wrap">
                {{ r.content }}
              </p>
            </template>
          </div>
        </div>

        <div
          v-if="!reviews.length"
          class="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-10 text-center text-[12px] text-slate-500 dark:text-slate-400 shadow-inner flex flex-col items-center gap-2"
        >
          <MessageSquare :size="20" class="text-slate-300 dark:text-slate-600" />
          아직 작성한 리뷰가 없습니다.
        </div>
      </template>
    </div>
  </div>
</template>
