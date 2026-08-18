import { IDENTITY, PROFILE } from '../content'
import { useReveal } from '../useReveal'
import { PAD, Section } from './Section'

const [LEAD, ...REST] = PROFILE

export function Profile() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <Section id="profile" className={`flex min-h-screen items-center py-32 ${PAD}`}>
      <div ref={ref} className="max-w-3xl">
        <h2 data-reveal className="label">
          01 / Profile
        </h2>

        <p data-reveal className="heading mt-8 text-3xl sm:text-5xl lg:text-6xl">
          {LEAD}
        </p>

        {/*
         * the portrait sits with the closing paragraph, where it reads as a byline. the
         * paragraph carries 8px of leading above its cap height and 6px below its
         * descender, so centring the boxes leaves the circle 1px above the centre of the
         * ink. a centred flex item moves by half its margin, hence the 2px.
         */}
        <div data-reveal className="mt-8 flex items-center gap-5">
          <img
            src={IDENTITY.avatar}
            alt={IDENTITY.name}
            width={256}
            height={256}
            loading="lazy"
            decoding="async"
            className="mt-0.5 size-14 shrink-0 rounded-full object-cover"
          />

          <div className="max-w-xl">
            {REST.map((paragraph, index) => (
              <p
                key={paragraph.slice(0, 24)}
                className={`text-lg leading-relaxed text-mist ${index > 0 ? 'mt-6' : ''}`}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}
