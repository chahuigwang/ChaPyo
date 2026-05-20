<script setup>
import { ref, computed } from 'vue'
import { Plane, Loader2, Check, ArrowLeft } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { Button, Input } from '@/components/common'

const auth = useAuthStore()

const id = ref('')
const password = ref('')
const error = ref('')

// Signup form state
const signupId = ref('')
const signupPassword = ref('')
const signupPasswordConfirm = ref('')
const signupName = ref('')
const signupError = ref('')
const signupStatus = ref('idle') // 'idle' | 'loading' | 'success'

const flipped = ref(false)

// 'idle' | 'loading' | 'success'
const status = ref('idle')
const visible = ref(true)
const pendingCreds = ref(null)

const isLoading = computed(() => status.value === 'loading')
const isSuccess = computed(() => status.value === 'success')
const isBusy = computed(() => status.value !== 'idle')

const isSignupLoading = computed(() => signupStatus.value === 'loading')
const isSignupSuccess = computed(() => signupStatus.value === 'success')
const isSignupBusy = computed(() => signupStatus.value !== 'idle')

async function submit() {
  if (isBusy.value) return
  error.value = ''

  if (!id.value.trim() || !password.value.trim()) {
    error.value = '아이디와 비밀번호를 입력해 주세요.'
    return
  }

  status.value = 'loading'
  pendingCreds.value = { id: id.value, password: password.value }

  await new Promise((r) => setTimeout(r, 1500))

  status.value = 'success'

  await new Promise((r) => setTimeout(r, 800))

  visible.value = false
}

async function onTicketAfterLeave() {
  const creds = pendingCreds.value
  pendingCreds.value = null
  if (!creds) return
  const res = await auth.login(creds)
  if (!res.ok) {
    error.value = res.message
    status.value = 'idle'
    visible.value = true
  }
}

