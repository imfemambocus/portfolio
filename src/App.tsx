import { lazy, Suspense, useEffect } from 'react'
import { initScroll } from './scroll'
import { Close } from './sections/Close'
import { Experience } from './sections/Experience'
import { Hero } from './sections/Hero'
import { Profile } from './sections/Profile'
import { Projects } from './sections/Projects'
import { Skills } from './sections/Skills'

// three and the postprocessing chain are most of the bundle; the text must not wait on them
const Scene = lazy(() => import('./Scene').then((module) => ({ default: module.Scene })))

/*
 * section order must stay in step with LAYOUTS in particles/layouts.ts: there is
 * one particle form per section, and scroll position maps onto that list by index.
 */
export function App() {
  useEffect(initScroll, [])

  return (
    <>
      <a
        href="#profile"
        className="absolute top-4 left-4 z-50 -translate-y-24 rounded bg-paper px-4 py-2 text-sm text-ink focus:translate-y-0"
      >
        Skip to content
      </a>

      <Suspense fallback={null}>
        <Scene />
      </Suspense>

      {/* guarantees contrast for the copy no matter what the field is doing behind it */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-5 bg-linear-to-r from-ink from-10% via-ink/85 via-45% to-transparent"
      />

      <main className="relative z-10">
        <Hero />
        <Profile />
        <Experience />
        <Skills />
        <Projects />
        <Close />
      </main>
    </>
  )
}
