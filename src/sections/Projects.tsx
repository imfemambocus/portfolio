import { PROJECTS } from '../content'
import { useReveal } from '../useReveal'
import { PAD, Section } from './Section'

export function Projects() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <Section id="projects" className={`flex min-h-screen items-center ${PAD}`}>
      <div ref={ref} className="w-full">
        <p data-reveal className="label">
          04 / Selected work
        </p>

        <div data-reveal className="mt-14 grid gap-10 lg:grid-cols-3">
          {PROJECTS.map((project) => (
            <article
              key={project.id}
              className="flex flex-col border-t border-haze pt-7 backdrop-blur-[2px]"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="display text-3xl sm:text-4xl">{project.name}</h3>
                <span className="label shrink-0">{project.year}</span>
              </div>

              <p className="mt-2 text-sm text-violet">{project.kind}</p>
              <p className="mt-5 leading-relaxed text-mist">{project.body}</p>

              <ul className="mt-7 flex flex-wrap gap-2">
                {project.stack.map((tech) => (
                  <li
                    key={tech}
                    className="rounded-full border border-haze px-3 py-1 font-mono text-[0.6875rem] text-mist"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </Section>
  )
}