function flipToSignup() {
  if (isBusy.value) return
  error.value = ''
  flipped.value = true
}
function flipToLogin() {
  if (isSignupBusy.value) return
  signupError.value = ''
  flipped.value = false
}

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
  await new Promise((r) => setTimeout(r, 1200))
  signupStatus.value = 'success'
  await new Promise((r) => setTimeout(r, 800))
  // Hand off to login form pre-filled
  id.value = signupId.value
  password.value = signupPassword.value
  signupStatus.value = 'idle'
  signupId.value = ''
  signupPassword.value = ''
  signupPasswordConfirm.value = ''
  signupName.value = ''
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
        <section
          class="md:col-span-6 relative min-h-[460px] md:min-h-[560px] overflow-hidden"
        >
          <div
            class="absolute inset-0 bg-cover bg-center"
            style="background-image: url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80');"
          />
          <div class="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-900/70" />

          <div class="relative h-full flex flex-col justify-between p-10 text-white">
            <div class="flex items-center gap-2 text-sm tracking-widest uppercase opacity-80">
              <Plane :size="16" class="-rotate-12" />
              <span>Enjoy Trip</span>
            </div>

            <div class="space-y-3">
              <p class="text-xs tracking-[0.3em] uppercase text-white/70">Boarding Pass</p>
              <h1 class="text-4xl md:text-5xl font-semibold leading-tight">
                차표 : 여행의 시작
              </h1>
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

        <!-- Right 40% : Form -->
        <section class="md:col-span-4 p-8 md:p-10 flex flex-col justify-center bg-white dark:bg-slate-900">
          <div class="mb-8">
            <p class="text-[11px] tracking-[0.3em] uppercase text-slate-400">Passenger</p>
            <h2 class="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">로그인</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">탑승을 위해 정보를 입력하세요.</p>
          </div>

          <form class="space-y-5" @submit.prevent="submit">
            <label class="block">
              <span class="text-[11px] font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">아이디</span>
              <Input
                v-model="id"
                :disabled="isBusy"
                class="mt-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white"
                placeholder="example@enjoytrip.com"
              />
            </label>
            <label class="block">
              <span class="text-[11px] font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">비밀번호</span>
              <Input
                v-model="password"
                type="password"
                :disabled="isBusy"
                class="mt-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white"
                placeholder="••••••••"
              />
            </label>

            <p v-if="error" class="text-xs text-red-500">{{ error }}</p>

            <div class="pt-2 space-y-2">
              <Button
                type="submit"
                size="lg"
                class="w-full submit-btn transition-colors duration-300 ease-out"
                :class="{ 'is-success': isSuccess }"
                :disabled="isBusy"
                :aria-busy="isLoading"
              >
                <span class="relative inline-flex items-center justify-center w-full h-5">
                  <Transition name="btn-content" mode="out-in">
                    <Loader2
                      v-if="isLoading"
                      key="loading"
                      :size="20"
                      class="animate-spin"
                    />
                    <Check
                      v-else-if="isSuccess"
                      key="success"
                      :size="20"
                      class="stroke-[3]"
                    />
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
            </div>
          </form>

          <p class="mt-8 text-[11px] text-slate-400 text-center tracking-wider">
            * Mock 인증입니다. 아무 값이나 입력해도 로그인됩니다.
          </p>
        </section>

        <!-- Perforated tear-off cutouts -->
        <span class="hidden md:block ticket-notch ticket-notch-top" />
        <span class="hidden md:block ticket-notch ticket-notch-bottom" />
        </div>

        <!-- BACK : Signup -->
        <div
          class="flip-face flip-face-back ticket w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl
                 grid grid-cols-1 md:grid-cols-10 overflow-hidden"
        >
          <!-- Left 60% : Brand (back) -->
          <section
            class="md:col-span-6 relative min-h-[460px] md:min-h-[560px] overflow-hidden"
          >
            <div
              class="absolute inset-0 bg-cover bg-center"
              style="background-image: url('https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=1600&q=80');"
            />
            <div class="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-900/70" />

            <div class="relative h-full flex flex-col justify-between p-10 text-white">
              <div class="flex items-center gap-2 text-sm tracking-widest uppercase opacity-80">
                <Plane :size="16" class="-rotate-12" />
                <span>Enjoy Trip</span>
              </div>

              <div class="space-y-3">
                <p class="text-xs tracking-[0.3em] uppercase text-white/70">New Passenger</p>
                <h1 class="text-4xl md:text-5xl font-semibold leading-tight">
                  여정에 합류하세요
                </h1>
                <p class="text-sm md:text-base text-white/70 max-w-sm">
                  잠깐의 가입으로 당신만의 여행 계획을 저장하고 공유할 수 있어요.
                </p>
              </div>

              <div class="flex items-end justify-between text-[11px] tracking-widest uppercase text-white/60">
                <div>
                  <p class="text-white/40">Class</p>
                  <p class="text-white">EXPLORER</p>
                </div>
                <div class="text-right">
                  <p class="text-white/40">Seat</p>
                  <p class="text-white">FREE</p>
                </div>
              </div>
            </div>
          </section>

          <!-- Right 40% : Signup form -->
          <section class="md:col-span-4 p-8 md:p-10 flex flex-col justify-center bg-white dark:bg-slate-900">
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
                title="로그인으로 돌아가기"
              >
                <ArrowLeft :size="13" /> 로그인
              </button>
            </div>

            <form class="space-y-4" @submit.prevent="submitSignup">
              <label class="block">
                <span class="text-[11px] font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">이름</span>
                <Input
                  v-model="signupName"
                  :disabled="isSignupBusy"
                  class="mt-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white"
                  placeholder="홍길동"
                />
              </label>
              <label class="block">
                <span class="text-[11px] font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">아이디</span>
                <Input
                  v-model="signupId"
                  :disabled="isSignupBusy"
                  class="mt-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white"
                  placeholder="example@enjoytrip.com"
                />
              </label>
              <label class="block">
                <span class="text-[11px] font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">비밀번호</span>
                <Input
                  v-model="signupPassword"
                  type="password"
                  :disabled="isSignupBusy"
                  class="mt-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white"
                  placeholder="••••••••"
                />
              </label>
              <label class="block">
                <span class="text-[11px] font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">비밀번호 확인</span>
                <Input
                  v-model="signupPasswordConfirm"
                  type="password"
                  :disabled="isSignupBusy"
                  class="mt-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white"
                  placeholder="••••••••"
                />
              </label>

              <p v-if="signupError" class="text-xs text-red-500">{{ signupError }}</p>

              <div class="pt-1 space-y-2">
                <Button
                  type="submit"
                  size="lg"
                  class="w-full submit-btn transition-colors duration-300 ease-out"
                  :class="{ 'is-success': isSignupSuccess }"
                  :disabled="isSignupBusy"
                  :aria-busy="isSignupLoading"
                >
                  <span class="relative inline-flex items-center justify-center w-full h-5">
                    <Transition name="btn-content" mode="out-in">
                      <Loader2
                        v-if="isSignupLoading"
                        key="loading"
                        :size="20"
                        class="animate-spin"
                      />
                      <Check
                        v-else-if="isSignupSuccess"
                        key="success"
                        :size="20"
                        class="stroke-[3]"
                      />
                      <span v-else key="idle">가입하기</span>
                    </Transition>
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  class="w-full"
                  :disabled="isSignupBusy"
                  @click="flipToLogin"
                >
                  로그인으로 돌아가기
                </Button>
              </div>
            </form>
          </section>

          <!-- Perforated tear-off cutouts (back) -->
          <span class="hidden md:block ticket-notch ticket-notch-top" />
          <span class="hidden md:block ticket-notch ticket-notch-bottom" />
        </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* 3D flip scene */
