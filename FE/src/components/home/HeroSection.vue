<script setup>
import { Sparkles, Route, Wallet, LogIn } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/common'

const auth = useAuthStore()

const features = [
  { icon: Sparkles, title: 'AI 페르소나 추천', desc: '플래너 · 미식가 · 가성비 · 럭셔리, 원하는 스타일로 대화' },
  { icon: Route, title: '동선 자동 정리', desc: '추천 장소를 클릭만으로 일자별 일정에 정리' },
  { icon: Wallet, title: '한국관광공사 데이터 기반', desc: '실제 관광 정보를 활용한 신뢰도 높은 코스' },
]
</script>

<template>
  <div class="flex-1 overflow-y-auto flex items-center justify-center">
    <div class="mx-auto max-w-3xl px-8 py-20 text-center">
      <span class="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wider uppercase">
        <Sparkles :size="11" /> ChaPyo · AI Travel Planner
      </span>

      <h1 class="mt-8 text-5xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-[1.1]">
        대화만으로 완성되는<br />
        당신만의 여행 일정
      </h1>
      <p class="mt-6 text-base text-slate-500 dark:text-slate-400 leading-relaxed">
        AI 페르소나와 대화하며 한국 어디든 코스를 손쉽게 만들어 보세요.
      </p>

      <Button size="lg" class="mt-10" @click="auth.openLogin">
        <LogIn :size="15" /> 로그인하고 시작하기
      </Button>

      <div class="mt-24 grid sm:grid-cols-3 gap-12 text-left">
        <div v-for="f in features" :key="f.title">
          <div class="inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <component :is="f.icon" :size="16" />
          </div>
          <h3 class="mt-5 text-sm font-semibold text-slate-900 dark:text-slate-100">{{ f.title }}</h3>
          <p class="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">{{ f.desc }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
