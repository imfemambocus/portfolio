import { PROJECTS, ROLES, SKILL_CLUSTERS } from '../content'
import { rng } from './rng'

/*
 * each layout is one form the particle field takes. scroll interpolates between
 * consecutive layouts, so the order here IS the order down the page and must stay
 * in step with SECTIONS in App.tsx. a seeded rng keeps every form stable across
 * reloads, which matters because the forms are art-directed, not incidental.
 */

export type Layout = (count: number) => Float32Array

function onSphere(random: () => number) {
  const theta = random() * Math.PI * 2
  const phi = Math.acos(2 * random() - 1)
  const s = Math.sin(phi)
  return [s * Math.cos(theta), s * Math.sin(theta), Math.cos(phi)] as const
}

/*
 * parallel wave lines running on a diagonal, low and calm at the bottom left and building
 * as they sweep to the top right.
 *
 * this form is deliberately much wider and taller than the viewport, and that is the whole
 * point of it. every earlier hero form was a compact object sitting to the right of the
 * copy, which read as a two-column layout; a form that bleeds off all four edges has no
 * silhouette to read as a column at all. the field mask fades the canvas out towards the
 * left, so the same gradient that protects the copy also does the work of making the waves
 * emerge from the lower left rather than starting abruptly.
 */
const WAVE_LINES = 6
const WAVE_ANGLE = 0.5
const WAVE_SPAN = 20
const WAVE_SPREAD = 12
const WAVE_FREQ = 0.62
const WAVE_AMP = 0.6
const WAVE_THICKNESS = 0.8

/*
 * neighbouring lines are shifted by a small, constant amount rather than given random
 * phases. random phases made every line independent, so the form read as a tangle of
 * separate strands; stepping the phase makes the crests line up into wavefronts that
 * travel across the field, which is what actually reads as waves.
 */
const WAVE_PHASE_STEP = 0.28

// crests deepen along the sweep, so the calm end is genuinely calm rather than just dimmer
const WAVE_BUILD = 1.7
const WAVE_DEPTH = 0.5

/*
 * particles are biased along the sweep rather than spread evenly, so the top right carries
 * more of them. an even spread made the build in amplitude read as the waves merely getting
 * taller, not as the field gathering.
 */
const WAVE_BIAS = 0.68

const waves: Layout = (count) => {
  const random = rng(6204)
  const out = new Float32Array(count * 3)

  const dx = Math.cos(WAVE_ANGLE)
  const dy = Math.sin(WAVE_ANGLE)

  const phases = new Float32Array(WAVE_LINES)
  const wobble = new Float32Array(WAVE_LINES)
  for (let i = 0; i < WAVE_LINES; i++) {
    // a touch of jitter on top of the step, so the wavefronts are not mechanically straight
    phases[i] = i * WAVE_PHASE_STEP + (random() - 0.5) * 0.12
    wobble[i] = 0.96 + random() * 0.08
  }

  for (let i = 0; i < count; i++) {
    const o = i * 3
    const line = Math.floor(random() * WAVE_LINES)
    const t = Math.pow(random(), WAVE_BIAS)

    const along = (t - 0.5) * WAVE_SPAN
    const across = (line / (WAVE_LINES - 1) - 0.5) * WAVE_SPREAD

    const freq = WAVE_FREQ * wobble[line]
    const amp = WAVE_AMP * (0.12 + t * t * WAVE_BUILD)
    const crest =
      Math.sin(along * freq + phases[line]) * amp +
      Math.sin(along * freq * 2.3 + phases[line] * 1.7) * amp * 0.34

    /*
     * squaring the triangular spread while keeping its sign gives the band a dense core
     * that feathers out, rather than a uniform grey slab. spread flat across a band this
     * wide, the particle budget covered so much area that the waves lost their edges and
     * merged into a single haze.
     */
    const spread = random() - random()
    const offset = across + crest + spread * Math.abs(spread) * WAVE_THICKNESS

    out[o] = dx * along - dy * offset
    out[o + 1] = dy * along + dx * offset
    out[o + 2] = Math.sin(along * 0.4 + phases[line]) * WAVE_DEPTH
  }

  return out
}

const cloud: Layout = (count) => {
  const random = rng(9021)
  const out = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const o = i * 3
    const [dx, dy, dz] = onSphere(random)
    const r = 4.4 + (random() - 0.5) * 2.2
    out[o] = dx * r * 1.45
    out[o + 1] = dy * r * 0.72
    out[o + 2] = dz * r
  }

  return out
}

