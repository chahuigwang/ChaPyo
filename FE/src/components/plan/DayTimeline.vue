<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Plus, Clock, Pencil, Trash2 } from 'lucide-vue-next'
import { useTripStore } from '@/stores/tripStore'
import { findCategory } from '@/types/itinerary'
import PlaceFormModal from './PlaceFormModal.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/common'

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
        <div>
          <CardTitle>{{ selectedDate || '날짜를 선택하세요' }}</CardTitle>
          <p class="mt-1 text-[12px] text-slate-500 dark:text-slate-400">{{ sortedItems.length }}건의 일정</p>
        </div>
        <Button size="sm" :disabled="!selectedDate" @click="openAdd">
          <Plus :size="13" /> 일정 추가
        </Button>
      </div>
    </CardHeader>

    <CardContent class="flex-1 overflow-x-auto overflow-y-hidden pt-2">
      <div v-if="sortedItems.length" class="flex items-stretch gap-4 min-w-max pb-2">
        <template v-for="(item, idx) in sortedItems" :key="item.id">
          <div
            @click="detail = item"
            class="group relative w-56 shrink-0 text-left rounded-xl bg-slate-50 dark:bg-slate-800/60 p-5
                   shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer"
          >
            <div class="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                @click.stop="openEdit(item)"
                class="h-7 w-7 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-900"
                title="수정"
              >
                <Pencil :size="13" />
              </button>
              <button
                @click.stop="remove(item)"
                class="h-7 w-7 rounded-md flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-white dark:hover:bg-slate-900"
                title="삭제"
              >
                <Trash2 :size="13" />
              </button>
            </div>
            <div class="flex items-center justify-between">
              <div class="inline-flex items-center justify-center h-9 w-9 rounded-md bg-white dark:bg-slate-900 text-base shadow-sm">
                {{ findCategory(item.category).emoji }}
              </div>
              <span class="text-[11px] text-slate-500 dark:text-slate-400">{{ findCategory(item.category).label }}</span>
            </div>
            <h4 class="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{{ item.name }}</h4>
            <div v-if="item.time" class="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <Clock :size="11" /> {{ item.time }}
            </div>
            <p v-if="item.memo" class="mt-2 text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{{ item.memo }}</p>
            <div v-if="item.cost" class="mt-auto pt-4 text-[12px] font-medium text-slate-900 dark:text-slate-100">
              {{ won(item.cost) }}
            </div>
          </div>

          <div
            v-if="idx < sortedItems.length - 1"
            class="self-center text-slate-300 dark:text-slate-600 text-sm shrink-0"
          >→</div>
        </template>
      </div>

      <div
        v-else
        class="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-12 text-center text-sm text-slate-500 dark:text-slate-400 shadow-inner"
      >
        아직 일정이 없습니다. AI에게 추천을 요청하거나 직접 추가해 보세요.
      </div>
    </CardContent>

    <PlaceFormModal :open="formOpen" :initial="editing" @close="closeForm" @submit="submit" />

    <BaseModal :open="!!detail" :title="detail?.name ?? ''" @close="detail = null">
      <div v-if="detail" class="space-y-4 text-sm">
        <div class="flex items-center gap-3 text-[12px] text-slate-500 dark:text-slate-400">
          <span>{{ findCategory(detail.category).emoji }} {{ findCategory(detail.category).label }}</span>
          <span v-if="detail.time" class="inline-flex items-center gap-1">
            <Clock :size="11" /> {{ detail.time }}
          </span>
        </div>
        <div v-if="detail.cost">
          <div class="text-[11px] text-slate-500 dark:text-slate-400">예상 비용</div>
          <div class="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{{ won(detail.cost) }}</div>
        </div>
        <div v-if="detail.memo">
          <div class="text-[11px] text-slate-500 dark:text-slate-400">메모</div>
          <p class="mt-1.5 whitespace-pre-wrap text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed">{{ detail.memo }}</p>
        </div>
        <div v-else class="text-[12px] text-slate-400 dark:text-slate-500">추가 메모가 없습니다.</div>
      </div>
      <template #footer>
        <Button variant="ghost" size="sm" class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30" @click="remove(detail)">
          <Trash2 :size="13" /> 삭제
        </Button>
        <Button size="sm" @click="openEdit(detail)">
          <Pencil :size="13" /> 수정
        </Button>
      </template>
    </BaseModal>
  </Card>
</template>
