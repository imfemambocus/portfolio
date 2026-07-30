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

const NODE_COUNT = 96
const STRUCTURE_RADIUS = 3.4

/*
 * a bonded chain grown as a random walk, pulled back toward the origin whenever it
 * strays, so it reads as one compact structure rather than a wandering thread.
 */
function buildStructure(random: () => number) {
  const nodes: number[][] = [[0, 0, 0]]
  let x = 0
  let y = 0
  let z = 0

  for (let i = 1; i < NODE_COUNT; i++) {
    const [dx, dy, dz] = onSphere(random)
    const step = 0.55 + random() * 0.25
    x += dx * step
    y += dy * step
    z += dz * step

    const dist = Math.hypot(x, y, z) || 1
    if (dist > STRUCTURE_RADIUS) {
      const pull = STRUCTURE_RADIUS / dist
      x *= pull
      y *= pull
      z *= pull
    }
    nodes.push([x, y, z])
  }

  return nodes
}

const molecule: Layout = (count) => {
  const random = rng(1337)
  const nodes = buildStructure(random)
  const out = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const o = i * 3
    const n = Math.floor(random() * (nodes.length - 1))
    const a = nodes[n]
    const b = nodes[n + 1]

    if (random() < 0.45) {
      const t = random()
      const jitter = 0.035
      out[o] = a[0] + (b[0] - a[0]) * t + (random() - 0.5) * jitter
      out[o + 1] = a[1] + (b[1] - a[1]) * t + (random() - 0.5) * jitter
      out[o + 2] = a[2] + (b[2] - a[2]) * t + (random() - 0.5) * jitter
      continue
    }

    const [dx, dy, dz] = onSphere(random)
    const r = 0.12 + Math.cbrt(random()) * 0.14
    out[o] = a[0] + dx * r
    out[o + 1] = a[1] + dy * r
    out[o + 2] = a[2] + dz * r
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
  const spread = 4.6

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
  molecule,
  cloud,
  strata,
  constellation,
  clumps,
  molecule,
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
  readonly opacity: number
  readonly pointer: number
}

export const LAYOUT_STYLES: readonly LayoutStyle[] = [
  { offsetX: 1.6, offsetY: -1.9, opacity: 1, pointer: 0.9 },
  { offsetX: 1.8, offsetY: 0, opacity: 0.6, pointer: 0.5 },
  { offsetX: 0.4, offsetY: 0, opacity: 0.32, pointer: 0.15 },
  { offsetX: 0, offsetY: 0, opacity: 0.42, pointer: 0.2 },
  { offsetX: 0, offsetY: 0, opacity: 0.4, pointer: 0.2 },
  { offsetX: 2.6, offsetY: -0.5, opacity: 0.9, pointer: 0.8 },
]
