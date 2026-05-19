import { ref, watch } from 'vue'

const STORAGE_KEY = 'chapyo-theme'

function preferredTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref(preferredTheme())

function apply(t) {
  const root = document.documentElement
  if (t === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

apply(theme.value)

watch(theme, (t) => {
  apply(t)
  localStorage.setItem(STORAGE_KEY, t)
})

export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }
  return { theme, toggle, isDark: () => theme.value === 'dark' }
}
