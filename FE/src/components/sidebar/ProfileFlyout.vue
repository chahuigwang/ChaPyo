<script setup>
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { UserRound, LogOut, LogIn, UserPlus, Mail, Loader2, Check } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { useTripStore } from '@/stores/tripStore'

const router = useRouter()
const auth = useAuthStore()
const trip = useTripStore()
const { user, isAuthed } = storeToRefs(auth)
const { members } = storeToRefs(trip)

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

function initialOf(name) { return (name || '?').trim().charAt(0) }

// ── Members (서버 상세 조회 결과) ─────────────────────────────
const MEMBER_COLORS = ['#10B981', '#A855F7', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6']
function isMe(m) { return m.nickname === user.value?.nickname }
// 방장: 내가 방장이면 나, 아니면 첫 멤버(생성자) 추정
const ownerName = computed(() => {
  if (trip.currentTrip?.isOwner) return user.value?.nickname ?? null
  return members.value?.[0]?.nickname ?? null
})
const memberList = computed(() =>
  (members.value ?? []).map((m, i) => {
    const owner = ownerName.value != null && m.nickname === ownerName.value
    return {
      id: m.userId ?? m.nickname,
      name: m.nickname,
      me: isMe(m),
      owner,
      color: owner ? '#D97706' : isMe(m) ? '#00B7EB' : MEMBER_COLORS[i % MEMBER_COLORS.length],
    }
  }),
)

// ── Inline invite ────────────────────────────────────────────
const email = ref('')
const inviting = ref(false)
const inviteError = ref('')
const inviteSuccess = ref('')
const canInvite = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))

async function invite() {
  if (!canInvite.value || inviting.value) return
  inviting.value = true
  inviteError.value = ''
  inviteSuccess.value = ''
  const res = await trip.inviteMember(email.value.trim())
  inviting.value = false
  if (!res.ok) { inviteError.value = res.message; return }
  inviteSuccess.value = res.message || '초대했습니다.'
  email.value = ''
}

const row =
  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors'
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 p-5 gap-5 overflow-y-auto">
    <header>
      <h2 class="text-xl font-bold text-gray-900 dark:text-slate-100">여행 인원</h2>
    </header>

    <!-- ── 내 정보 ───────────────────────────────────────── -->
    <section class="flex flex-col gap-2.5">
      <span class="text-[13px] font-bold text-slate-700 dark:text-slate-200">내 정보</span>

    <!-- User info -->
    <div
      v-if="isAuthed"
      class="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-4 flex items-center gap-3"
    >
      <span class="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <UserRound :size="18" />
      </span>
      <div class="min-w-0">
        <div class="text-[14px] font-semibold text-slate-900 dark:text-slate-100 truncate">{{ user.nickname }}</div>
        <div class="text-[12px] text-slate-500 dark:text-slate-400 truncate">{{ user.email }}</div>
      </div>
    </div>
    <div
      v-else
      class="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-5 text-[12px] text-slate-500 dark:text-slate-400 text-center"
    >
      로그인하고 일정을 저장하세요
    </div>

    <div class="flex flex-col gap-1">
      <button
        v-if="isAuthed"
        @click.stop="handleLogout"
        class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[13px] font-medium transition-all duration-150"
        :class="logoutPending
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-red-50/70 dark:bg-red-900/15 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30'"
        :title="logoutPending ? '한 번 더 누르면 로그아웃됩니다' : '로그아웃'"
      >
        <LogOut :size="15" />
        {{ logoutPending ? '정말 로그아웃?' : '로그아웃' }}
      </button>
      <button v-else :class="row" @click="auth.openLogin"><LogIn :size="15" /> 로그인</button>
    </div>
    </section>

    <!-- 구분선 -->
    <div class="h-px bg-slate-200/70 dark:bg-slate-800 -mx-1" />

    <!-- ── 참여자 ───────────────────────────────────────── -->
    <section class="flex flex-col gap-3">
      <span class="text-[13px] font-bold text-slate-700 dark:text-slate-200">참여자 ({{ memberList.length }})</span>

      <div class="grid grid-cols-2 gap-2">
        <div
          v-for="m in memberList"
          :key="m.id"
          class="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors"
          :class="m.owner
            ? 'bg-amber-50 dark:bg-amber-900/15 ring-1 ring-amber-300/70 dark:ring-amber-500/30'
            : m.me
              ? 'bg-primary/10 ring-1 ring-primary/40'
              : 'bg-slate-50 dark:bg-slate-800/60'"
        >
          <div
            class="h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-semibold text-white shrink-0"
            :style="{ backgroundColor: m.color }"
          >{{ initialOf(m.name) }}</div>
          <div class="min-w-0">
            <div class="text-[12px] font-semibold truncate"
                 :class="m.owner ? 'text-amber-700 dark:text-amber-400' : m.me ? 'text-primary' : 'text-slate-900 dark:text-slate-100'">
              {{ m.name }}
            </div>
            <div v-if="m.owner" class="text-[11px] font-bold text-amber-600 dark:text-amber-400 leading-none mt-0.5">방장</div>
          </div>
        </div>
        <p v-if="!memberList.length" class="col-span-2 text-[11px] text-slate-400 dark:text-slate-500 py-1.5 px-1">
          여행을 열면 멤버가 표시됩니다.
        </p>
      </div>

      <!-- Inline invite -->
      <div class="flex flex-col gap-2 pt-1">
        <div class="text-[13px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <UserPlus :size="14" /> 이메일로 초대
        </div>
        <form class="flex items-stretch gap-2" @submit.prevent="invite">
          <div class="relative flex-1">
            <Mail :size="13" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="email"
              type="email"
              placeholder="chapyo@email.com"
              class="w-full h-9 pl-8 pr-3 text-[12px] rounded-lg bg-slate-50 dark:bg-slate-800/60
                     text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
          <button
            type="submit"
            :disabled="!canInvite || inviting"
            class="px-3 h-9 rounded-lg text-[12px] font-medium transition-all duration-200
                   flex items-center gap-1.5 shadow-sm bg-[#00B7EB] text-white
                   hover:bg-[#0298c4] hover:-translate-y-0.5 hover:shadow-md
                   disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="inviting" :size="13" class="animate-spin" />
            <UserPlus v-else :size="13" />
            초대
          </button>
        </form>
        <p v-if="inviteError" class="text-[11px] text-red-500">{{ inviteError }}</p>
        <p v-else-if="inviteSuccess" class="text-[11px] text-emerald-500 flex items-center gap-1">
          <Check :size="12" /> {{ inviteSuccess }}
        </p>
      </div>
    </section>
  </div>
</template>
