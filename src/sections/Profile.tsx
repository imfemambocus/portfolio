import { PROFILE } from '../content'
import { useReveal } from '../useReveal'
import { PAD, Section } from './Section'

export function Profile() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <Section id="profile" className={`flex min-h-screen items-center py-32 ${PAD}`}>
      <div ref={ref} className="max-w-3xl">
        <h2 data-reveal className="label">
          01 / Profile
        </h2>

        {PROFILE.map((paragraph, index) => (
          <p
            key={paragraph.slice(0, 24)}
            data-reveal
            className={
              index === 0
                ? 'heading mt-8 text-3xl sm:text-5xl lg:text-6xl'
                : 'mt-8 max-w-xl text-lg leading-relaxed text-mist'
            }
          >
            {paragraph}
          </p>
        ))}
      </div>
    </Section>
  )
}
