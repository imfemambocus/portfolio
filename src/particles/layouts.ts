import { PROJECTS, ROLES, SKILL_CLUSTERS } from '../content'
import { rng } from './rng'

/*
 * each layout is one form the field takes, and scroll interpolates between consecutive
 * ones. the order here IS the order down the page: keep it in step with SECTIONS in
 * App.tsx. every form is art-directed rather than incidental, hence the seeded rng.
 */

export type Layout = (count: number) => Float32Array

function onSphere(random: () => number) {
  const theta = random() * Math.PI * 2
  const phi = Math.acos(2 * random() - 1)
  const s = Math.sin(phi)
  return [s * Math.cos(theta), s * Math.sin(theta), Math.cos(phi)] as const
}

/*
 * parallel wave lines on a diagonal, calm at the bottom left and building as they sweep
 * to the top right.
 *
 * the span and spread deliberately exceed the viewport. a compact form confined to the
 * right of the copy reads as a second column; one that bleeds off all four edges leaves
 * no silhouette to read as a column at all. the field mask fades the canvas out to the
 * left, and that same ramp is the gradient the waves emerge along.
 */
const WAVE_LINES = 6
const WAVE_ANGLE = 0.5
const WAVE_SPAN = 20
const WAVE_SPREAD = 12
const WAVE_FREQ = 0.62
const WAVE_AMP = 0.6
const WAVE_THICKNESS = 0.8

/*
 * a small constant shift between neighbours, never random phases. independent lines read
 * as a tangle of strands; a stepped phase lines the crests up into wavefronts, which is
 * what reads as waves at all.
 */
const WAVE_PHASE_STEP = 0.28

// crests deepen along the sweep, so the calm end is genuinely calm rather than just dimmer
const WAVE_BUILD = 1.7
const WAVE_DEPTH = 0.5

// biased along the sweep. spread evenly, the build reads as taller waves, not a gathering field
const WAVE_BIAS = 0.68

const waves: Layout = (count) => {
  const random = rng(6204)
  const out = new Float32Array(count * 3)

  const dx = Math.cos(WAVE_ANGLE)
  const dy = Math.sin(WAVE_ANGLE)

  const phases = new Float32Array(WAVE_LINES)
  const wobble = new Float32Array(WAVE_LINES)
  for (let i = 0; i < WAVE_LINES; i++) {
    // jitter on top of the step; mechanically straight wavefronts look drawn
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
     * that feathers out. flat across a band this wide, the particle budget covers so much
     * area that the waves lose their edges and merge into one haze.
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

// one band per role, oldest at the bottom: scrolling the section climbs the career
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

export type LayoutStyle = {
  readonly offsetX: number
  readonly offsetY: number
  readonly scale: number
  readonly opacity: number
  readonly opacityLight: number
  readonly pointer: number
}

/*
 * per-form art direction, interpolated on the same morph value as the positions. the
 * content-heavy sections dim the field right down: at full strength it reads as fog over
 * the copy rather than atmosphere behind it.
 *
 * light needs its own opacity per form, not one global gain. dark is additive and bloomed,
 * so overlapping points compound and a low number still reads. light is normal-blended
 * with no bloom, accumulates linearly, and the dim mid-page forms also sit under the most
 * opaque part of the mask. the two effects multiply: the forms dimmest on dark are exactly
 * the ones that vanish on light.
 */
export const LAYOUT_STYLES: readonly LayoutStyle[] = [
  { offsetX: 0, offsetY: 0, scale: 1, opacity: 1, opacityLight: 1, pointer: 0.2 },
  { offsetX: 1.8, offsetY: 0, scale: 1, opacity: 0.68, opacityLight: 0.95, pointer: 0.12 },
  { offsetX: 0.4, offsetY: 0, scale: 1, opacity: 0.44, opacityLight: 0.9, pointer: 0.05 },
  { offsetX: 0, offsetY: 0, scale: 1, opacity: 0.52, opacityLight: 0.92, pointer: 0.06 },
  { offsetX: 0, offsetY: 0, scale: 1, opacity: 0.5, opacityLight: 0.9, pointer: 0.06 },
  { offsetX: 0, offsetY: 0, scale: 1, opacity: 0.9, opacityLight: 1, pointer: 0.18 },
]
