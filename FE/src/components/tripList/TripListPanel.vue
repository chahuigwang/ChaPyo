<script setup>
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { Plus, LogOut, Pencil, Check, X, Loader2, KeyRound, Trash2, Library, MapPin, Search } from 'lucide-vue-next'
import { useTripStore } from '@/stores/tripStore'
import { useAuthStore } from '@/stores/authStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { Button, Input } from '@/components/common'
import TripCard from '@/components/tripList/TripCard.vue'
import LibraryCard from '@/components/library/LibraryCard.vue'
import PublishModal from '@/components/library/PublishModal.vue'

const router = useRouter()
const route = useRoute()
const trip = useTripStore()
const auth = useAuthStore()
const library = useLibraryStore()
const { trips } = storeToRefs(trip)
const { user } = storeToRefs(auth)
const {
  items: libraryItems,
  hasNext: libraryHasNext,
  loading: libraryLoading,
  loadingMore: libraryLoadingMore,
  publishing: libraryPublishing,
  importingId: libraryImportingId,
} = storeToRefs(library)

// ── 탭: 내 여행 / 라이브러리 (슬라이딩 언더라인) ───────────────
const activeTab = ref('mine')
const tabEls = ref({})
const barStyle = ref({ left: '0px', width: '0px' })
function setTabRef(el, id) { if (el) tabEls.value[id] = el }
function updateBar() {
  const el = tabEls.value[activeTab.value]
  if (el) barStyle.value = { left: `${el.offsetLeft}px`, width: `${el.offsetWidth}px` }
}
function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'library' && !libraryItems.value.length) library.fetchList()
}
watch(activeTab, () => nextTick(updateBar))
onMounted(() => {
  // 라이브러리 상세에서 돌아올 때 탭 복원 (/list?tab=library)
  if (route.query.tab === 'library') {
    activeTab.value = 'library'
    if (!libraryItems.value.length) library.fetchList()
  }
  nextTick(updateBar)
})

// 내가 게시한 글인지(닉네임 기준 — FE에 userId가 없어 닉네임으로 판별)
const myNickname = computed(() => user.value?.nickname ?? null)
function isMineLibrary(lib) {
  return !!myNickname.value && lib?.nickname === myNickname.value
}

