<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import BaseModal from '@/components/common/BaseModal.vue'
import { useAuthStore } from '@/stores/authStore'
import { Button, Input } from '@/components/common'

const auth = useAuthStore()
const { loginOpen } = storeToRefs(auth)

const id = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

async function submit() {
  error.value = ''
  submitting.value = true
  const res = await auth.login({ id: id.value, password: password.value })
  submitting.value = false
  if (!res.ok) error.value = res.message
  else { id.value = ''; password.value = '' }
}
</script>

<template>
  <BaseModal :open="loginOpen" title="로그인" @close="auth.closeLogin">
    <div class="space-y-5">
      <label class="block">
        <span class="text-[12px] font-medium text-slate-500 dark:text-slate-400">아이디</span>
        <Input v-model="id" class="mt-2" placeholder="example@enjoytrip.com" @keydown.enter="submit" />
      </label>
      <label class="block">
        <span class="text-[12px] font-medium text-slate-500 dark:text-slate-400">비밀번호</span>
        <Input v-model="password" type="password" class="mt-2" placeholder="••••••••" @keydown.enter="submit" />
      </label>
      <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
      <p class="text-[11px] text-slate-400 dark:text-slate-500">
        * Mock 인증입니다. 아무 값이나 입력해도 로그인됩니다.
      </p>
    </div>

    <template #footer>
      <Button variant="ghost" size="sm" @click="auth.closeLogin">취소</Button>
      <Button size="sm" :disabled="submitting" @click="submit">
        {{ submitting ? '로그인 중…' : '로그인' }}
      </Button>
    </template>
  </BaseModal>
</template>
