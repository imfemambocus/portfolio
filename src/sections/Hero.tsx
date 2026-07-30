import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { HERO_META, IDENTITY } from '../content'
import { prefersReducedMotion } from '../scroll'
import { PAD, Section } from './Section'

gsap.registerPlugin(SplitText)

const CLOCK = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Luxembourg',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

const readClock = () => CLOCK.format(new Date())

export function Hero() {
  const root = useRef<HTMLDivElement>(null)
  const [clock, setClock] = useState(readClock)

  useEffect(() => {
    const id = setInterval(() => setClock(readClock()), 1000)
    return () => clearInterval(id)
  }, [])

  /*
   * gsap.context, and revert() rather than kill(), because StrictMode runs this twice
   * in dev. kill() stops a from() tween but leaves the target at its start values, so
   * the second run records opacity 0 as the destination and the element never appears.
   * revert() restores the original inline styles, so the second run starts clean.
   */
  useEffect(() => {
    const el = root.current
    if (prefersReducedMotion || !el) return

    let split: SplitText | undefined

    const ctx = gsap.context(() => {
      const heading = el.querySelector('[data-name]')
      if (!heading) return

      split = new SplitText(heading, { type: 'chars' })

      gsap
        .timeline({ delay: 0.15 })
        .from('[data-rule]', { scaleX: 0, duration: 1.3, ease: 'power3.inOut', stagger: 0.1 })
        .from(split.chars, { yPercent: 108, duration: 1.2, ease: 'expo.out', stagger: 0.055 }, 0.15)
        .from(
          '[data-fade]',
          { y: 14, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06 },
          0.5,
        )
    }, el)

    return () => {
      ctx.revert()
      split?.revert()
    }
  }, [])

  return (
    <Section
      id="hero"
      className={`relative flex min-h-screen overflow-hidden py-10 ${PAD}`}
    >
      <div ref={root} className="flex flex-1 flex-col justify-between">
        <header>
          <div data-rule className="h-px origin-left bg-haze" />
          <div className="flex items-start justify-between gap-6 pt-5">
            <div>
              <p data-fade className="label text-paper">
                Emambocus
              </p>
              <p data-fade className="label mt-1.5">
                {IDENTITY.role}, LCSB
              </p>
            </div>
            <div className="text-right">
              <p data-fade className="label">
                Luxembourg
              </p>
              <p data-fade className="mt-1.5 font-mono text-sm tabular-nums text-paper">
                {clock}
              </p>
            </div>
          </div>
        </header>

        <h1 className="display my-8 text-[clamp(4rem,30vw,22rem)]">
          <span className="sr-only">{IDENTITY.fullName}</span>
          <span aria-hidden="true" className="block overflow-hidden pb-[0.06em]">
            <span data-name className="block">
              Isfaaq
            </span>
          </span>
        </h1>

        <footer>
          <div data-rule className="h-px origin-left bg-haze" />
          <div className="flex flex-col gap-10 pt-6 lg:flex-row lg:items-end lg:justify-between">
            <p data-fade className="max-w-sm leading-relaxed text-mist">
              {IDENTITY.tagline} Seven years building enterprise applications, now building for
              science.
            </p>

            <dl className="flex flex-wrap gap-x-12 gap-y-5">
              {HERO_META.map((item) => (
                <div key={item.id} data-fade>
                  <dt className="label">{item.label}</dt>
                  <dd className="mt-1.5 text-paper">{item.value}</dd>
                </div>
              ))}
            </dl>

            <p data-fade className="label shrink-0">
              Scroll
            </p>
          </div>
        </footer>
      </div>
    </Section>
  )
}
