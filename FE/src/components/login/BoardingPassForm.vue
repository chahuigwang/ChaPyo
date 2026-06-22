<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plane, Loader2, ArrowLeft, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { Button, Input } from '@/components/common'

const router = useRouter()
const auth = useAuthStore()

// ─── Login ───────────────────────────────────────────────
const id = ref('')
const password = ref('')
const error = ref('')
// 'idle' | 'loading' | 'success' | 'error'
const status = ref('idle')
const visible = ref(true)

const isLoading = computed(() => status.value === 'loading')
const isSuccess = computed(() => status.value === 'success')
const isError  = computed(() => status.value === 'error')
const isBusy   = computed(() => status.value !== 'idle')

async function submit() {
  if (isBusy.value) return
  error.value = ''

  if (!id.value.trim() || !password.value.trim()) {
    error.value = '이메일과 비밀번호를 입력해 주세요.'
    return
  }

  status.value = 'loading'
  const res = await auth.login({ id: id.value, password: password.value })

  if (!res.ok) {
    error.value = res.message ?? '로그인에 실패했습니다.'
    status.value = 'error'
    await new Promise((r) => setTimeout(r, 1500))
    status.value = 'idle'
    return
  }

  status.value = 'success'
  await new Promise((r) => setTimeout(r, 800))
  visible.value = false
}

function onTicketAfterLeave() {
  auth.commitLogin()
  router.push('/list')
}

// ─── Flip ────────────────────────────────────────────────
const flipped  = ref(false)
// 뒷면 모드: 'signup' | 'reset'
const backMode = ref('signup')

function flipToSignup() {
  if (isBusy.value) return
  error.value = ''
  backMode.value = 'signup'
  flipped.value = true
}
function flipToReset() {
  if (isBusy.value) return
  error.value = ''
  backMode.value = 'reset'
  flipped.value = true
}
function flipToLogin() {
  if (isSignupBusy.value || isResetBusy.value) return
  signupError.value = ''
  resetError.value = ''
  flipped.value = false
}

// ─── Signup ──────────────────────────────────────────────
const signupId              = ref('')
const signupPassword        = ref('')
const signupPasswordConfirm = ref('')
const signupName            = ref('')
const signupError           = ref('')
const signupStatus          = ref('idle')

const isSignupLoading = computed(() => signupStatus.value === 'loading')
const isSignupSuccess = computed(() => signupStatus.value === 'success')
const isSignupBusy    = computed(() => signupStatus.value !== 'idle')

async function submitSignup() {
  if (isSignupBusy.value) return
  signupError.value = ''
  if (!signupName.value.trim() || !signupId.value.trim() || !signupPassword.value.trim()) {
    signupError.value = '모든 항목을 입력해 주세요.'
    return
  }
  if (signupPassword.value !== signupPasswordConfirm.value) {
    signupError.value = '비밀번호가 일치하지 않습니다.'
    return
  }
  signupStatus.value = 'loading'
  const res = await auth.register({
    id: signupId.value.trim(),
    password: signupPassword.value,
    name: signupName.value.trim(),
  })
  if (!res.ok) {
    signupError.value = res.message ?? '회원가입에 실패했습니다.'
    signupStatus.value = 'idle'
    return
  }
  signupStatus.value = 'success'
  await new Promise((r) => setTimeout(r, 800))
  id.value = signupId.value
  password.value = signupPassword.value
  signupStatus.value = 'idle'
  signupId.value = ''
  signupPassword.value = ''
  signupPasswordConfirm.value = ''
  signupName.value = ''
  flipped.value = false
}

// ─── Password Reset ──────────────────────────────────────
const resetNickname        = ref('')
const resetEmail           = ref('')
const resetNewPassword     = ref('')
const resetPasswordConfirm = ref('')
const resetError           = ref('')
const resetStatus          = ref('idle') // 'idle' | 'loading' | 'success' | 'error'

const isResetLoading = computed(() => resetStatus.value === 'loading')
const isResetSuccess = computed(() => resetStatus.value === 'success')
const isResetError   = computed(() => resetStatus.value === 'error')
const isResetBusy    = computed(() => resetStatus.value !== 'idle')

