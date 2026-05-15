<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Plus } from 'lucide-vue-next'
import { useTripStore } from '@/stores/tripStore'
import PlaceCard from './PlaceCard.vue'
import PlaceFormModal from './PlaceFormModal.vue'

const trip = useTripStore()
const { itemsOfSelectedDay, selectedDate } = storeToRefs(trip)

const modalOpen = ref(false)
const editing = ref(null)

function openAdd() {
  editing.value = null
  modalOpen.value = true
}
function openEdit(item) {
  editing.value = item
  modalOpen.value = true
}
function close() {
  modalOpen.value = false
  editing.value = null
}
function submit(payload) {
  if (editing.value) trip.updateItem(editing.value.id, payload)
  else trip.addItem(payload)
  close()
}
function remove(item) {
  if (confirm(`"${item.name}"을(를) 삭제할까요?`)) trip.removeItem(item.id)
}
</script>

<template>
  <div class="flex-1 overflow-y-auto px-6 py-5">
    <div class="mx-auto max-w-3xl">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-slate-900">
          {{ selectedDate || '날짜를 선택하세요' }}
          <span class="ml-1 text-xs text-slate-400">· {{ itemsOfSelectedDay.length }}건</span>
        </h2>
        <button
          @click="openAdd"
          :disabled="!selectedDate"
          class="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md
                 bg-brand-500 text-white hover:bg-brand-600
                 disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          <Plus :size="14" /> 일정 추가
        </button>
      </div>

      <div v-if="itemsOfSelectedDay.length" class="space-y-2">
        <PlaceCard
          v-for="item in itemsOfSelectedDay"
          :key="item.id"
          :item="item"
          @edit="openEdit"
          @remove="remove"
        />
      </div>

      <div
        v-else
        class="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center text-sm text-slate-500"
      >
        아직 일정이 없습니다. AI에게 추천을 요청하거나 직접 추가해 보세요.
      </div>
    </div>

    <PlaceFormModal :open="modalOpen" :initial="editing" @close="close" @submit="submit" />
  </div>
</template>
