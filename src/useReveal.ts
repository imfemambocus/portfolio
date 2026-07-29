import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from './scroll'

/*
 * fades and lifts anything marked [data-reveal] inside the returned ref as it
 * enters. under reduced motion nothing is touched, which leaves the content in
 * its natural visible state rather than stranded at opacity 0.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const root = ref.current
    if (!root || prefersReducedMotion) return

    const targets = root.querySelectorAll('[data-reveal]')
    if (!targets.length) return

    const tween = gsap.from(targets, {
      y: 30,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.07,
      scrollTrigger: { trigger: root, start: 'top 78%' },
    })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [])

  return ref
}
