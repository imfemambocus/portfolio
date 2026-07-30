import { SKILL_CLUSTERS } from '../content'
import { useReveal } from '../useReveal'
import { PAD, Section } from './Section'

export function Skills() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <Section id="skills" className={`flex min-h-screen items-center py-32 ${PAD}`}>
      <div ref={ref} className="w-full">
        <p data-reveal className="label">
          03 / Toolkit
        </p>

        <h2 data-reveal className="heading mt-8 max-w-2xl text-4xl sm:text-6xl">
          Frontend-leaning, full-stack by necessity
        </h2>

        <div data-reveal className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {SKILL_CLUSTERS.map((cluster) => (
            <div key={cluster.id}>
              <h3 className="label border-b border-haze pb-3 text-paper">{cluster.label}</h3>
              <ul className="mt-5 space-y-2">
                {cluster.items.map((item) => (
                  <li key={item} className="text-mist">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
