import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { onScroll, scroll, scrollTo } from './scroll'

const INSET = 14
const MIN_THUMB = 48

/*
 * index.css hides the native scrollbar and this stands in for it. no native one can
 * float: `overlay` is long dead, and `scrollbar-width: thin` and webkit scrollbar styling
 * both still reserve a gutter. the layout shifts by that gutter's width.
 *
 * a real control rather than an indicator. the thumb drags. not focusable, and
 * aria-hidden: keyboard scrolling already works natively, and a tab stop here would be a
 * duplicate with nothing to announce.
 */
export function Scrollbar() {
  const thumb = useRef<HTMLDivElement>(null)
  const geometry = useRef({ travel: 0, size: MIN_THUMB })
  const [scrollable, setScrollable] = useState(false)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const el = thumb.current
    if (!el) return

    const place = () => {
      el.style.transform = `translate3d(0, ${scroll.progress * geometry.current.travel}px, 0)`
    }

    const measure = () => {
      const view = window.innerHeight
      const track = view - INSET * 2
      const document_ = document.documentElement.scrollHeight
      const size = Math.max(MIN_THUMB, Math.min(track, (view / document_) * track))

      geometry.current = { travel: track - size, size }
      setScrollable(document_ - view > 1)
      el.style.height = `${size}px`
      place()
    }

    measure()
    const stopReading = onScroll(place)
    window.addEventListener('resize', measure)

    // sections reveal and fonts land after first paint, so the page height moves on its own
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)

    return () => {
      stopReading()
      window.removeEventListener('resize', measure)
      observer.disconnect()
    }
  }, [])

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = thumb.current
    const { travel } = geometry.current
    if (!el || travel <= 0) return

    event.preventDefault()
    el.setPointerCapture(event.pointerId)
    setDragging(true)

    const originY = event.clientY
    const originProgress = scroll.progress

    const drag = (move: PointerEvent) => {
      const next = originProgress + (move.clientY - originY) / travel
      scrollTo(Math.min(Math.max(next, 0), 1) * scroll.max)
    }

    const end = () => {
      setDragging(false)
      el.removeEventListener('pointermove', drag)
      el.removeEventListener('pointerup', end)
      el.removeEventListener('pointercancel', end)
    }

    el.addEventListener('pointermove', drag)
    el.addEventListener('pointerup', end)
    el.addEventListener('pointercancel', end)
  }

  /*
   * always mounted, hidden by class rather than unmounted. the effect measures the page
   * through this element, and returning null while "not scrollable" leaves it with
   * nothing to measure, so it could never discover that the page does in fact scroll.
   */
  return (
    <div
      ref={thumb}
      aria-hidden="true"
      onPointerDown={startDrag}
      style={{ top: INSET }}
      className={`group fixed right-0 z-50 flex w-4 touch-none justify-center select-none ${
        dragging ? 'cursor-grabbing' : 'cursor-grab'
      } ${scrollable ? '' : 'pointer-events-none opacity-0'}`}
    >
      <span
        className={`block h-full w-1 rounded-full bg-ink transition-opacity duration-200 group-hover:opacity-70 ${
          dragging ? 'opacity-70' : 'opacity-30'
        }`}
      />
    </div>
  )
}
