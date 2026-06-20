<script setup>
import { ref, computed, watch } from 'vue'
import { Star, Loader2, Pencil, Trash2, Check, X, MessageSquare } from 'lucide-vue-next'
import { reviewService } from '@/api/reviewService'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'

const props = defineProps({
  placeId: { type: [Number, String], default: null },
})

const auth = useAuthStore()
const toast = useToastStore()

const reviews = ref([])
const loading = ref(false)
const submitting = ref(false)

// 작성 폼
const draftRating = ref(0)
const hoverRating = ref(0)
const draftContent = ref('')

// 수정 상태
const editingId = ref(null)
const editRating = ref(0)
const editHover = ref(0)
const editContent = ref('')

const myNickname = computed(() => auth.user?.nickname ?? null)
function isMine(r) { return myNickname.value && r.nickname === myNickname.value }

const avgRating = computed(() => {
  if (!reviews.value.length) return 0
  const sum = reviews.value.reduce((s, r) => s + (Number(r.rating) || 0), 0)
  return Math.round((sum / reviews.value.length) * 10) / 10
})

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

async function load() {
  if (!props.placeId) { reviews.value = []; return }
  loading.value = true
  try {
    const { content } = await reviewService.list(props.placeId, { size: 50 })
    reviews.value = content
  } catch {
    reviews.value = []
  } finally {
    loading.value = false
  }
}

function resetForm() {
  draftRating.value = 0
  hoverRating.value = 0
  draftContent.value = ''
}

async function submit() {
  if (submitting.value || !props.placeId) return
  if (!auth.isAuthed) { toast.error('로그인 후 작성할 수 있습니다.'); return }
  if (!draftRating.value) { toast.error('별점을 선택해주세요.'); return }
  if (!draftContent.value.trim()) { toast.error('내용을 입력해주세요.'); return }
  submitting.value = true
  try {
    await reviewService.create(props.placeId, {
      content: draftContent.value.trim(),
      rating: draftRating.value,
    })
    resetForm()
    await load()
    toast.success?.('리뷰를 작성했습니다.')
  } catch (err) {
    toast.error(err?.message ?? '리뷰 작성에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

function startEdit(r) {
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
    await reviewService.update(props.placeId, r.reviewId, {
      content: editContent.value.trim(),
      rating: editRating.value,
    })
    editingId.value = null
    await load()
    toast.success?.('리뷰를 수정했습니다.')
  } catch (err) {
    toast.error(err?.message ?? '리뷰 수정에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

async function remove(r) {
  if (!window.confirm('이 리뷰를 삭제할까요?')) return
  try {
    await reviewService.remove(props.placeId, r.reviewId)
    await load()
    toast.success?.('리뷰를 삭제했습니다.')
  } catch (err) {
    toast.error(err?.message ?? '리뷰 삭제에 실패했습니다.')
  }
}

watch(() => props.placeId, () => { editingId.value = null; resetForm(); load() }, { immediate: true })
</script>

<template>
  <div class="space-y-3">
    <!-- 헤더: 제목 + 평균 별점 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-200">
        <MessageSquare :size="14" class="text-primary" />
        리뷰 <span class="text-slate-400 font-normal">({{ reviews.length }})</span>
      </div>
      <div v-if="reviews.length" class="flex items-center gap-1 text-[12px]">
        <Star :size="13" class="fill-amber-400 text-amber-400" />
        <span class="font-bold text-slate-700 dark:text-slate-200">{{ avgRating }}</span>
      </div>
    </div>

    <!-- 작성 폼 -->
    <div class="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-2">
      <div class="flex items-center gap-0.5">
        <button
          v-for="n in 5" :key="n"
          type="button"
          @click="draftRating = n"
          @mouseenter="hoverRating = n"
          @mouseleave="hoverRating = 0"
          class="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            :size="20"
            :class="n <= (hoverRating || draftRating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-slate-300 dark:text-slate-600'"
          />
        </button>
        <span v-if="draftRating" class="ml-1 text-[12px] font-semibold text-amber-500">{{ draftRating }}.0</span>
      </div>
      <textarea
        v-model="draftContent"
        rows="2"
        placeholder="이 장소는 어땠나요?"
        class="w-full rounded-lg bg-white dark:bg-slate-900 px-3 py-2 text-[13px]
               text-slate-900 dark:text-slate-100 resize-none outline-none focus:ring-2 focus:ring-primary/30 transition-all"
      />
      <button
        @click="submit"
        :disabled="submitting"
        class="w-full h-9 rounded-lg bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        <Loader2 v-if="submitting" :size="14" class="animate-spin" />
        리뷰 작성
      </button>
    </div>

    <!-- 목록 -->
    <div v-if="loading" class="flex items-center gap-1.5 text-[12px] text-slate-400 py-2">
      <Loader2 :size="13" class="animate-spin" /> 리뷰 불러오는 중…
    </div>
    <p v-else-if="!reviews.length" class="text-[12px] text-slate-400 dark:text-slate-500 text-center py-3">
      아직 작성된 리뷰가 없습니다.
    </p>
    <ul v-else class="space-y-2.5">
      <li
        v-for="r in reviews" :key="r.reviewId"
        class="rounded-xl bg-white dark:bg-slate-800/40 ring-1 ring-slate-100 dark:ring-slate-700/50 px-3 py-2.5"
      >
        <!-- 수정 모드 -->
        <template v-if="editingId === r.reviewId">
          <div class="flex items-center gap-0.5 mb-1.5">
            <button
              v-for="n in 5" :key="n" type="button"
              @click="editRating = n"
              @mouseenter="editHover = n" @mouseleave="editHover = 0"
              class="p-0.5"
            >
              <Star :size="18" :class="n <= (editHover || editRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'" />
            </button>
          </div>
          <textarea
            v-model="editContent" rows="2"
            class="w-full rounded-lg bg-slate-50 dark:bg-slate-900 px-3 py-2 text-[13px] text-slate-900 dark:text-slate-100 resize-none outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div class="flex gap-1.5 mt-1.5">
            <button @click="saveEdit(r)" :disabled="submitting" class="flex-1 h-8 rounded-lg bg-primary text-white text-[12px] font-semibold flex items-center justify-center gap-1 disabled:opacity-50">
              <Check :size="13" /> 저장
            </button>
            <button @click="cancelEdit" class="flex-1 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-[12px] text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1">
              <X :size="13" /> 취소
            </button>
          </div>
        </template>

        <!-- 읽기 모드 -->
        <template v-else>
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate">{{ r.nickname }}</span>
              <div class="flex items-center shrink-0">
                <Star
                  v-for="n in 5" :key="n" :size="12"
                  :class="n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-600'"
                />
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="text-[11px] text-slate-400">{{ formatDate(r.createdAt) }}</span>
              <template v-if="isMine(r)">
                <button @click="startEdit(r)" class="p-1 rounded text-slate-400 hover:text-primary transition-colors" title="수정">
                  <Pencil :size="13" />
                </button>
                <button @click="remove(r)" class="p-1 rounded text-slate-400 hover:text-red-500 transition-colors" title="삭제">
                  <Trash2 :size="13" />
                </button>
              </template>
            </div>
          </div>
          <p class="mt-1 text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{{ r.content }}</p>
        </template>
      </li>
    </ul>
  </div>
</template>
