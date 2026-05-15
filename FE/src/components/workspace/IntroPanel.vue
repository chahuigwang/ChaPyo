<script setup>
import { Sparkles, Route, Wallet, LogIn } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { Button, Card, Badge } from '@/components/ui'

const auth = useAuthStore()

const features = [
  { icon: Sparkles, title: 'AI 페르소나 추천', desc: '플래너·미식가·가성비·럭셔리, 원하는 스타일로 대화' },
  { icon: Route, title: '동선 자동 정리', desc: '추천 장소를 클릭만으로 일자별 일정에 정리' },
  { icon: Wallet, title: '한국관광공사 데이터 기반', desc: '실제 관광 정보를 활용한 신뢰도 높은 코스' },
]
</script>

<template>
  <div class="flex-1 overflow-y-auto flex items-center justify-center">
    <div class="mx-auto max-w-3xl px-6 py-12 text-center">
      <Badge variant="brand" class="px-2.5 py-1 text-xs">
        <Sparkles :size="11" /> ChaPyo · AI Travel Planner
      </Badge>

      <h1 class="mt-5 text-3xl font-bold text-foreground tracking-tight leading-tight">
        대화만으로 완성되는<br />
        <span class="text-primary">당신만의 여행 일정</span>
      </h1>
      <p class="mt-3 text-sm text-muted-foreground">
        AI 페르소나와 대화하며 한국 어디든 코스를 손쉽게 만들어 보세요.
      </p>

      <Button class="mt-6" @click="auth.openLogin">
        <LogIn :size="15" /> 로그인하고 시작하기
      </Button>

      <div class="mt-14 grid sm:grid-cols-3 gap-3 text-left">
        <Card v-for="f in features" :key="f.title" padded>
          <div class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-50 text-primary">
            <component :is="f.icon" :size="16" />
          </div>
          <h3 class="mt-3 text-sm font-semibold text-foreground">{{ f.title }}</h3>
          <p class="mt-1 text-xs text-muted-foreground leading-relaxed">{{ f.desc }}</p>
        </Card>
      </div>
    </div>
  </div>
</template>
