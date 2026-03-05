export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'notepadable-theme'
export const THEME_CHANGE_EVENT = 'notepadable-theme-change'

let systemMediaQuery: MediaQueryList | null = null

export function initTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
  const mode = stored ?? 'system'
  applyTheme(mode)
  if (mode === 'system') {
    systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemMediaQuery.addEventListener('change', handleSystemPreferenceChange)
  }
  return mode
}

function handleSystemPreferenceChange() {
  const mode = getTheme()
  if (mode === 'system') {
    applyTheme(mode)
    dispatchThemeChange()
  }
}

export function setTheme(mode: ThemeMode): void {
  if (systemMediaQuery) {
    systemMediaQuery.removeEventListener('change', handleSystemPreferenceChange)
    systemMediaQuery = null
  }
  applyTheme(mode)
  if (mode === 'system') {
    localStorage.removeItem(STORAGE_KEY)
    systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemMediaQuery.addEventListener('change', handleSystemPreferenceChange)
  } else {
    localStorage.setItem(STORAGE_KEY, mode)
  }
  dispatchThemeChange()
}

export function getTheme(): ThemeMode {
  return (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? 'system'
}

function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement
  const isDark = resolveIsDark(mode)
  if (mode === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.dataset.theme = mode
  }
  root.classList.toggle('dark', isDark)
  root.style.colorScheme = isDark ? 'dark' : 'light'
}

function dispatchThemeChange() {
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT))
}

export function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}
