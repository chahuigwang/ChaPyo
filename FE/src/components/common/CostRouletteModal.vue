<script setup>
import { ref, computed, watch } from 'vue'
import { X, RotateCw, Check } from 'lucide-vue-next'
import { colorForUser } from '@/composables/useUserColor'

const props = defineProps({
  open: { type: Boolean, default: false },
  members: { type: Array, default: () => [] }, // [{ userId, nickname }]
})
const emit = defineEmits(['close', 'result'])

const rotation = ref(0)
const spinning = ref(false)
const suspense = ref(false) // 막판 감속 구간 (두구두구…)
const shake = ref(false) // 당첨 순간 모달 흔들림
const flash = ref(false) // 당첨 순간 스포트라이트 플래시
const winner = ref(null)
const confetti = ref([])
let spinTimer = null, suspenseTimer = null, shakeTimer = null, flashTimer = null

function clearTimers() {
  [spinTimer, suspenseTimer, shakeTimer, flashTimer].forEach((t) => t && clearTimeout(t))
  spinTimer = suspenseTimer = shakeTimer = flashTimer = null
}

// 열릴 때마다 이전 상태 초기화
watch(() => props.open, (v) => {
  if (v) {
    winner.value = null; spinning.value = false; suspense.value = false
    shake.value = false; flash.value = false; rotation.value = 0; confetti.value = []
    clearTimers()
  } else {
    clearTimers()
  }
})

const CONFETTI_COLORS = ['#00B7EB', '#F59E0B', '#10B981', '#A855F7', '#EF4444', '#3B82F6', '#EC4899', '#FACC15']
function fireConfetti() {
  const pieces = []
  for (let i = 0; i < 130; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = 140 + Math.random() * 240
    pieces.push({
      id: i,
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist + 160, // 살짝 아래로 흩날림
      rot: (Math.random() * 900 - 450),
      dur: 1.2 + Math.random() * 1.1,
      delay: Math.random() * 0.18,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 10,
    })
  }
  confetti.value = pieces
  flashTimer = window.setTimeout(() => { confetti.value = [] }, 2600)
}

const n = computed(() => props.members.length)
const segAngle = computed(() => (n.value ? 360 / n.value : 360))

// SVG 부채꼴 경로 (top=0°, 시계방향)
const CX = 100, CY = 100, R = 96
function pt(angle, radius = R) {
  const a = (angle * Math.PI) / 180
  return [CX + radius * Math.sin(a), CY - radius * Math.cos(a)]
}
const slices = computed(() =>
  props.members.map((m, i) => {
    const a0 = i * segAngle.value
    const a1 = (i + 1) * segAngle.value
    const [x0, y0] = pt(a0)
    const [x1, y1] = pt(a1)
    const large = segAngle.value > 180 ? 1 : 0
    const mid = a0 + segAngle.value / 2
    const [lx, ly] = pt(mid, R * 0.62)
    return {
      key: m.userId ?? m.nickname ?? i,
      nickname: m.nickname,
      color: colorForUser(m.userId ?? m.nickname),
      path: n.value === 1
        ? `M ${CX} ${CY} m -${R} 0 a ${R} ${R} 0 1 0 ${R * 2} 0 a ${R} ${R} 0 1 0 -${R * 2} 0`
        : `M ${CX} ${CY} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`,
      labelX: lx, labelY: ly, labelAngle: mid,
    }
  })
)

const SPIN_MS = 5200
function spin() {
  if (spinning.value || !n.value) return
  clearTimers()
  winner.value = null
  spinning.value = true
  suspense.value = false
  const idx = Math.floor(Math.random() * n.value)
  const center = idx * segAngle.value + segAngle.value / 2
  const jitter = (Math.random() - 0.5) * segAngle.value * 0.55
  const base = rotation.value
  // 최소 7바퀴 + 당첨자 중앙을 상단 포인터(0°)로 정렬 (더 길고 극적으로)
  const align = (((-center - base) % 360) + 360) % 360
  rotation.value = base + 360 * 7 + align + jitter

  // 막판(마지막 ~1.4s)엔 "두구두구…" 서스펜스 연출
  suspenseTimer = window.setTimeout(() => { suspense.value = true }, SPIN_MS - 1400)

  spinTimer = window.setTimeout(() => {
    winner.value = props.members[idx]
    spinning.value = false
    suspense.value = false
    // 당첨 순간: 모달 흔들림 + 스포트라이트 플래시 + 폭죽
    shake.value = true; flash.value = true
    fireConfetti()
    shakeTimer = window.setTimeout(() => { shake.value = false }, 600)
    flashTimer = window.setTimeout(() => { flash.value = false }, 700)
  }, SPIN_MS)
}