async function submitReset() {
  if (isResetBusy.value) return
  resetError.value = ''
  if (!resetNickname.value.trim() || !resetEmail.value.trim() || !resetNewPassword.value.trim()) {
    resetError.value = '모든 항목을 입력해 주세요.'
    return
  }
  if (resetNewPassword.value !== resetPasswordConfirm.value) {
    resetError.value = '비밀번호가 일치하지 않습니다.'
    return
  }
  resetStatus.value = 'loading'
  const res = await auth.resetPassword({
    nickname: resetNickname.value.trim(),
    email: resetEmail.value.trim(),
    newPassword: resetNewPassword.value,
  })
  if (!res.ok) {
    resetError.value = res.message ?? '비밀번호 재설정에 실패했습니다.'
    resetStatus.value = 'error'
    await new Promise((r) => setTimeout(r, 1500))
    resetStatus.value = 'idle'
    return
  }
  resetStatus.value = 'success'
  await new Promise((r) => setTimeout(r, 800))
  resetNickname.value = ''
  resetEmail.value = ''
  resetNewPassword.value = ''
  resetPasswordConfirm.value = ''
  resetStatus.value = 'idle'
  flipped.value = false
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-6">
    <Transition name="ticket-slide" appear @after-leave="onTicketAfterLeave">
      <div
        v-if="visible"
        class="flip-scene w-full max-w-5xl"
      >
        <div
          class="flip-card w-full"
          :class="{ 'is-flipped': flipped }"
        >
        <!-- FRONT : Login -->
        <div
          class="flip-face flip-face-front ticket w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl
                 grid grid-cols-1 md:grid-cols-10 overflow-hidden"
        >
          <!-- Left 60% : Brand -->
          <section class="md:col-span-6 relative min-h-[460px] md:min-h-[560px] overflow-hidden">
            <div
              class="absolute inset-0 bg-cover bg-center"
              style="background-image: url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=80');"
            />
            <div class="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-900/70" />
            <div class="relative h-full flex flex-col justify-between p-10 text-white">
              <div class="flex items-center gap-2 text-sm tracking-widest uppercase opacity-80">
                <Plane :size="16" class="-rotate-12" />
                <span>Enjoy Trip</span>
              </div>
              <div class="space-y-3">
                <p class="text-xs tracking-[0.3em] uppercase text-white/70">Boarding Pass</p>
                <h1 class="text-4xl md:text-5xl font-semibold leading-tight">차표 : 여행의 시작</h1>
                <p class="text-sm md:text-base text-white/70 max-w-sm">
                  한 장의 차표에서 시작되는 여정. 당신의 다음 도시를 계획해보세요.
                </p>
              </div>
              <div class="flex items-end justify-between text-[11px] tracking-widest uppercase text-white/60">
                <div>
                  <p class="text-white/40">From</p>
                  <p class="text-white">SEOUL · ICN</p>
                </div>
                <div class="text-right">
                  <p class="text-white/40">To</p>
                  <p class="text-white">ANYWHERE</p>
                </div>
              </div>
            </div>
          </section>

          <!-- Right 40% : Login Form -->
          <section class="md:col-span-4 p-8 md:p-10 flex flex-col justify-center bg-white dark:bg-slate-900">
            <div class="mb-8">
              <p class="text-[11px] tracking-[0.3em] uppercase text-slate-400">Passenger</p>
              <h2 class="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">로그인</h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">탑승을 위해 정보를 입력하세요.</p>
            </div>

            <form class="space-y-5" @submit.prevent="submit">
              <label class="block">
                <span class="text-[11px] font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">이메일</span>
                <Input
                  v-model="id"
                  :disabled="isLoading || isSuccess"
                  class="mt-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900"
                  placeholder="example@enjoytrip.com"
                />
              </label>
              <label class="block">
                <span class="text-[11px] font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">비밀번호</span>
                <Input
                  v-model="password"
                  type="password"
                  :disabled="isLoading || isSuccess"
                  class="mt-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900"
                  placeholder="••••••••"
                />
              </label>

              <p v-if="error" class="text-xs text-red-500">{{ error }}</p>

              <div class="pt-2 space-y-2">
                <Button
                  type="submit"
                  size="lg"
                  class="w-full submit-btn transition-colors duration-300 ease-out"
                  :class="{ 'is-success': isSuccess, 'is-error': isError }"
                  :disabled="isBusy"
                  :aria-busy="isLoading"
                >
                  <span class="relative inline-flex items-center justify-center w-full h-5">
                    <Transition name="btn-content" mode="out-in" type="transition">
                      <Loader2 v-if="isLoading" key="loading" :size="20" class="animate-spin" />
                      <svg
                        v-else-if="isSuccess"
                        key="success"
                        class="check-draw"
                        viewBox="0 0 24 24" width="22" height="22"
                        fill="none" stroke="currentColor" stroke-width="2.8"
                        stroke-linecap="round" stroke-linejoin="round"
                      >
                        <polyline class="check-path" points="4,13 9,18 20,7" />
                      </svg>
                      <svg
                        v-else-if="isError"
                        key="error"
                        class="check-draw"
                        viewBox="0 0 24 24" width="22" height="22"
                        fill="none" stroke="currentColor" stroke-width="2.8"
                        stroke-linecap="round" stroke-linejoin="round"
                      >
                        <line class="check-path" x1="18" y1="6" x2="6" y2="18" />
                        <line class="check-path" x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      <span v-else key="idle">로그인</span>
                    </Transition>
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  class="w-full"
                  :disabled="isBusy"
                  @click="flipToSignup"
                >
                  회원가입
                </Button>
                <button
                  type="button"
                  class="w-full text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 tracking-wider disabled:opacity-40"
                  :disabled="isBusy"
                  @click="flipToReset"
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>
            </form>
          </section>

          <span class="hidden md:block ticket-notch ticket-notch-top" />
          <span class="hidden md:block ticket-notch ticket-notch-bottom" />
        </div>

        <!-- BACK : Signup / Password Reset -->
        <div
          class="flip-face flip-face-back ticket w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl
                 grid grid-cols-1 md:grid-cols-10 overflow-hidden"
        >
          <!-- Left 60% : Brand (changes per mode) -->
          <section class="md:col-span-6 relative min-h-[460px] md:min-h-[560px] overflow-hidden">
            <div
              class="absolute inset-0 bg-cover bg-center"
              :style="backMode === 'signup'
                ? 'background-image: url(https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80);'
                : 'background-image: url(https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80);'"
            />
            <div class="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-900/70" />
            <div class="relative h-full flex flex-col justify-between p-10 text-white">
              <div class="flex items-center gap-2 text-sm tracking-widest uppercase opacity-80">
                <Plane :size="16" class="-rotate-12" />
                <span>Enjoy Trip</span>
              </div>
              <template v-if="backMode === 'signup'">
                <div class="space-y-3">
                  <p class="text-xs tracking-[0.3em] uppercase text-white/70">New Passenger</p>
                  <h1 class="text-4xl md:text-5xl font-semibold leading-tight">여정에 합류하세요</h1>
                  <p class="text-sm md:text-base text-white/70 max-w-sm">
                    잠깐의 가입으로 당신만의 여행 계획을 저장하고 공유할 수 있어요.
                  </p>
                </div>
                <div class="flex items-end justify-between text-[11px] tracking-widest uppercase text-white/60">
                  <div><p class="text-white/40">Class</p><p class="text-white">EXPLORER</p></div>
                  <div class="text-right"><p class="text-white/40">Seat</p><p class="text-white">FREE</p></div>
                </div>
              </template>
              <template v-else>
                <div class="space-y-3">
                  <p class="text-xs tracking-[0.3em] uppercase text-white/70">Lost Ticket</p>
                  <h1 class="text-4xl md:text-5xl font-semibold leading-tight">차표를 재발급합니다</h1>
                  <p class="text-sm md:text-base text-white/70 max-w-sm">
                    닉네임과 이메일로 본인을 확인한 후 새 비밀번호를 설정하세요.
                  </p>
                </div>
                <div class="flex items-end justify-between text-[11px] tracking-widest uppercase text-white/60">
                  <div><p class="text-white/40">Status</p><p class="text-white">REISSUE</p></div>
                  <div class="text-right"><p class="text-white/40">Gate</p><p class="text-white">SECURE</p></div>
                </div>
              </template>
            </div>
          </section>

          <!-- Right 40% : Form -->
          <section class="md:col-span-4 p-8 md:p-10 flex flex-col justify-center bg-white dark:bg-slate-900">

            <!-- Signup Form -->
            <template v-if="backMode === 'signup'">
              <div class="mb-6 flex items-start justify-between">
                <div>
                  <p class="text-[11px] tracking-[0.3em] uppercase text-slate-400">Register</p>
                  <h2 class="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">회원가입</h2>
                  <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">새 차표를 발권하세요.</p>
                </div>
                <button
                  type="button"
                  @click="flipToLogin"
                  :disabled="isSignupBusy"
                  class="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-50"
                >
                  <ArrowLeft :size="13" /> 로그인
                </button>
              </div>

              <form class="space-y-4" @submit.prevent="submitSignup">
                <label class="block">
                  <span class="text-[11px] font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">닉네임</span>
                  <Input v-model="signupName" :disabled="isSignupBusy" class="mt-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900" placeholder="홍길동" />
                </label>
                <label class="block">
                  <span class="text-[11px] font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">이메일</span>
                  <Input v-model="signupId" :disabled="isSignupBusy" class="mt-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900" placeholder="example@enjoytrip.com" />
                </label>
                <label class="block">
                  <span class="text-[11px] font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">비밀번호</span>
                  <Input v-model="signupPassword" type="password" :disabled="isSignupBusy" class="mt-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900" placeholder="••••••••" />
                </label>
                <label class="block">
                  <span class="text-[11px] font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">비밀번호 확인</span>
                  <Input v-model="signupPasswordConfirm" type="password" :disabled="isSignupBusy" class="mt-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900" placeholder="••••••••" />
                </label>

                <p v-if="signupError" class="text-xs text-red-500">{{ signupError }}</p>

                <div class="pt-1 space-y-2">
                  <Button
                    type="submit" size="lg"
                    class="w-full submit-btn transition-colors duration-300 ease-out"
                    :class="{ 'is-success': isSignupSuccess }"
                    :disabled="isSignupBusy" :aria-busy="isSignupLoading"
                  >
                    <span class="relative inline-flex items-center justify-center w-full h-5">
                      <Transition name="btn-content" mode="out-in" type="transition">
                        <Loader2 v-if="isSignupLoading" key="loading" :size="20" class="animate-spin" />
                        <svg v-else-if="isSignupSuccess" key="success" class="check-draw" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                          <polyline class="check-path" points="4,13 9,18 20,7" />
                        </svg>
                        <span v-else key="idle">가입하기</span>
                      </Transition>
                    </span>
                  </Button>
                  <Button type="button" variant="ghost" size="lg" class="w-full" :disabled="isSignupBusy" @click="flipToLogin">
                    로그인으로 돌아가기
                  </Button>
                </div>
              </form>
            </template>

            <!-- Password Reset Form -->
            <template v-else>
              <div class="mb-6 flex items-start justify-between">
                <div>
                  <p class="text-[11px] tracking-[0.3em] uppercase text-slate-400">Reissue</p>
                  <h2 class="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">비밀번호 재설정</h2>
                  <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">본인 확인 후 새 비밀번호를 설정하세요.</p>
                </div>
                <button
                  type="button"
                  @click="flipToLogin"
                  :disabled="isResetBusy"
                  class="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-50"
                >
                  <ArrowLeft :size="13" /> 로그인
                </button>
              </div>

              <form class="space-y-4" @submit.prevent="submitReset">
                <label class="block">
                  <span class="text-[11px] font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">닉네임</span>
                  <Input v-model="resetNickname" :disabled="isResetBusy" class="mt-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900" placeholder="홍길동" />
                </label>
                <label class="block">
                  <span class="text-[11px] font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">이메일</span>
                  <Input v-model="resetEmail" :disabled="isResetBusy" class="mt-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900" placeholder="example@enjoytrip.com" />
                </label>
                <label class="block">
                  <span class="text-[11px] font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">새 비밀번호</span>
                  <Input v-model="resetNewPassword" type="password" :disabled="isResetBusy" class="mt-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900" placeholder="••••••••" />
                </label>
                <label class="block">
                  <span class="text-[11px] font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">비밀번호 확인</span>
                  <Input v-model="resetPasswordConfirm" type="password" :disabled="isResetBusy" class="mt-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900" placeholder="••••••••" />
                </label>

                <p v-if="resetError" class="text-xs text-red-500">{{ resetError }}</p>

                <div class="pt-1 space-y-2">
                  <Button
                    type="submit" size="lg"
                    class="w-full submit-btn transition-colors duration-300 ease-out"
                    :class="{ 'is-success': isResetSuccess, 'is-error': isResetError }"
                    :disabled="isResetBusy" :aria-busy="isResetLoading"
                  >
                    <span class="relative inline-flex items-center justify-center w-full h-5">
                      <Transition name="btn-content" mode="out-in" type="transition">
                        <Loader2 v-if="isResetLoading" key="loading" :size="20" class="animate-spin" />
                        <svg v-else-if="isResetSuccess" key="success" class="check-draw" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                          <polyline class="check-path" points="4,13 9,18 20,7" />
                        </svg>
                        <svg v-else-if="isResetError" key="error" class="check-draw" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                          <line class="check-path" x1="18" y1="6" x2="6" y2="18" />
                          <line class="check-path" x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        <span v-else key="idle">재설정하기</span>
                      </Transition>
                    </span>
                  </Button>
                  <Button type="button" variant="ghost" size="lg" class="w-full" :disabled="isResetBusy" @click="flipToLogin">
                    로그인으로 돌아가기
                  </Button>
                </div>
              </form>
            </template>

          </section>

          <span class="hidden md:block ticket-notch ticket-notch-top" />
          <span class="hidden md:block ticket-notch ticket-notch-bottom" />
        </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.flip-scene { perspective: 2400px; }
.flip-card {
  display: grid;
  transform-style: preserve-3d;
  transition: transform 800ms cubic-bezier(0.22, 1, 0.36, 1);
}
.flip-card.is-flipped { transform: rotateY(180deg); }
.flip-face {
  grid-area: 1 / 1;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.flip-face-front { transform: rotateY(0deg); }
.flip-face-back  { transform: rotateY(180deg); }

.ticket { position: relative; }
.ticket::before {
  content: '';
  position: absolute;
  top: 24px; bottom: 24px; left: 60%;
  width: 0;
  border-left: 2px dashed rgb(203 213 225);
  pointer-events: none;
}
@media (max-width: 767px) { .ticket::before { display: none; } }

.ticket-notch {
  position: absolute;
  left: 60%;
  width: 28px; height: 28px;
  border-radius: 9999px;
  background: rgb(248 250 252);
  transform: translateX(-50%);
  pointer-events: none;
}
.ticket-notch-top    { top: -14px; }
.ticket-notch-bottom { bottom: -14px; }
:global(.dark) .ticket-notch { background: rgb(2 6 23); }

.ticket-slide-enter-active { transition: opacity 500ms ease-out, transform 500ms ease-out; }
.ticket-slide-leave-active  { transition: opacity 500ms ease-in-out, transform 500ms ease-in-out; }
.ticket-slide-enter-from    { opacity: 0; transform: translateY(20px); }
.ticket-slide-leave-to      { opacity: 0; transform: translateY(-50px); }

.submit-btn.is-success,
.submit-btn.is-success:hover,
.submit-btn.is-success:disabled {
  background-color: rgb(34 197 94);
  color: white;
  opacity: 1;
}
.submit-btn.is-error,
.submit-btn.is-error:hover,
.submit-btn.is-error:disabled {
  background-color: rgb(239 68 68);
  color: white;
  opacity: 1;
}

.check-path {
  stroke-dasharray: 30;
  stroke-dashoffset: 30;
  animation: draw-check 0.35s cubic-bezier(0.22, 1, 0.36, 1) 0.05s forwards;
}
@keyframes draw-check { to { stroke-dashoffset: 0; } }

.check-draw { animation: pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
@keyframes pop-in {
  from { transform: scale(0.6); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}

.btn-content-enter-active,
.btn-content-leave-active { transition: opacity 200ms ease, transform 200ms ease; }
.btn-content-enter-from   { opacity: 0; transform: scale(0.7); }
.btn-content-leave-to     { opacity: 0; transform: scale(0.7); }
.btn-content-enter-active,
.btn-content-leave-active { position: absolute; }
</style>
