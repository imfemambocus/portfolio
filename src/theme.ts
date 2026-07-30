import { useSyncExternalStore } from 'react'

export type Theme = 'dark' | 'light'

const KEY = 'theme'

const SURFACE: Record<Theme, string> = {
  dark: '#07070a',
  light: '#f6f6f3',
}

/*
 * the single source of theme truth, shared by the DOM and the particle field.
 * an inline script in index.html has already resolved and applied the theme before
 * first paint, so this reads back off the element rather than deciding again and
 * risking a mismatch.
 */
function initial(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export const theme = { current: initial() }

const listeners = new Set<(next: Theme) => void>()

export function setTheme(next: Theme) {
  if (next === theme.current) return

  theme.current = next
  document.documentElement.dataset.theme = next

  try {
    localStorage.setItem(KEY, next)
  } catch {
    // private browsing, or storage is full: the theme still applies for this session
  }

  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', SURFACE[next])
  listeners.forEach((notify) => notify(next))
}

export function toggleTheme() {
  setTheme(theme.current === 'dark' ? 'light' : 'dark')
}

export function onThemeChange(notify: (next: Theme) => void) {
  listeners.add(notify)
  return () => {
    listeners.delete(notify)
  }
}

export function useTheme() {
  return useSyncExternalStore(onThemeChange, () => theme.current, () => 'dark' as Theme)
}
