import { EDUCATION, IDENTITY } from '../content'
import { useReveal } from '../useReveal'
import { PAD, Section } from './Section'

const LINKS = [
  { id: 'email', label: 'Email', href: `mailto:${IDENTITY.email}`, text: IDENTITY.email },
  { id: 'github', label: 'GitHub', href: IDENTITY.github, text: 'imfemambocus' },
  { id: 'linkedin', label: 'LinkedIn', href: IDENTITY.linkedin, text: 'isfaaqemambocus' },
] as const

export function Close() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <Section id="contact" className={`flex min-h-screen items-center py-32 ${PAD}`}>
      <div ref={ref} className="w-full">
        <p data-reveal className="label">
          05 / Education
        </p>

        <div data-reveal className="mt-8 grid gap-8 sm:grid-cols-2 lg:max-w-3xl">
          {EDUCATION.map((entry) => (
            <div key={entry.id}>
              <h3 className="text-lg">{entry.qualification}</h3>
              <p className="mt-1 text-mist">{entry.school}</p>
              <p className="label mt-2">{entry.period}</p>
              <p className="mt-3 text-sm leading-relaxed text-mist">{entry.detail}</p>
            </div>
          ))}
        </div>

        <h2 data-reveal className="display mt-28 text-5xl sm:text-7xl lg:text-8xl">
          Let us build
          <br />
          something
        </h2>

        <ul data-reveal className="mt-14 flex flex-wrap gap-x-14 gap-y-8">
          {LINKS.map((link) => (
            <li key={link.id}>
              <p className="label">{link.label}</p>
              <a
                href={link.href}
                target={link.id === 'email' ? undefined : '_blank'}
                rel={link.id === 'email' ? undefined : 'noreferrer'}
                className="mt-2 inline-block text-lg text-paper underline decoration-haze decoration-1 underline-offset-4 transition-colors hover:decoration-cyan"
              >
                {link.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
