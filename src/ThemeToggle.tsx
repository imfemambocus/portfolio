import { toggleTheme, useTheme } from './theme'

function Sun() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      <path
        strokeLinecap="round"
        d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6"
      />
    </svg>
  )
}

function Moon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path
        strokeLinejoin="round"
        d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z"
      />
    </svg>
  )
}

// shows the theme you would switch to, not the one you are in. people read that convention
// correctly without a label
export function ThemeToggle() {
  const current = useTheme()
  const next = current === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${next} mode`}
      className="grid size-9 cursor-pointer place-items-center rounded-full border border-haze text-mist transition-colors hover:border-mist hover:text-ink"
    >
      <span className="size-4">{current === 'dark' ? <Sun /> : <Moon />}</span>
    </button>
  )
}
