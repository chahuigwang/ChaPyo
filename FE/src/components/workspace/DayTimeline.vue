<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Plus, Clock, Pencil, Trash2, Wallet } from 'lucide-vue-next'
import { useTripStore } from '@/stores/tripStore'
import { findCategory } from '@/domain/itinerary'
import PlaceFormModal from './PlaceFormModal.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'

const trip = useTripStore()
const { itemsOfSelectedDay, selectedDate } = storeToRefs(trip)

const sortedItems = computed(() =>
  [...itemsOfSelectedDay.value].sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
)

const formOpen = ref(false)
const editing = ref(null)
const detail = ref(null)

function openAdd() {
  editing.value = null
  formOpen.value = true
}
function openEdit(item) {
  detail.value = null
  editing.value = item
  formOpen.value = true
}
function closeForm() {
  formOpen.value = false
  editing.value = null
}
function submit(payload) {
  if (editing.value) trip.updateItem(editing.value.id, payload)
  else trip.addItem(payload)
  closeForm()
}
function remove(item) {
  if (confirm(`"${item.name}"을(를) 삭제할까요?`)) {
    trip.removeItem(item.id)
    detail.value = null
  }
}
const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원'
</script>

<template>
  <Card class="flex flex-col min-h-0">
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="inline-flex items-center gap-2">
          <Clock :size="14" class="text-primary" />
          {{ selectedDate || '날짜를 선택하세요' }}
          <Badge variant="secondary">{{ sortedItems.length }}건</Badge>
        </CardTitle>
        <Button size="sm" :disabled="!selectedDate" @click="openAdd">
          <Plus :size="13" /> 일정 추가
        </Button>
      </div>
    </CardHeader>

    <CardContent class="flex-1 overflow-x-auto overflow-y-hidden pt-1">
      <div v-if="sortedItems.length" class="flex items-stretch gap-3 min-w-max pb-1">
        <template v-for="(item, idx) in sortedItems" :key="item.id">
          <button
            @click="detail = item"
            class="w-52 shrink-0 text-left rounded-md border border-border bg-card p-3
                   hover:border-primary hover:bg-muted/40 transition-colors flex flex-col"
          >
            <div class="flex items-center justify-between">
              <div class="inline-flex items-center justify-center h-8 w-8 rounded-md bg-brand-50 text-base">
                {{ findCategory(item.category).emoji }}
              </div>
              <Badge variant="brand">{{ findCategory(item.category).label }}</Badge>
            </div>
            <h4 class="mt-2.5 text-sm font-semibold text-foreground truncate">{{ item.name }}</h4>
            <div v-if="item.time" class="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock :size="11" /> {{ item.time }}
            </div>
            <p v-if="item.memo" class="mt-1 text-[11px] text-muted-foreground line-clamp-2">{{ item.memo }}</p>
            <div v-if="item.cost" class="mt-auto pt-2 flex items-center gap-1 text-[11px] font-medium text-foreground">
              <Wallet :size="11" class="text-muted-foreground" /> {{ won(item.cost) }}
            </div>
          </button>

          <div
            v-if="idx < sortedItems.length - 1"
            class="self-center text-muted-foreground/40 text-sm shrink-0"
          >→</div>
        </template>
      </div>

      <div
        v-else
        class="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground"
      >
        아직 일정이 없습니다. AI에게 추천을 요청하거나 직접 추가해 보세요.
      </div>
    </CardContent>

    <PlaceFormModal :open="formOpen" :initial="editing" @close="closeForm" @submit="submit" />

    <BaseModal :open="!!detail" :title="detail?.name ?? ''" @close="detail = null">
      <div v-if="detail" class="space-y-3 text-sm">
        <div class="flex items-center gap-2">
          <Badge variant="brand">
            {{ findCategory(detail.category).emoji }} {{ findCategory(detail.category).label }}
          </Badge>
          <Badge v-if="detail.time" variant="outline">
            <Clock :size="11" /> {{ detail.time }}
          </Badge>
        </div>
        <div v-if="detail.cost" class="text-foreground">
          <span class="text-xs text-muted-foreground">예상 비용</span>
          <div class="font-semibold">{{ won(detail.cost) }}</div>
        </div>
        <div v-if="detail.memo">
          <span class="text-xs text-muted-foreground">메모</span>
          <p class="mt-1 whitespace-pre-wrap text-foreground/90">{{ detail.memo }}</p>
        </div>
        <div v-else class="text-xs text-muted-foreground">추가 메모가 없습니다.</div>
      </div>
      <template #footer>
        <Button variant="ghost" size="sm" class="text-destructive hover:bg-destructive/10" @click="remove(detail)">
          <Trash2 :size="13" /> 삭제
        </Button>
        <Button size="sm" @click="openEdit(detail)">
          <Pencil :size="13" /> 수정
        </Button>
      </template>
    </BaseModal>
  </Card>
</template>
