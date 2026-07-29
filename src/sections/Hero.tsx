import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { IDENTITY } from '../content'
import { prefersReducedMotion } from '../scroll'
import { PAD, Section } from './Section'

gsap.registerPlugin(SplitText)

export function Hero() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (prefersReducedMotion || !el) return

    const heading = el.querySelector('h1')
    if (!heading) return

    const split = new SplitText(heading, { type: 'chars' })
    const timeline = gsap.timeline({ delay: 0.2 })

    timeline
      .from(split.chars, {
        yPercent: 70,
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.03,
      })
      .from(
        el.querySelectorAll('[data-fade]'),
        { y: 18, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.15 },
        0.45,
      )

    return () => {
      timeline.kill()
      split.revert()
    }
  }, [])

  return (
    <Section id="hero" className={`relative flex min-h-screen flex-col justify-center ${PAD}`}>
      <div ref={root}>
        <p data-fade className="label">
          {IDENTITY.role}, LCSB, University of Luxembourg
        </p>

        <h1 className="display mt-7 text-[clamp(3rem,12vw,10rem)]">
          Isfaaq
          <br />
          Emambocus
        </h1>

        <p data-fade className="mt-9 max-w-xl text-lg leading-relaxed text-mist">
          {IDENTITY.tagline} Seven years building enterprise applications, now building for science.
        </p>
      </div>

      <p data-fade className="label absolute bottom-10 left-6 sm:left-10 lg:left-20">
        Scroll
      </p>
    </Section>
  )
}
