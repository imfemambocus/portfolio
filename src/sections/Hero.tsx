import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { HERO_META, IDENTITY } from '../content'
import { prefersReducedMotion } from '../scroll'
import { ThemeToggle } from '../ThemeToggle'
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
      const lines = el.querySelectorAll('[data-name]')
      if (lines.length === 0) return

      split = new SplitText(lines, { type: 'chars' })

      gsap
        .timeline({ delay: 0.15 })
        .from('[data-rule]', { scaleX: 0, duration: 1.3, ease: 'power3.inOut', stagger: 0.1 })
        // 135 not 108: the chars have to clear the padded mask, not just the line box
        .from(split.chars, { yPercent: 135, duration: 1.2, ease: 'expo.out', stagger: 0.055 }, 0.15)
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
              <p data-fade className="label text-ink">
                {IDENTITY.name}
              </p>
              <p data-fade className="label mt-1.5">
                {IDENTITY.role}, LCSB
              </p>
            </div>
            <div className="flex items-start gap-5">
              <div className="text-right">
                <p data-fade className="label">
                  Luxembourg
                </p>
                <p data-fade className="mt-1.5 font-mono text-sm tabular-nums text-ink">
                  {clock}
                </p>
              </div>
              <div data-fade>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <h1 className="my-8 text-[max(2.75rem,7vw)]">
          <span className="sr-only">{IDENTITY.name}, full-stack engineer</span>

          {/*
            no upper bound on the size: a fixed one stops the type growing while the field,
            which is placed as a fraction of the viewport, keeps spreading out, and on a 4k
            screen that left half the page dead between them.

            the mask has to clear the glyphs, not hug the line box. Anton's ink overflows
            its 0.82 line box by 0.034em at the top and 0.105em at the bottom (the Q tail),
            so the padding pushes the clip edges past both and the negative margins cancel
            it back out of the layout. overflow clips at the padding box, so this stays a
            real mask: the chars still start fully outside it.
          */}
          <span
            aria-hidden="true"
            className="display block overflow-hidden pt-[0.08em] pb-[0.16em] mt-[-0.08em] mb-[-0.16em]"
          >
            <span data-name className="block">
              Greetings
            </span>
          </span>

          {/*
            the margin is two corrections in one number, both of them measured off the
            rendered pixels rather than off the boxes. the greeting ink starts 0.0289em
            inside its box and the mono I starts 0.0737em inside its own, so boxes that
            line up leave the I overhanging the G. then the G is round: it holds its
            extreme for the middle 60% of the cap height and retreats to 1.5% of that
            height inside on average, so a stem set flush with the extreme reads as
            sticking out under the curve. the optical allowance is 2% of the greeting.
            sizing this line as a fraction of the greeting keeps one ratio between them,
            so the single margin holds at every width. the 11px floor is the exception,
            and it puts the I 1.3px further right than it wants under 400px.
          */}
          <span
            aria-hidden="true"
            data-fade
            className="mt-5 ml-[0.237em] block font-mono uppercase tracking-[0.28em] text-mist text-[max(0.6875rem,0.157em)]"
          >
            I measure what I build
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
                  <dd className="mt-1.5 text-ink">{item.value}</dd>
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
