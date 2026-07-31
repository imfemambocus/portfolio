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

const TRUNK_HALF = 3.8
const TRUNK_COMMITS = 11
const EDGE_JITTER = 0.05

/*
 * the branches are hand-placed rather than generated. a random walk gave a blob; the
 * point of this form is that it reads as a commit graph at a glance, and that needs
 * branches that visibly leave the trunk, run alongside it and come back.
 */
const BRANCHES = [
  { from: 1, to: 5, lane: 1.45, depth: 0.8 },
  { from: 3, to: 8, lane: -1.5, depth: -0.7 },
  { from: 6, to: 10, lane: 2.25, depth: 0.35 },
  { from: 2, to: 9, lane: -2.3, depth: 1.1 },
] as const

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1)
  return t * t * (3 - 2 * t)
}

const commitX = (i: number) => -TRUNK_HALF + (i / (TRUNK_COMMITS - 1)) * TRUNK_HALF * 2

// across its span a branch arcs away from the trunk, runs level, then arcs back in
const branchY = (lane: number, u: number) =>
  lane * smoothstep(0, 0.22, u) * (1 - smoothstep(0.78, 1, u))
const branchZ = (depth: number, u: number) => depth * Math.sin(u * Math.PI)

function commitNodes() {
  const nodes: number[][] = []
  for (let i = 0; i < TRUNK_COMMITS; i++) nodes.push([commitX(i), 0, 0])

  BRANCHES.forEach(({ from, to, lane, depth }) => {
    for (let i = from + 1; i < to; i++) {
      const u = (i - from) / (to - from)
      nodes.push([commitX(i), branchY(lane, u), branchZ(depth, u)])
    }
  })

  return nodes
}

/*
 * a commit graph. it replaced a bonded molecular chain, which said biology rather than
 * developer and was the least art-directed of the six forms.
 */
const commitGraph: Layout = (count) => {
  const random = rng(4242)
  const nodes = commitNodes()
  const out = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const o = i * 3

    // most of the field draws the lines, the rest thickens the commits into nodes
    if (random() < 0.62) {
      const onTrunk = random() < 0.38
      const branch = BRANCHES[Math.floor(random() * BRANCHES.length)]
      const u = random()

      out[o] = onTrunk
        ? -TRUNK_HALF + u * TRUNK_HALF * 2
        : commitX(branch.from) + (commitX(branch.to) - commitX(branch.from)) * u
      out[o + 1] = (onTrunk ? 0 : branchY(branch.lane, u)) + (random() - 0.5) * EDGE_JITTER
      out[o + 2] = (onTrunk ? 0 : branchZ(branch.depth, u)) + (random() - 0.5) * EDGE_JITTER
      continue
    }

    const n = nodes[Math.floor(random() * nodes.length)]
    const [dx, dy, dz] = onSphere(random)
    const r = 0.1 + Math.cbrt(random()) * 0.16
    out[o] = n[0] + dx * r
    out[o + 1] = n[1] + dy * r
    out[o + 2] = n[2] + dz * r
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
  commitGraph,
  cloud,
  strata,
  constellation,
  clumps,
  commitGraph,
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
  { offsetX: 4.3, offsetY: -0.85, scale: 0.8, opacity: 1, opacityLight: 1, pointer: 0.2 },
  { offsetX: 1.8, offsetY: 0, scale: 1, opacity: 0.68, opacityLight: 0.95, pointer: 0.12 },
  { offsetX: 0.4, offsetY: 0, scale: 1, opacity: 0.44, opacityLight: 0.9, pointer: 0.05 },
  { offsetX: 0, offsetY: 0, scale: 1, opacity: 0.52, opacityLight: 0.92, pointer: 0.06 },
  { offsetX: 0, offsetY: 0, scale: 1, opacity: 0.5, opacityLight: 0.9, pointer: 0.06 },
  { offsetX: 2.6, offsetY: -0.5, scale: 1.1, opacity: 0.9, opacityLight: 1, pointer: 0.18 },
]