.flip-scene {
  perspective: 2400px;
}
.flip-card {
  display: grid;
  transform-style: preserve-3d;
  transition: transform 800ms cubic-bezier(0.22, 1, 0.36, 1);
}
.flip-card.is-flipped {
  transform: rotateY(180deg);
}
.flip-face {
  grid-area: 1 / 1;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.flip-face-front {
  transform: rotateY(0deg);
}
.flip-face-back {
  transform: rotateY(180deg);
}

.ticket {
  position: relative;
}

/* Vertical dashed perforation at the 60% mark */
.ticket::before {
  content: '';
  position: absolute;
  top: 24px;
  bottom: 24px;
  left: 60%;
  width: 0;
  border-left: 2px dashed rgb(203 213 225); /* slate-300 */
  pointer-events: none;
}

@media (max-width: 767px) {
  .ticket::before { display: none; }
}

/* Semi-circle cutouts that punch through to the page background */
.ticket-notch {
  position: absolute;
  left: 60%;
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  background: rgb(248 250 252); /* slate-50, matches page bg */
  transform: translateX(-50%);
  pointer-events: none;
}
.ticket-notch-top { top: -14px; }
.ticket-notch-bottom { bottom: -14px; }

:global(.dark) .ticket-notch {
  background: rgb(2 6 23); /* slate-950 */
}

/* Ticket slide-out animation */
.ticket-slide-enter-active {
  transition: opacity 500ms ease-out, transform 500ms ease-out;
}
.ticket-slide-leave-active {
  transition: opacity 500ms ease-in-out, transform 500ms ease-in-out;
}
.ticket-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.ticket-slide-leave-to {
  opacity: 0;
  transform: translateY(-50px);
}

/* Success state for the submit button */
.submit-btn.is-success,
.submit-btn.is-success:hover,
.submit-btn.is-success:disabled {
  background-color: rgb(34 197 94); /* green-500 */
  color: white;
  opacity: 1;
}

/* Smooth swap between idle / loading / success icons */
.btn-content-enter-active,
.btn-content-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.btn-content-enter-from {
  opacity: 0;
  transform: scale(0.7);
}
.btn-content-leave-to {
  opacity: 0;
  transform: scale(0.7);
}
.btn-content-enter-active,
.btn-content-leave-active {
  position: absolute;
}
</style>