// ── 라이브러리 필터(전체/내 게시물/다른 사람) + 검색 ──────────
const LIB_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'mine', label: '내 게시물' },
  { id: 'others', label: '다른 사람' },
]
const libFilter = ref('all')
const librarySearch = ref('')
const filteredLibrary = computed(() => {
  const q = librarySearch.value.trim().toLowerCase()
  return libraryItems.value.filter((lib) => {
    if (libFilter.value === 'mine' && !isMineLibrary(lib)) return false
    if (libFilter.value === 'others' && isMineLibrary(lib)) return false
    if (q) {
      const hay = `${lib.title ?? ''} ${lib.description ?? ''} ${lib.nickname ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

// ── 게시 ──────────────────────────────────────────────────────
const publishOpen = ref(false)
const publishTrip = ref(null)
function openPublish(t) {
  publishTrip.value = t
  publishOpen.value = true
}
async function submitPublish(payload) {
  if (!publishTrip.value) return
  const res = await library.publish({ planId: Number(publishTrip.value.id), ...payload })
  if (res.ok) {
    publishOpen.value = false
    // 라이브러리 탭을 이미 봤다면 최신화
    if (libraryItems.value.length || activeTab.value === 'library') library.fetchList()
  }
}

// ── 상세: 모달 대신 전용 페이지로 이동 ────────────────────────
function openLibraryDetail(id) {
  router.push(`/library/${id}`)
}

// ── 불러오기 (목록 카드에서) ──────────────────────────────────
async function importLibrary(id) {
  const res = await library.importLibrary(id)
  if (res.ok) {
    await trip.fetchTrips()
    activeTab.value = 'mine'
  }
}

// ── 라이브러리 삭제 (목록 카드에서) ───────────────────────────
async function deleteLibrary(lib) {
  await library.remove(lib.libraryId)
}

const SORT_OPTIONS = [
  { id: 'updated', label: '최근 수정한 순' },
  { id: 'departure', label: '출발일 기준 최신순' },
]
const sortKey = ref('updated')

const sortedTrips = computed(() => {
  const list = [...trips.value]
  if (sortKey.value === 'departure') {
    list.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
  } else {
    list.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
  }
  return list
})

// ── Trip navigation ───────────────────────────────────────────
function handleOpen(id) {
  trip.selectTrip(id)
  router.push(`/trip/${id}`)
}

const creating = ref(false)
async function handleCreateTrip() {
  if (creating.value) return
  creating.value = true
  const t = await trip.createTrip()
  creating.value = false
  if (t) router.push(`/trip/${t.id}`)
}

// ── Logout two-click confirm ─────────────────────────────────
const logoutPending = ref(false)
async function handleLogout() {
  if (logoutPending.value) {
    await auth.logout()
    logoutPending.value = false
    router.push('/login')
  } else {
    logoutPending.value = true
  }
}
function cancelLogout() { logoutPending.value = false }
watch(logoutPending, (v) => {
  if (v) document.addEventListener('click', cancelLogout)
  else document.removeEventListener('click', cancelLogout)
})

// ── 내 정보 수정 ──────────────────────────────────────────────
const editingProfile = ref(false)
const profileNickname = ref('')
const profileEmail = ref('')
const profileError = ref('')
const profileSaving = ref(false)

function openProfileEdit() {
  profileNickname.value = user.value?.nickname ?? ''
  profileEmail.value = user.value?.email ?? ''
  profileError.value = ''
  editingProfile.value = true
  editingPassword.value = false
}
function cancelProfileEdit() { editingProfile.value = false; profileError.value = '' }
async function saveProfile() {
  if (!profileNickname.value.trim() || !profileEmail.value.trim()) {
    profileError.value = '닉네임과 이메일을 입력해 주세요.'
    return
  }
  profileSaving.value = true
  profileError.value = ''
  const res = await auth.updateProfile({ nickname: profileNickname.value.trim(), email: profileEmail.value.trim() })
  profileSaving.value = false
  if (!res.ok) { profileError.value = res.message; return }
  editingProfile.value = false
}

// ── 비밀번호 변경 ──────────────────────────────────────────────
const editingPassword = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')
const passwordError = ref('')
const passwordSaving = ref(false)

function openPasswordEdit() {
  currentPassword.value = ''
  newPassword.value = ''
  newPasswordConfirm.value = ''
  passwordError.value = ''
  editingPassword.value = true
  editingProfile.value = false
}
function cancelPasswordEdit() { editingPassword.value = false; passwordError.value = '' }
async function savePassword() {
  if (!currentPassword.value || !newPassword.value || !newPasswordConfirm.value) {
    passwordError.value = '모든 항목을 입력해 주세요.'
    return
  }
  if (newPassword.value !== newPasswordConfirm.value) {
    passwordError.value = '새 비밀번호가 일치하지 않습니다.'
    return
  }
  passwordSaving.value = true
  passwordError.value = ''
  const res = await auth.updatePassword({ currentPassword: currentPassword.value, newPassword: newPassword.value })
  passwordSaving.value = false
  if (!res.ok) { passwordError.value = res.message; return }
  editingPassword.value = false
}

// ── 회원 탈퇴 ──────────────────────────────────────────────────
const deletePending = ref(false)
const deleteLoading = ref(false)
async function confirmDelete() {
  deleteLoading.value = true
  await auth.deleteAccount()
  deleteLoading.value = false
}
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <div class="mx-auto max-w-4xl px-8 py-16">

      <!-- Header -->
      <div class="flex items-start justify-between mb-10 gap-6">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-2">
            {{ activeTab === 'mine' ? '나의 여행 계획' : '여행 라이브러리' }}
          </h1>
          <p class="text-[13px] text-slate-400 dark:text-slate-500 mt-1">
            {{ activeTab === 'mine' ? '내 여행을 관리하고 라이브러리에 공유하세요.' : '다른 사람의 여행을 내 여행으로 가져오세요.' }}
          </p>
        </div>

        <!-- User card -->
        <div class="flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-sm shrink-0 overflow-hidden min-w-[260px]">
          <!-- 기본 정보 행 -->
          <div class="flex items-center gap-3 px-4 py-3">
            <div class="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[15px] font-bold">
              {{ (user?.nickname ?? '?').charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
                {{ user?.nickname ?? '사용자' }}
              </div>
              <div class="text-[11px] text-slate-400 dark:text-slate-500 truncate">{{ user?.email }}</div>
            </div>
            <div class="flex items-center gap-1 pl-3 border-l border-slate-100 dark:border-slate-800">
              <button
                @click="editingProfile ? cancelProfileEdit() : openProfileEdit()"
                class="h-8 w-8 rounded-xl flex items-center justify-center transition-colors"
                :class="editingProfile ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800'"
                title="내 정보 수정"
              >
                <X v-if="editingProfile" :size="14" />
                <Pencil v-else :size="14" />
              </button>
              <button
                @click="editingPassword ? cancelPasswordEdit() : openPasswordEdit()"
                class="h-8 w-8 rounded-xl flex items-center justify-center transition-colors"
                :class="editingPassword ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800'"
                title="비밀번호 변경"
              >
                <X v-if="editingPassword" :size="14" />
                <KeyRound v-else :size="14" />
              </button>
              <button
                @click.stop="handleLogout"
                class="h-8 rounded-xl flex items-center justify-center gap-1 transition-all duration-200 overflow-hidden"
                :class="logoutPending
                  ? 'px-2.5 bg-red-500 text-white'
                  : 'w-8 bg-red-50 dark:bg-red-900/20 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500'"
                title="로그아웃"
              >
                <LogOut :size="14" class="shrink-0" />
                <span v-if="logoutPending" class="text-[11px] font-medium whitespace-nowrap">로그아웃</span>
              </button>
            </div>
          </div>

          <!-- 내 정보 수정 폼 -->
          <div class="edit-expand" :class="editingProfile ? 'edit-expand--open' : ''">
            <div>
              <div class="px-4 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                <Input v-model="profileNickname" placeholder="닉네임" class="text-[13px] h-8" />
                <Input v-model="profileEmail" type="email" placeholder="이메일" class="text-[13px] h-8" />
                <p v-if="profileError" class="text-[11px] text-red-500">{{ profileError }}</p>
                <button
                  @click="saveProfile"
                  :disabled="profileSaving"
                  class="h-8 rounded-lg bg-primary text-white text-[12px] font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                >
                  <Loader2 v-if="profileSaving" :size="12" class="animate-spin" />
                  <Check v-else :size="12" />
                  저장
                </button>
              </div>
            </div>
          </div>

          <!-- 비밀번호 변경 폼 -->
          <div class="edit-expand" :class="editingPassword ? 'edit-expand--open' : ''">
            <div>
              <div class="px-4 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                <Input v-model="currentPassword" type="password" placeholder="현재 비밀번호" class="text-[13px] h-8" />
                <Input v-model="newPassword" type="password" placeholder="새 비밀번호" class="text-[13px] h-8" />
                <Input v-model="newPasswordConfirm" type="password" placeholder="새 비밀번호 확인" class="text-[13px] h-8" />
                <p v-if="passwordError" class="text-[11px] text-red-500">{{ passwordError }}</p>
                <button
                  @click="savePassword"
                  :disabled="passwordSaving"
                  class="h-8 rounded-lg bg-primary text-white text-[12px] font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                >
                  <Loader2 v-if="passwordSaving" :size="12" class="animate-spin" />
                  <Check v-else :size="12" />
                  변경
                </button>
              </div>
            </div>
          </div>

          <!-- 회원 탈퇴 -->
          <div class="border-t border-slate-100 dark:border-slate-800">
            <div v-if="!deletePending" class="px-4 py-2">
              <button
                @click="deletePending = true"
                class="w-full flex items-center gap-2 py-1.5 text-[11px] text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 :size="12" /> 회원 탈퇴
              </button>
            </div>
            <div v-else class="px-4 py-3 flex flex-col gap-2">
              <p class="text-[11px] text-red-500 font-medium">정말 탈퇴하시겠습니까? 되돌릴 수 없습니다.</p>
              <div class="flex gap-2">
                <button
                  @click="deletePending = false"
                  class="flex-1 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                >취소</button>
                <button
                  @click="confirmDelete"
                  :disabled="deleteLoading"
                  class="flex-1 h-7 rounded-lg bg-red-500 text-white text-[11px] font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                >
                  <Loader2 v-if="deleteLoading" :size="11" class="animate-spin" />
                  탈퇴
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs (슬라이딩 언더라인) -->
      <div class="relative flex items-center gap-1 mb-6 border-b border-slate-200 dark:border-slate-800">
        <button
          :ref="el => setTabRef(el, 'mine')"
          @click="switchTab('mine')"
          class="inline-flex items-center gap-1.5 px-4 py-2.5 text-[14px] font-semibold transition-colors"
          :class="activeTab === 'mine'
            ? 'text-primary'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'"
        >
          <MapPin :size="15" /> 내 여행
        </button>
        <button
          :ref="el => setTabRef(el, 'library')"
          @click="switchTab('library')"
          class="inline-flex items-center gap-1.5 px-4 py-2.5 text-[14px] font-semibold transition-colors"
          :class="activeTab === 'library'
            ? 'text-primary'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'"
        >
          <Library :size="15" /> 라이브러리
        </button>
        <!-- 이동하는 밑줄 -->
        <span
          class="absolute bottom-0 h-0.5 bg-primary rounded-full transition-all duration-300 ease-out"
          :style="barStyle"
        />
      </div>

      <!-- ── 내 여행 탭 ─────────────────────────────────────── -->
      <template v-if="activeTab === 'mine'">
        <!-- Toolbar -->
        <div class="flex items-center justify-between mb-5">
          <Button @click="handleCreateTrip" :disabled="creating">
            <Loader2 v-if="creating" :size="15" class="animate-spin" />
            <Plus v-else :size="15" />
            새 여행
          </Button>
          <div v-if="trips.length" class="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800/60">
            <button
              v-for="opt in SORT_OPTIONS"
              :key="opt.id"
              class="px-3 py-1.5 text-[12px] font-medium rounded-md transition-all duration-200"
              :class="sortKey === opt.id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'"
              @click="sortKey = opt.id"
            >{{ opt.label }}</button>
          </div>
        </div>

        <!-- Trip grid -->
        <div v-if="trips.length" class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <TripCard
            v-for="t in sortedTrips"
            :key="t.id"
            :trip="t"
            @open="handleOpen($event)"
            @delete="trip.deleteTrip($event.id)"
            @publish="openPublish($event)"
          />
        </div>
        <div v-else class="rounded-xl bg-white/40 dark:bg-slate-900/40 p-16 text-center text-sm text-slate-500 dark:text-slate-400 shadow-inner">
          아직 여행 계획이 없습니다. "새 여행"을 눌러 시작해 보세요.
        </div>
      </template>

      <!-- ── 라이브러리 탭 ──────────────────────────────────── -->
      <template v-else>
        <!-- 툴바: 검색 + 필터 토글 -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div class="relative flex-1 max-w-sm">
            <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="librarySearch"
              type="text"
              placeholder="제목 · 설명 · 작성자 검색"
              class="w-full h-10 pl-9 pr-3 rounded-xl bg-white dark:bg-slate-900 text-[13px] text-slate-900 dark:text-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
          <div class="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 sm:ml-auto">
            <button
              v-for="opt in LIB_FILTERS"
              :key="opt.id"
              @click="libFilter = opt.id"
              class="px-3 py-1.5 text-[12px] font-medium rounded-md transition-all duration-200"
              :class="libFilter === opt.id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'"
            >{{ opt.label }}</button>
          </div>
        </div>

        <!-- 로딩 -->
        <div v-if="libraryLoading" class="flex items-center justify-center py-20 text-slate-400">
          <Loader2 :size="24" class="animate-spin" />
        </div>

        <template v-else>
          <div v-if="filteredLibrary.length" class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <LibraryCard
              v-for="lib in filteredLibrary"
              :key="lib.libraryId"
              :library="lib"
              :mine="isMineLibrary(lib)"
              :importing="libraryImportingId === lib.libraryId"
              @open="openLibraryDetail($event)"
              @import="importLibrary($event)"
              @delete="deleteLibrary($event)"
            />
          </div>
          <div v-else class="rounded-xl bg-white/40 dark:bg-slate-900/40 p-16 text-center text-sm text-slate-500 dark:text-slate-400 shadow-inner">
            <template v-if="librarySearch.trim()">검색 결과가 없습니다.</template>
            <template v-else-if="libFilter === 'mine'">아직 게시한 여행이 없습니다. 내 여행을 게시해 보세요.</template>
            <template v-else-if="libFilter === 'others'">다른 사람이 공유한 여행이 없습니다.</template>
            <template v-else>아직 공유된 여행이 없습니다. 내 여행을 게시해 보세요.</template>
          </div>

          <!-- 더 보기 (검색/필터 미적용 시에만) -->
          <div v-if="libraryHasNext && !librarySearch.trim() && libFilter === 'all'" class="flex justify-center mt-6">
            <button
              @click="library.loadMore()"
              :disabled="libraryLoadingMore"
              class="inline-flex items-center gap-1.5 h-10 px-6 rounded-xl bg-white dark:bg-slate-900 text-[13px] font-semibold text-slate-600 dark:text-slate-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 transition-all"
            >
              <Loader2 v-if="libraryLoadingMore" :size="14" class="animate-spin" />
              더 보기
            </button>
          </div>
        </template>
      </template>
    </div>

    <!-- 게시 모달 -->
    <PublishModal
      :open="publishOpen"
      :trip="publishTrip"
      :publishing="libraryPublishing"
      @close="publishOpen = false"
      @submit="submitPublish"
    />
  </div>
</template>

<style scoped>
.edit-expand {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 220ms cubic-bezier(0.4, 0, 0.2, 1);
}
.edit-expand > div { min-height: 0; overflow: hidden; }
.edit-expand--open { grid-template-rows: 1fr; }
</style>