/*
 * one horizontal band per role, oldest at the bottom, so scrolling the experience
 * section reads as climbing the career rather than paging through a list.
 */
const strata: Layout = (count) => {
  const random = rng(2214)
  const out = new Float32Array(count * 3)
  const bands = ROLES.length
  const spacing = 1.35

  for (let i = 0; i < count; i++) {
    const o = i * 3
    const band = Math.floor(random() * bands)
    // newer roles sit higher and reach wider: seniority made visible
    const seniority = 1 - band / (bands - 1)
    const width = 3.2 + seniority * 4.4

    out[o] = (random() - 0.5) * width * 2
    out[o + 1] = (band - (bands - 1) / 2) * -spacing + (random() - 0.5) * 0.28
    out[o + 2] = (random() - 0.5) * 3.4
  }

  return out
}

const constellation: Layout = (count) => {
  const random = rng(7788)
  const out = new Float32Array(count * 3)
  const clusters = SKILL_CLUSTERS.length
  const ring = 3.5

  for (let i = 0; i < count; i++) {
    const o = i * 3
    const c = Math.floor(random() * clusters)
    const angle = (c / clusters) * Math.PI * 2 + 0.4
    const cx = Math.cos(angle) * ring * 1.25
    const cy = Math.sin(angle) * ring * 0.62
    const cz = (c % 2 === 0 ? 1 : -1) * 1.2

    // a thin halo of strays keeps the clusters from reading as detached blobs
    const stray = random() < 0.18
    const r = stray ? 1.3 + random() * 1.9 : Math.cbrt(random()) * 1.15
    const [dx, dy, dz] = onSphere(random)

    out[o] = cx + dx * r
    out[o + 1] = cy + dy * r
    out[o + 2] = cz + dz * r
  }

  return out
}

const clumps: Layout = (count) => {
  const random = rng(3391)
  const out = new Float32Array(count * 3)
  const total = PROJECTS.length
  // the row keeps one width whatever the project count is, or a fourth clump runs off the frame
  const spread = 9.2 / Math.max(total - 1, 1)

  for (let i = 0; i < count; i++) {
    const o = i * 3
    const c = Math.floor(random() * total)
    const cx = (c - (total - 1) / 2) * spread
    const [dx, dy, dz] = onSphere(random)
    const r = Math.cbrt(random()) * 1.5

    out[o] = cx + dx * r
    out[o + 1] = dy * r * 1.1
    out[o + 2] = dz * r - 0.5
  }

  return out
}

export const LAYOUTS: readonly Layout[] = [
  waves,
  cloud,
  strata,
  constellation,
  clumps,
  waves,
]

/*
 * per-form art direction, interpolated with the same morph value as the positions.
 * the hero and close forms sit right of centre so they do not fight the type, and
 * the content-heavy sections dim the field right down: at full strength it reads as
 * fog over the copy rather than atmosphere behind it.
 */
export type LayoutStyle = {
  readonly offsetX: number
  readonly offsetY: number
  readonly scale: number
  readonly opacity: number
  readonly opacityLight: number
  readonly pointer: number
}

/*
 * light needs its own opacity per form, not a single global gain. on dark the field is
 * additive and bloomed, so overlapping points compound and a low number still reads; on
 * light it is normal-blended with no bloom, which accumulates linearly, and the dim
 * mid-page forms sit under the most opaque part of the mask as well. the two effects
 * multiply, so the forms that are dimmest on dark are the ones that vanish on light.
 */
export const LAYOUT_STYLES: readonly LayoutStyle[] = [
  { offsetX: 0, offsetY: 0, scale: 1, opacity: 1, opacityLight: 1, pointer: 0.2 },
  { offsetX: 1.8, offsetY: 0, scale: 1, opacity: 0.68, opacityLight: 0.95, pointer: 0.12 },
  { offsetX: 0.4, offsetY: 0, scale: 1, opacity: 0.44, opacityLight: 0.9, pointer: 0.05 },
  { offsetX: 0, offsetY: 0, scale: 1, opacity: 0.52, opacityLight: 0.92, pointer: 0.06 },
  { offsetX: 0, offsetY: 0, scale: 1, opacity: 0.5, opacityLight: 0.9, pointer: 0.06 },
  { offsetX: 0, offsetY: 0, scale: 1, opacity: 0.9, opacityLight: 1, pointer: 0.18 },
]
