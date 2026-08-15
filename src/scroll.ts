import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

/*
 * the single source of scroll truth. this module is the only thing in the app listening
 * to scroll; everything animated reads from `scroll`. independent listeners are what make
 * scroll-driven sites desync.
 *
 * `morph` is a fractional layout index (0 .. LAYOUTS.length - 1), not raw page progress.
 * a form therefore stays settled while you read its section instead of drifting the whole
 * way down the page.
 */
export const scroll = { progress: 0, morph: 0, max: 0 }

const readers = new Set<() => void>()

/* anything that needs to redraw on scroll subscribes here rather than adding a listener */
export function onScroll(read: () => void) {
  readers.add(read)
  return () => {
    readers.delete(read)
  }
}

let lenis: Lenis | null = null

export function scrollTo(position: number) {
  if (lenis) lenis.scrollTo(position, { immediate: true })
  else window.scrollTo(0, position)
}

export const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// fraction of a section the current form holds before it starts becoming the next
const HOLD = 0.55

const sections: HTMLElement[] = []
let bounds: { top: number; height: number }[] = []

export function registerSection(el: HTMLElement | null) {
  if (el && !sections.includes(el)) sections.push(el)
}

function measure() {
  sections.sort((a, b) => a.offsetTop - b.offsetTop)
  bounds = sections.map((el) => ({ top: el.offsetTop, height: el.offsetHeight || 1 }))
}

function update(scrollY: number) {
  const max = document.documentElement.scrollHeight - window.innerHeight
  scroll.max = max
  scroll.progress = max > 0 ? scrollY / max : 0
  readers.forEach((read) => read())

  const last = bounds.length - 1
  if (last < 0) return

  const anchor = scrollY + window.innerHeight / 2
  for (let i = 0; i <= last; i++) {
    const section = bounds[i]
    if (anchor >= section.top + section.height && i !== last) continue

    const t = (anchor - section.top) / section.height
    const ramp = Math.min(Math.max((t - HOLD) / (1 - HOLD), 0), 1)
    scroll.morph = Math.min(i + ramp, last)
    return
  }
}

export function initScroll() {
  measure()
  update(window.scrollY)

  const onResize = () => {
    measure()
    update(window.scrollY)
  }
  window.addEventListener('resize', onResize)

  if (prefersReducedMotion) {
    const readNative = () => update(window.scrollY)
    window.addEventListener('scroll', readNative, { passive: true })
    return () => {
      window.removeEventListener('scroll', readNative)
      window.removeEventListener('resize', onResize)
    }
  }

  const instance = new Lenis({ lerp: 0.085 })
  lenis = instance

  instance.on('scroll', () => {
    update(instance.scroll)
    ScrollTrigger.update()
  })

  // lenis drives off gsap's ticker so the two never run on separate clocks
  const tick = (time: number) => instance.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(tick)
    instance.destroy()
    lenis = null
    window.removeEventListener('resize', onResize)
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
  }
}
