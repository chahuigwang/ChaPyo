<script setup>
import { storeToRefs } from 'pinia'
import { CalendarDays, Plus, Trash2, MapPin } from 'lucide-vue-next'
import { useTripStore } from '@/stores/tripStore'
import { useAuthStore } from '@/stores/authStore'
import { enumerateDays } from '@/domain/itinerary'
import { Button, Card, Badge } from '@/components/ui'

const trip = useTripStore()
const auth = useAuthStore()
const { trips } = storeToRefs(trip)

function dayCount(t) { return enumerateDays(t.startDate, t.endDate).length }
function itemCount(t) {
  return Object.values(t.itemsByDay).reduce((sum, list) => sum + list.length, 0)
}
function open(id) { trip.selectTrip(id) }
function remove(t) {
  if (confirm(`"${t.title}" 여행 계획을 삭제할까요?`)) trip.deleteTrip(t.id)
}
function createNew() {
  trip.createTrip({ title: '새 여행' })
}
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <div class="mx-auto max-w-5xl px-6 py-10">
      <div class="flex items-end justify-between mb-6">
        <div>
          <p class="text-xs text-muted-foreground">{{ auth.user?.name }}님, 안녕하세요</p>
          <h1 class="text-xl font-bold text-foreground tracking-tight mt-0.5">나의 여행 계획</h1>
        </div>
        <Button @click="createNew">
          <Plus :size="15" /> 새 여행
        </Button>
      </div>

      <div v-if="trips.length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card
          v-for="t in trips"
          :key="t.id"
          class="group relative cursor-pointer hover:border-primary hover:bg-muted/40 transition-colors"
          @click="open(t.id)"
        >
          <div class="p-4">
            <div class="flex items-center justify-between">
              <Badge variant="brand">
                <CalendarDays :size="11" /> {{ dayCount(t) }}일
              </Badge>
              <span
                class="opacity-0 group-hover:opacity-100 transition p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                @click.stop="remove(t)"
                role="button"
              >
                <Trash2 :size="13" />
              </span>
            </div>
            <h3 class="mt-3 text-base font-semibold text-foreground truncate">{{ t.title }}</h3>
            <div class="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <CalendarDays :size="11" /> {{ t.startDate }} → {{ t.endDate }}
            </div>
            <div class="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <MapPin :size="11" /> 일정 {{ itemCount(t) }}건
            </div>
          </div>
        </Card>
      </div>

      <Card v-else class="p-12 text-center border-dashed bg-muted/30">
        <div class="text-sm text-muted-foreground">
          아직 여행 계획이 없습니다. "새 여행"을 눌러 시작해 보세요.
        </div>
      </Card>
    </div>
  </div>
</template>
