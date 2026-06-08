<script setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { UserRound, LogOut, LogIn, UserPlus, History, Clock } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { useCollabStore } from '@/stores/collabStore'
import InviteModal from '@/components/modal/InviteModal.vue'

const router = useRouter()
const auth = useAuthStore()
const collab = useCollabStore()
const { user, isAuthed } = storeToRefs(auth)
const { peers, inviteOpen, historyOpen, history } = storeToRefs(collab)

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

collab.seedDemoHistory()

function initialOf(name) { return (name || '?').trim().charAt(0) }

const typeLabel = { add: '추가', edit: '수정', reorder: '순서 변경', remove: '삭제' }
function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return '방금'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

const row =
  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors'
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 p-5 gap-5 overflow-y-auto">
    <header>
      <h2 class="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6">내 프로필</h2>
    </header>

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

    <!-- Collaborators section -->
    <section class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <span class="text-[12px] font-semibold text-slate-600 dark:text-slate-300">멤버</span>
        <button
          @click="collab.openInvite"
          class="inline-flex items-center gap-1.5 px-3 h-7 rounded-full text-[11px] font-medium text-[#00B7EB] bg-[#00B7EB]/10 hover:bg-[#00B7EB] hover:text-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
        >
          <UserPlus :size="13" /> 초대
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <!-- Me -->
        <div class="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
          <div
            class="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[12px] font-semibold shrink-0"
          >{{ initialOf(user?.nickname) }}</div>
          <div class="min-w-0">
            <div class="text-[12px] font-semibold text-slate-900 dark:text-slate-100 truncate">{{ user?.nickname ?? '나' }} (본인)</div>
          </div>
        </div>

        <div
          v-for="peer in peers"
          :key="peer.id"
          class="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60"
        >
          <div
            class="h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-semibold text-white shrink-0"
            :style="{ backgroundColor: peer.color }"
          >{{ initialOf(peer.name) }}</div>
          <div class="min-w-0">
            <div class="text-[12px] font-semibold text-slate-900 dark:text-slate-100 truncate">{{ peer.name }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Activity history section -->
    <section class="flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <History :size="14" class="text-slate-400" />
        <span class="text-[12px] font-semibold text-slate-600 dark:text-slate-300">활동 기록</span>
      </div>

      <div v-if="history.length" class="flex flex-col gap-2">
        <div
          v-for="h in history.slice(0, 8)"
          :key="h.id"
          class="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60"
        >
          <div
            class="mt-0.5 h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
            :style="{ backgroundColor: h.byColor }"
          >{{ initialOf(h.byName) }}</div>
          <div class="min-w-0 flex-1">
            <span class="text-[12px] text-slate-700 dark:text-slate-200">
              <span class="font-semibold">{{ h.byName }}</span>
              님이 <span class="text-primary font-medium">"{{ h.itemName }}"</span>을(를) {{ typeLabel[h.type] ?? h.type }}
            </span>
            <div class="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
              <Clock :size="10" />{{ timeAgo(h.at) }}
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center text-[11px] text-slate-400 dark:text-slate-500 py-4">
        활동 기록이 없습니다.
      </div>
    </section>

    <InviteModal :open="inviteOpen" @close="collab.closeInvite" />
  </div>
</template>