function apply() {
  if (!winner.value) return
  emit('result', winner.value) // 멤버 객체 { userId, nickname }
  emit('close')
}
function reset() { winner.value = null }
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4"
        @click.self="emit('close')"
      >
        <div
          class="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 shadow-2xl p-6 overflow-hidden"
          :class="shake ? 'roulette-shake' : ''"
        >
          <!-- 당첨 스포트라이트 플래시 -->
          <div v-if="flash" class="pointer-events-none absolute inset-0 z-20 roulette-flash" />

          <!-- 폭죽 -->
          <div class="pointer-events-none absolute inset-0 z-30 overflow-visible">
            <span
              v-for="p in confetti" :key="p.id"
              class="confetti-piece"
              :style="{
                width: p.w + 'px', height: p.h + 'px', background: p.color,
                '--tx': p.tx + 'px', '--ty': p.ty + 'px', '--rot': p.rot + 'deg',
                animationDuration: p.dur + 's', animationDelay: p.delay + 's',
              }"
            />
          </div>

          <button
            @click="emit('close')"
            class="absolute top-3 right-3 z-40 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X :size="16" />
          </button>

          <h3 class="text-center text-[15px] font-bold text-slate-900 dark:text-slate-100">비용 담당자 룰렛</h3>
          <p class="text-center text-[12px] mt-0.5 transition-colors"
             :class="suspense ? 'text-rose-500 font-bold roulette-suspense-text' : 'text-slate-400'">
            {{ suspense ? '두구두구두구…' : '돌려서 담당자를 정해보세요' }}
          </p>

          <div v-if="!n" class="py-10 text-center text-[13px] text-slate-400">참여자가 없습니다.</div>

          <template v-else>
            <!-- 휠 -->
            <div class="relative mx-auto my-5 w-60 h-60">
              <!-- 스핀 중 글로우 펄스 링 -->
              <div
                v-if="spinning"
                class="absolute -inset-2 rounded-full pointer-events-none roulette-glow"
                :class="suspense ? 'roulette-glow--suspense' : ''"
              />
              <!-- 포인터 (스핀 중 떨림) -->
              <div class="absolute left-1/2 -top-1 -translate-x-1/2 z-10"
                   :class="spinning ? 'roulette-pointer-tick' : ''"
                   style="width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:18px solid #ef4444;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3));" />
              <svg viewBox="0 0 200 200" class="relative w-full h-full drop-shadow-md">
                <g :style="{ transform: `rotate(${rotation}deg)`, transformOrigin: '100px 100px', transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12,0.78,0.18,1)` : 'none' }">
                  <path
                    v-for="s in slices" :key="s.key"
                    :d="s.path" :fill="s.color"
                    stroke="#fff" stroke-width="1.5"
                  />
                  <text
                    v-for="s in slices" :key="'t'+s.key"
                    :x="s.labelX" :y="s.labelY"
                    fill="#fff" font-size="11" font-weight="700"
                    text-anchor="middle" dominant-baseline="middle"
                    :transform="`rotate(${s.labelAngle}, ${s.labelX}, ${s.labelY})`"
                  >{{ s.nickname.length > 6 ? s.nickname.slice(0, 6) + '…' : s.nickname }}</text>
                </g>
                <circle :cx="100" :cy="100" r="14" fill="#fff" stroke="#e2e8f0" stroke-width="2" />
              </svg>
            </div>

            <!-- 결과 -->
            <div v-if="winner" class="text-center mb-3 roulette-winner">
              <p class="text-[16px] font-extrabold text-slate-900 dark:text-slate-100">
                🎉 <span :style="{ color: colorForUser(winner.userId ?? winner.nickname) }">{{ winner.nickname }}</span> 당첨!
              </p>
            </div>

            <div class="flex gap-2">
              <button
                v-if="!winner"
                @click="spin"
                :disabled="spinning"
                class="flex-1 h-10 rounded-xl bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-80"
                :class="spinning ? 'roulette-btn-pulse' : ''"
              >
                <RotateCw :size="15" :class="spinning ? 'animate-spin' : ''" /> {{ spinning ? (suspense ? '두구두구…' : '돌리는 중…') : '룰렛 돌리기' }}
              </button>
              <template v-else>
                <button
                  @click="reset"
                  class="flex-1 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >다시</button>
                <button
                  @click="apply"
                  class="flex-1 h-10 rounded-xl bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check :size="15" /> 담당자 지정
                </button>
              </template>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 폭죽 파티클: 패널 중앙에서 사방으로 터져 나간다 */
