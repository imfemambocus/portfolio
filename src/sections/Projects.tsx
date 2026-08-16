import { PROJECTS, type Project } from '../content'
import { useReveal } from '../useReveal'
import { PAD, Section } from './Section'

const slug = (repo: string) => repo.replace('https://github.com/', '')

// the dark banner in both themes. a flat panel in the project's own palette sits on the
// surface as an object; the matching one dissolves into it
function Banner({ project }: { readonly project: Project }) {
  return (
    <img
      src={project.bannerDark}
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
        <h2 data-reveal className="label">
          04 / Selected work
        </h2>

        {/* two cards per row of three columns: the empty one is where the clumps sit */}
        <div data-reveal className="mt-14 grid gap-x-12 gap-y-16 lg:grid-cols-3">
          {PROJECTS.map((project, i) => (
            <article
              key={project.id}
              className={`flex flex-col ${i % 2 === 0 ? 'lg:col-start-1' : 'lg:col-start-2'}`}
            >
              <Banner project={project} />

              {/* the banner carries the name; this heading is only here for the outline */}
              <h3 className="sr-only">{project.name}</h3>

              <div className="mt-5 flex items-baseline justify-between gap-4">
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
