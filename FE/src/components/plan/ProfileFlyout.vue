<script setup>
import { storeToRefs } from 'pinia'
import { UserRound, Pencil, LogOut, LogIn } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
const { user, isAuthed } = storeToRefs(auth)

const row =
  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors'
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 p-5 gap-4">
    <header>
      <h2 class="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6">
        내 프로필
      </h2>
    </header>

    <div
      v-if="isAuthed"
      class="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-4 flex items-center gap-3"
    >
      <span class="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
        <UserRound :size="18" />
      </span>
      <div class="min-w-0">
        <div class="text-[14px] font-semibold text-slate-900 dark:text-slate-100 truncate">
          {{ user.name }}
        </div>
        <div class="text-[12px] text-slate-500 dark:text-slate-400">로그인됨</div>
      </div>
    </div>
    <div
      v-else
      class="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-5 text-[12px] text-slate-500 dark:text-slate-400 text-center"
    >
      로그인하고 일정을 저장하세요
    </div>

    <div class="flex flex-col gap-1">
      <button v-if="isAuthed" :class="row">
        <Pencil :size="15" /> 정보 수정
      </button>
      <button v-if="isAuthed" :class="row" @click="auth.logout">
        <LogOut :size="15" /> 로그아웃
      </button>
      <button v-else :class="row" @click="auth.openLogin">
        <LogIn :size="15" /> 로그인
      </button>
    </div>
  </div>
</template>
