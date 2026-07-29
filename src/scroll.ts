import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

/*
 * the single source of scroll truth. this module is the only thing in the app
 * listening to scroll; everything animated reads from `scroll`. independent
 * listeners are what make scroll-driven sites desync and feel broken.
 *
 * `morph` is a fractional layout index (0 .. LAYOUTS.length - 1) rather than raw
 * page progress, so a form stays settled while you read its section instead of
 * drifting the whole way down the page.
 */
export const scroll = { progress: 0, morph: 0 }

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
  scroll.progress = max > 0 ? scrollY / max : 0

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
    const onScroll = () => update(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }

  const lenis = new Lenis({ lerp: 0.085 })
  lenis.on('scroll', () => {
    update(lenis.scroll)
    ScrollTrigger.update()
  })

  // lenis drives off gsap's ticker so the two never run on separate clocks
  const tick = (time: number) => lenis.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(tick)
    lenis.destroy()
    window.removeEventListener('resize', onResize)
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
  }
}
