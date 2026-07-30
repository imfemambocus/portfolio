import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from './scroll'

/*
 * fades and lifts anything marked [data-reveal] inside the returned ref as it enters.
 * under reduced motion nothing is touched, which leaves the content in its natural
 * visible state rather than stranded at opacity 0.
 *
 * gsap.context and revert() rather than kill(): StrictMode runs effects twice in dev,
 * and kill() leaves a from() tween's targets at their start values, so the second run
 * records opacity 0 as the destination and the content never appears.
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
