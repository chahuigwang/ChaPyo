<script setup>
import { ref, reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-vue-next'
import { useChatStore } from '@/stores/chatStore'
import { GENDERS, AGE_GROUPS, MBTI_TYPES } from '@/types/persona'

const chat = useChatStore()
const { personas, personaId, persona } = storeToRefs(chat)

const formOpen = ref(false)
const editingId = ref(null)
const form = reactive({ gender: GENDERS[0], ageGroup: AGE_GROUPS[1], mbti: MBTI_TYPES[0] })

const isEditing = computed(() => !!editingId.value)
const formTitle = computed(() => (isEditing.value ? '페르소나 편집' : '새 페르소나'))

function resetForm() {
  form.gender = GENDERS[0]
  form.ageGroup = AGE_GROUPS[1]
  form.mbti = MBTI_TYPES[0]
}

function openAdd() {
  editingId.value = null
  resetForm()
  formOpen.value = true
}
function openEdit(p) {
  if (p.builtIn) return
  editingId.value = p.id
  form.gender = p.gender ?? GENDERS[0]
  form.ageGroup = p.ageGroup ?? AGE_GROUPS[1]
  form.mbti = p.mbti ?? MBTI_TYPES[0]
  formOpen.value = true
}
function closeForm() {
  formOpen.value = false
  editingId.value = null
}
function submit() {
  if (isEditing.value) chat.updatePersona(editingId.value, { ...form })
  else chat.addPersona({ ...form })
  closeForm()
}
function remove(p) {
  if (p.builtIn) return
  if (confirm(`"${p.name}" 페르소나를 삭제할까요?`)) chat.deletePersona(p.id)
}
</script>

<template>
  <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
    <div class="flex items-baseline justify-between mb-3">
      <h2 class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">AI 페르소나</h2>
      <span class="text-[11px] text-slate-400 dark:text-slate-500 truncate ml-2">{{ persona.tagline }}</span>
    </div>

    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
      <button
        v-for="p in personas"
        :key="p.id"
        @click="chat.selectPersona(p.id)"
        :class="[
          'group relative inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] transition-colors shrink-0',
          personaId === p.id
            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
        ]"
      >
        <span>{{ p.emoji }}</span>
        <span class="font-medium whitespace-nowrap">{{ p.name }}</span>
        <template v-if="!p.builtIn">
          <span
            role="button"
            tabindex="0"
            @click.stop="openEdit(p)"
            @keydown.enter.stop="openEdit(p)"
            class="ml-1 opacity-60 hover:opacity-100"
            title="편집"
          >
            <Pencil :size="10" />
          </span>
          <span
            role="button"
            tabindex="0"
            @click.stop="remove(p)"
            @keydown.enter.stop="remove(p)"
            class="opacity-60 hover:opacity-100 hover:text-red-400"
            title="삭제"
          >
            <Trash2 :size="10" />
          </span>
        </template>
      </button>

      <button
        @click="openAdd"
        class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] shrink-0
               border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400
               hover:border-primary hover:text-primary transition-colors"
        title="페르소나 추가"
      >
        <Plus :size="11" /> 추가
      </button>
    </div>

    <div
      v-if="formOpen"
      class="mt-3 rounded-md bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{{ formTitle }}</span>
        <button @click="closeForm" class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
          <X :size="12" />
        </button>
      </div>

      <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <div class="flex flex-col gap-1 shrink-0">
          <label class="text-[10px] text-slate-400">성별</label>
          <select v-model="form.gender" class="h-7 px-2 text-[11px] rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ring-1 ring-slate-200 dark:ring-slate-700 outline-none">
            <option v-for="g in GENDERS" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-1 shrink-0">
          <label class="text-[10px] text-slate-400">연령대</label>
          <select v-model="form.ageGroup" class="h-7 px-2 text-[11px] rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ring-1 ring-slate-200 dark:ring-slate-700 outline-none">
            <option v-for="a in AGE_GROUPS" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-1 shrink-0">
          <label class="text-[10px] text-slate-400">MBTI</label>
          <select v-model="form.mbti" class="h-7 px-2 text-[11px] rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ring-1 ring-slate-200 dark:ring-slate-700 outline-none">
            <option v-for="m in MBTI_TYPES" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <button
          @click="submit"
          class="ml-1 self-end shrink-0 inline-flex items-center gap-1 px-2.5 h-7 rounded-md bg-primary text-primary-foreground text-[11px] font-medium hover:bg-brand-600"
        >
          <Check :size="11" /> {{ isEditing ? '저장' : '추가' }}
        </button>
      </div>
    </div>
  </div>
</template>
