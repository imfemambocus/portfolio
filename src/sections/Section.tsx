import { useEffect, useRef, type ReactNode } from 'react'
import { registerSection } from '../scroll'

type Props = {
  readonly id: string
  readonly className?: string
  readonly children: ReactNode
}

/*
 * every section registers itself so scroll.ts can map scroll position onto a
 * fractional layout index. registration order does not matter: scroll.ts sorts
 * by document position when it measures.
 */
export function Section({ id, className = '', children }: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    registerSection(ref.current)
  }, [])

  return (
    <section id={id} ref={ref} className={className}>
      {children}
    </section>
  )
}

export const PAD = 'px-6 sm:px-10 lg:px-20'