.confetti-piece {
  position: absolute;
  left: 50%;
  top: 42%;
  border-radius: 2px;
  opacity: 0;
  transform: translate(-50%, -50%);
  animation-name: confetti-fly;
  animation-timing-function: cubic-bezier(0.18, 0.7, 0.4, 1);
  animation-fill-mode: forwards;
}
@keyframes confetti-fly {
  0% { opacity: 1; transform: translate(-50%, -50%) rotate(0deg); }
  100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) rotate(var(--rot)); }
}

/* 스핀 중 글로우 펄스 링 */
.roulette-glow {
  background: radial-gradient(circle, transparent 58%, color-mix(in srgb, var(--primary, #00B7EB) 45%, transparent) 72%, transparent 80%);
  animation: roulette-glow-pulse 1s ease-in-out infinite;
}
.roulette-glow--suspense {
  background: radial-gradient(circle, transparent 56%, rgba(239,68,68,0.55) 72%, transparent 82%);
  animation: roulette-glow-pulse 0.4s ease-in-out infinite;
}
@keyframes roulette-glow-pulse {
  0%, 100% { opacity: 0.35; transform: scale(0.98); }
  50% { opacity: 0.9; transform: scale(1.04); }
}

/* 포인터 떨림(틱) */
.roulette-pointer-tick { animation: roulette-tick 0.09s linear infinite; transform-origin: top center; }
@keyframes roulette-tick {
  0% { transform: translateX(-50%) rotate(0deg); }
  50% { transform: translateX(-50%) rotate(-7deg); }
  100% { transform: translateX(-50%) rotate(0deg); }
}

/* 당첨 순간 모달 흔들림 */
.roulette-shake { animation: roulette-shake 0.55s cubic-bezier(.36,.07,.19,.97); }
@keyframes roulette-shake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-7px); }
  40%, 60% { transform: translateX(7px); }
}

/* 당첨 스포트라이트 플래시 */
.roulette-flash {
  background: radial-gradient(circle at 50% 45%, rgba(255,255,255,0.85), transparent 65%);
  animation: roulette-flash 0.7s ease-out forwards;
}
@keyframes roulette-flash {
  0% { opacity: 0.9; }
  100% { opacity: 0; }
}

/* 당첨자 텍스트 팝인 */
.roulette-winner { animation: roulette-pop 0.55s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes roulette-pop {
  0% { opacity: 0; transform: scale(0.5); }
  60% { transform: scale(1.18); }
  100% { opacity: 1; transform: scale(1); }
}

/* 서스펜스 텍스트 깜빡 */
.roulette-suspense-text { animation: roulette-suspense 0.4s steps(2) infinite; }
@keyframes roulette-suspense { 50% { opacity: 0.4; } }

/* 스핀 버튼 펄스 */
.roulette-btn-pulse { animation: roulette-btn-pulse 0.8s ease-in-out infinite; }
@keyframes roulette-btn-pulse {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--primary, #00B7EB) 50%, transparent); }
  50% { box-shadow: 0 0 0 6px transparent; }
}
</style>
