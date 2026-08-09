import { PROJECTS, type Project } from '../content'
import { useTheme } from '../theme'
import { useReveal } from '../useReveal'
import { PAD, Section } from './Section'

const slug = (repo: string) => repo.replace('https://github.com/', '')

/*
 * the banner is deliberately the opposite theme to the page: each one is a flat panel in
 * its project's own palette, so the light banner on the dark page (and the reverse) reads
 * as an object sitting on the surface instead of dissolving into it.
 */
function Banner({ project }: { readonly project: Project }) {
  const theme = useTheme()
  const src = theme === 'light' ? project.bannerDark : project.bannerLight

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className="aspect-[32/9] w-full rounded-lg border border-haze object-cover"
    />
  )
}

export function Projects() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <Section id="projects" className={`flex min-h-screen items-center py-32 ${PAD}`}>
      <div ref={ref} className="w-full">
        <p data-reveal className="label">
          04 / Selected work
        </p>

        <div data-reveal className="mt-14 grid gap-10 lg:grid-cols-3">
          {PROJECTS.map((project) => (
            <article
              key={project.id}
              className="flex flex-col rounded-xl border border-haze p-5 backdrop-blur-[2px]"
            >
              <Banner project={project} />

              {/* the banner carries the name, so the heading is only here for the outline */}
              <h3 className="sr-only">{project.name}</h3>

              <div className="mt-6 flex items-baseline justify-between gap-4">
                <p className="text-sm text-accent">{project.kind}</p>
                <span className="label shrink-0">Updated {project.updated}</span>
              </div>

              <p className="mt-4 leading-relaxed text-mist">{project.body}</p>

              <ul className="mt-auto flex flex-wrap gap-2 pt-7">
                {project.stack.map((tech) => (
                  <li
                    key={tech}
                    className="rounded-full border border-haze px-3 py-1 font-mono text-[0.6875rem] text-mist"
                  >
                    {tech}
                  </li>
                ))}
              </ul>

              <a
                href={project.repo}
                target="_blank"
                rel="noreferrer"
                aria-label={`${project.name} source code on GitHub`}
                className="mt-6 inline-block self-start font-mono text-xs text-mist underline decoration-haze decoration-1 underline-offset-4 transition-colors hover:text-ink hover:decoration-accent"
              >
                {slug(project.repo)}
              </a>
            </article>
          ))}
        </div>
      </div>
    </Section>
  )
}
