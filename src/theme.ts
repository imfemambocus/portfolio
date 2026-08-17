import { useSyncExternalStore } from 'react'
import { prefersReducedMotion } from './scroll'

export type Theme = 'dark' | 'light'

const KEY = 'theme'

/*
 * half the crossfade. the DOM colours interpolate across the full 2x window via the
 * @property transition in index.css; the field dips out over the first half, swaps at
 * the bottom, and comes back over the second. keep the two in step.
 */
export const THEME_FADE_MS = 220

const SURFACE: Record<Theme, string> = {
  dark: '#000000',
  light: '#f6f6f3',
}

// an inline script in index.html already applied the theme before first paint; read it back
function initial(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export const theme = { current: initial() }

/*
 * what the canvas should be drawing. it lags `theme` by half the crossfade, which puts
 * the palette and blending swap at the bottom of the field's dip, where it cannot be
 * seen. blending is the reason this exists: additive and normal cannot be interpolated,
 * and a change that cannot be eased has to be hidden.
 */
export const renderTheme = { current: initial() }

const listeners = new Set<(next: Theme) => void>()
const renderListeners = new Set<(next: Theme) => void>()

let swap: ReturnType<typeof setTimeout> | undefined

function setRenderTheme(next: Theme) {
  if (next === renderTheme.current) return
  renderTheme.current = next
  renderListeners.forEach((notify) => notify(next))
}

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

  clearTimeout(swap)
  if (prefersReducedMotion) setRenderTheme(next)
  else swap = setTimeout(() => setRenderTheme(next), THEME_FADE_MS)
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

export function onRenderThemeChange(notify: (next: Theme) => void) {
  renderListeners.add(notify)
  return () => {
    renderListeners.delete(notify)
  }
}

export function useTheme() {
  return useSyncExternalStore(onThemeChange, () => theme.current, () => 'dark' as Theme)
}

export function useRenderTheme() {
  return useSyncExternalStore(
    onRenderThemeChange,
    () => renderTheme.current,
    () => 'dark' as Theme,
  )
}
