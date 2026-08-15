import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from './scroll'

/*
 * fades and lifts anything marked [data-reveal] inside the returned ref as it enters.
 * reduced motion touches nothing at all, which leaves the content in its natural visible
 * state rather than stranded at opacity 0.
 *
 * gsap.context and revert(), never kill(). StrictMode runs effects twice in dev, and
 * kill() leaves a from() tween's targets sitting at their start values: the second run
 * then records opacity 0 as the destination and animates 0 to 0, forever.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const root = ref.current
    if (!root || prefersReducedMotion) return

    const ctx = gsap.context(() => {
      const targets = gsap.utils.toArray<HTMLElement>('[data-reveal]')
      if (!targets.length) return

      gsap.from(targets, {
        y: 30,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.07,
        scrollTrigger: { trigger: root, start: 'top 78%' },
      })
    }, root)

    return () => ctx.revert()
  }, [])

  return ref
}
