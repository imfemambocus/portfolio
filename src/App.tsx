import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { lazy, Suspense, useEffect } from 'react'
import { initScroll } from './scroll'
import { Scrollbar } from './Scrollbar'
import { Close } from './sections/Close'
import { Experience } from './sections/Experience'
import { Hero } from './sections/Hero'
import { Profile } from './sections/Profile'
import { Projects } from './sections/Projects'
import { Skills } from './sections/Skills'

// three and the postprocessing chain are most of the bundle; the text must not wait on them
const Scene = lazy(() => import('./Scene').then((module) => ({ default: module.Scene })))

// one particle form per section, mapped by index. a new section needs a new LAYOUT too
export function App() {
  useEffect(initScroll, [])

  return (
    <>
      <a
        href="#profile"
        className="absolute top-4 left-4 z-50 -translate-y-24 rounded bg-ink px-4 py-2 text-sm text-paper focus:translate-y-0"
      >
        Skip to content
      </a>

      <Suspense fallback={null}>
        <Scene />
      </Suspense>

      <main className="relative z-10">
        <Hero />
        <Profile />
        <Experience />
        <Skills />
        <Projects />
        <Close />
      </main>

      <Scrollbar />
      <Analytics />
      <SpeedInsights />
    </>
  )
}
