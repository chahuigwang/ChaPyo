<script setup>
import { storeToRefs } from 'pinia'
import { LogIn, LogOut, UserRound } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { Button, Avatar } from '@/components/ui'

const auth = useAuthStore()
const { user, isAuthed } = storeToRefs(auth)
</script>

<template>
  <div class="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
    <div v-if="isAuthed" class="flex items-center gap-2 min-w-0">
      <Avatar size="sm" variant="brand">
        <UserRound :size="13" />
      </Avatar>
      <div class="text-xs min-w-0 leading-tight">
        <div class="font-medium text-foreground truncate">{{ user.name }}</div>
        <div class="text-muted-foreground truncate">로그인됨</div>
      </div>
    </div>
    <div v-else class="text-xs text-muted-foreground">로그인하고 일정을 저장하세요</div>

    <Button v-if="isAuthed" variant="ghost" size="sm" @click="auth.logout">
      <LogOut :size="12" /> 로그아웃
    </Button>
    <Button v-else size="sm" @click="auth.openLogin">
      <LogIn :size="12" /> 로그인
    </Button>
  </div>
</template>
