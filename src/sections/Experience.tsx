import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ROLES, type Role } from '../content'
import { prefersReducedMotion } from '../scroll'
import { PAD, Section } from './Section'

function RoleBody({ role }: { readonly role: Role }) {
  return (
    <>
      <p className="label">{role.period}</p>
      <h3 className="heading mt-5 text-3xl sm:text-5xl lg:text-6xl">{role.title}</h3>
      <p className="mt-3 text-lg text-accent">
        {role.org}
        <span className="text-mist">, {role.place}</span>
      </p>
      {role.note && <p className="mt-2 text-sm text-mist italic">{role.note}</p>}
      <ul className="mt-7 max-w-xl space-y-3">
        {role.points.map((point) => (
          <li key={point.slice(0, 28)} className="flex gap-3 text-mist">
            <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
            <span className="leading-relaxed">{point}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

function StaticList() {
  return (
    <div className={`py-32 ${PAD}`}>
      <p className="label">02 / Experience</p>
      <div className="mt-14 space-y-24">
        {ROLES.map((role) => (
          <article key={role.id}>
            <RoleBody role={role} />
          </article>
        ))}
      </div>
    </div>
  )
}

function Stepper() {
  const tall = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const el = tall.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            const index = Math.floor(self.progress * ROLES.length)
            setActive(Math.min(Math.max(index, 0), ROLES.length - 1))
          },
        },
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={tall} className="relative h-[440vh]">
      <div className={`sticky top-0 flex h-screen items-center ${PAD}`}>
        <div className="w-full">
          <p className="label">02 / Experience</p>

          <div className="relative mt-10 min-h-104">
            {ROLES.map((role, index) => (
              <article
                key={role.id}
                aria-hidden={index !== active}
                className="absolute inset-0 transition-[opacity,transform] duration-700 ease-out"
                style={{
                  opacity: index === active ? 1 : 0,
                  transform: `translate3d(0, ${(index - active) * 24}px, 0)`,
                  pointerEvents: index === active ? 'auto' : 'none',
                }}
              >
                <RoleBody role={role} />
              </article>
            ))}
          </div>
        </div>

        <ol className="absolute right-6 hidden flex-col gap-3 sm:right-10 lg:right-20 lg:flex">
          {ROLES.map((role, index) => (
            <li key={role.id} className="flex items-center justify-end gap-3">
              <span
                className="font-mono text-[0.625rem] tracking-widest transition-opacity duration-500"
                style={{ opacity: index === active ? 1 : 0 }}
              >
                {role.short}
              </span>
              <span
                aria-hidden="true"
                className="h-px transition-all duration-500"
                style={{
                  width: index === active ? '2.5rem' : '1rem',
                  background: index === active ? 'var(--color-accent)' : 'var(--color-haze)',
                }}
              />
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export function Experience() {
  return (
    <Section id="experience">{prefersReducedMotion ? <StaticList /> : <Stepper />}</Section>
  )
}
