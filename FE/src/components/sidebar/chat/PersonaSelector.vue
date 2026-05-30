<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { Plus, Pencil, Trash2, X, Check, ChevronDown } from 'lucide-vue-next'
import { useChatStore } from '@/stores/chatStore'
import { GENDERS, AGE_GROUPS, MBTI_TYPES } from '@/types/persona'

const chat = useChatStore()
const { personas, personaId, persona } = storeToRefs(chat)

const open = ref(false)
const rootRef = ref(null)

function toggle() { open.value = !open.value }
function close() { open.value = false }
function selectPersona(id) {
  chat.selectPersona(id)
  close()
}

function onDocClick(e) {
  if (!rootRef.value) return
  if (!rootRef.value.contains(e.target)) close()
}
onMounted(() => document.addEventListener('mousedown', onDocClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick))

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
  open.value = false
}
function openEdit(p) {
  if (p.builtIn) return
  editingId.value = p.id
  form.gender = p.gender ?? GENDERS[0]
  form.ageGroup = p.ageGroup ?? AGE_GROUPS[1]
  form.mbti = p.mbti ?? MBTI_TYPES[0]
  formOpen.value = true
  open.value = true
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
const pendingDeletePersona = ref(null)
function remove(p) {
  if (p.builtIn) return
  pendingDeletePersona.value = p.id
}
function confirmRemove(p) {
  chat.deletePersona(p.id)
  pendingDeletePersona.value = null
}
function cancelRemove() { pendingDeletePersona.value = null }
</script>

<template>
  <div class="px-5 pt-5 pb-4">
    <h2 class="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6">
      AI 페르소나
    </h2>

    <div ref="rootRef" class="relative">
      <!-- Selected persona trigger -->
      <button
        type="button"
        @click="toggle"
        class="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
      >
        <span class="h-9 w-9 shrink-0 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-lg shadow-sm">
          {{ persona.emoji }}
        </span>
        <div class="min-w-0 flex-1">
          <div class="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate">
            {{ persona.name }}
          </div>
          <div class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {{ persona.tagline }}
          </div>
        </div>
        <span
          v-if="!persona.builtIn"
          role="button"
          tabindex="0"
          @click.stop="openEdit(persona)"
          class="h-7 w-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-900"
          title="편집"
        >
          <Pencil :size="13" />
        </span>
        <ChevronDown
          :size="15"
          class="text-slate-400 transition-transform"
          :class="open ? 'rotate-180' : ''"
        />
      </button>

      <!-- Dropdown menu -->
      <div
        v-if="open"
        class="absolute z-30 left-0 right-0 mt-2 rounded-xl bg-white dark:bg-slate-900 shadow-lg ring-1 ring-slate-200/70 dark:ring-slate-800 overflow-hidden"
      >
        <div class="max-h-72 overflow-y-auto py-1.5">
          <button
            v-for="p in personas"
            :key="p.id"
            @click="selectPersona(p.id)"
            :class="[
              'group w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
              personaId === p.id
                ? 'bg-primary/10'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/70',
            ]"
          >
            <span class="h-8 w-8 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-base">
              {{ p.emoji }}
            </span>
            <div class="min-w-0 flex-1">
              <div
                class="text-[12.5px] font-medium truncate"
                :class="personaId === p.id ? 'text-primary' : 'text-slate-900 dark:text-slate-100'"
              >
                {{ p.name }}
              </div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {{ p.tagline }}
              </div>
            </div>
            <Check v-if="personaId === p.id" :size="14" class="text-primary shrink-0" />
            <template v-else-if="!p.builtIn">
              <span
                role="button"
                tabindex="0"
                @click.stop="openEdit(p)"
                class="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                title="편집"
              >
                <Pencil :size="11" />
              </span>
              <span
                v-if="pendingDeletePersona !== p.id"
                role="button"
                tabindex="0"
                @click.stop="remove(p)"
                class="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500"
                title="삭제"
              >
                <Trash2 :size="11" />
              </span>
              <span v-else class="flex items-center gap-0.5">
                <span
                  role="button" tabindex="0"
                  @click.stop="confirmRemove(p)"
                  class="h-6 px-1.5 rounded-md text-[9px] font-semibold text-white bg-red-500 hover:bg-red-600 flex items-center"
                >정말?</span>
                <span
                  role="button" tabindex="0"
                  @click.stop="cancelRemove"
                  class="h-6 w-6 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                ><X :size="10" /></span>
              </span>
            </template>
          </button>
        </div>

        <!-- Pinned add button -->
        <div class="border-t border-slate-100 dark:border-slate-800">
          <button
            @click="openAdd"
            class="w-full flex items-center gap-2 px-3.5 py-2.5 text-[12.5px] font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            <Plus :size="14" /> 추가하기
          </button>
        </div>
      </div>
    </div>

    <!-- Inline form -->
    <div
      v-if="formOpen"
      class="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3.5 py-3"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{{ formTitle }}</span>
        <button @click="closeForm" class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
          <X :size="12" />
        </button>
      </div>

      <div class="flex items-end gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <div class="flex flex-col gap-1 shrink-0">
          <label class="text-[10px] text-slate-400">성별</label>
          <select v-model="form.gender" class="h-7 px-2 text-[11px] rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none">
            <option v-for="g in GENDERS" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-1 shrink-0">
          <label class="text-[10px] text-slate-400">연령대</label>
          <select v-model="form.ageGroup" class="h-7 px-2 text-[11px] rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none">
            <option v-for="a in AGE_GROUPS" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-1 shrink-0">
          <label class="text-[10px] text-slate-400">MBTI</label>
          <select v-model="form.mbti" class="h-7 px-2 text-[11px] rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none">
            <option v-for="m in MBTI_TYPES" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <button
          @click="submit"
          class="ml-1 shrink-0 inline-flex items-center gap-1 px-2.5 h-7 rounded-md bg-primary text-primary-foreground text-[11px] font-medium hover:bg-brand-600"
        >
          <Check :size="11" /> {{ isEditing ? '저장' : '추가' }}
        </button>
      </div>
    </div>
  </div>
</template>
