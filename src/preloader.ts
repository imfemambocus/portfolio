import { prefersReducedMotion } from './scroll'

/*
 * the overlay in index.html covers the whole load, and every entrance animation is armed
 * on it rather than on mount. without it the hero paints in its finished state for a frame
 * or two, gsap then applies the timeline's start values, and the page shows a complete
 * hero, blanks, and animates the same thing again.
 *
 * the exit runs in two beats: the loading track draws out into a full-width hairline, then
 * the overlay parts along it and the two halves slide off the top and the bottom.
 */

// below this the loader reads as a glitch rather than as a beat
const MIN_MS = 620

// a font that never arrives must not hold the page shut
const MAX_MS = 4000

// the width transition on .preload-line in index.html
const OPEN_MS = 400

// the transform transition on .preload-half in index.html
const SPLIT_MS = 760

/*
 * an entrance is armed with the shutter still closed, so a gsap.from lands its start values
 * out of sight. this delay is what holds the motion until the shutter has begun to open.
 */
export const ENTRANCE_DELAY = prefersReducedMotion ? 0 : 0.18

let armed = false
const waiting = new Set<() => void>()

export function onArm(build: () => void) {
  if (armed) {
    build()
    return () => {}
  }

  waiting.add(build)
  return () => {
    waiting.delete(build)
  }
}

export function startPreloader() {
  const el = document.getElementById('preload')

  const arm = () => {
    if (armed) return
    armed = true
    waiting.forEach((build) => build())
    waiting.clear()
  }

  if (!el) {
    arm()
    return
  }

  const shown = performance.now()
  let dismissed = false

  const dismiss = () => {
    if (dismissed) return
    dismissed = true

    if (prefersReducedMotion) {
      arm()
      el.remove()
      return
    }

    el.dataset.open = ''

    setTimeout(() => {
      // arm first: the start values have to be in place before the shutter uncovers them
      arm()
      el.dataset.split = ''
      setTimeout(() => el.remove(), SPLIT_MS)
    }, OPEN_MS)
  }

  const cap = setTimeout(dismiss, MAX_MS)

  /*
   * two frames, so react has committed and the browser has laid the text out: the font
   * requests only start then, and document.fonts.ready resolves immediately for anyone
   * who asks before that.
   */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.fonts.ready.then(() => {
        clearTimeout(cap)
        setTimeout(dismiss, Math.max(MIN_MS - (performance.now() - shown), 0))
      })
    })
  })
}
