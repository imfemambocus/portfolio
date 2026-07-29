import { writeFileSync } from 'node:fs'

const W = 1280
const H = 420

function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const random = rng(1337)

function onSphere() {
  const theta = random() * Math.PI * 2
  const phi = Math.acos(2 * random() - 1)
  const s = Math.sin(phi)
  return [s * Math.cos(theta), s * Math.sin(theta), Math.cos(phi)]
}

// same bonded-chain walk the site uses for its hero form
const NODES = 88
const RADIUS = 3.4
const nodes = [[0, 0, 0]]
let x = 0
let y = 0
let z = 0
for (let i = 1; i < NODES; i++) {
  const [dx, dy, dz] = onSphere()
  const step = 0.55 + random() * 0.25
  x += dx * step
  y += dy * step
  z += dz * step
  const dist = Math.hypot(x, y, z) || 1
  if (dist > RADIUS) {
    const pull = RADIUS / dist
    x *= pull
    y *= pull
    z *= pull
  }
  nodes.push([x, y, z])
}

// the walk drifts, so recentre on its own centroid and normalise its extent
const centroid = nodes.reduce((acc, n) => [acc[0] + n[0], acc[1] + n[1], acc[2] + n[2]], [0, 0, 0])
  .map((v) => v / nodes.length)
for (const n of nodes) {
  n[0] -= centroid[0]
  n[1] -= centroid[1]
  n[2] -= centroid[2]
}
const extent = Math.max(...nodes.map((n) => Math.hypot(n[0], n[1], n[2])))

const CX = 975
const CY = 200
const TARGET_R = 148
const SCALE = TARGET_R / extent

const points = []
for (let i = 0; i < 1150; i++) {
  const n = Math.floor(random() * (nodes.length - 1))
  const a = nodes[n]
  const b = nodes[n + 1]
  let p
  if (random() < 0.45) {
    const t = random()
    p = [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ]
  } else {
    const [dx, dy, dz] = onSphere()
    const r = 0.12 + Math.cbrt(random()) * 0.15
    p = [a[0] + dx * r, a[1] + dy * r, a[2] + dz * r]
  }
  points.push(p)
}

// a sparse drift trailing off toward the wordmark, kept clear of the type
for (let i = 0; i < 150; i++) {
  const t = random()
  points.push([-1.05 - t * 3.4, (random() - 0.5) * 4.6, (random() - 0.5) * 2.6, 1])
}

points.sort((p, q) => p[2] - q[2])

// the type block, in svg coords. strays drifting over it read as dirt, not atmosphere
const TEXT = { x1: 60, y1: 112, x2: 700, y2: 348 }

const circles = points
  .map(([px, py, pz, stray]) => {
    const depth = (pz + extent) / (extent * 2)
    const persp = 1 + (pz / extent) * 0.19
    const cx = CX + px * SCALE * persp
    const cy = CY + py * SCALE * persp
    if (cx < -40 || cx > W + 40 || cy < -40 || cy > H + 40) return null
    if (stray && cx > TEXT.x1 && cx < TEXT.x2 && cy > TEXT.y1 && cy < TEXT.y2) return null

    const r = (0.45 + depth * 1.75).toFixed(2)
    const opacity = (0.14 + depth * 0.74).toFixed(2)
    const fill = depth > 0.62 ? '#a5f3fc' : depth > 0.3 ? '#67e8f9' : '#a78bfa'
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${fill}" opacity="${opacity}"/>`
  })
  .filter(Boolean)
  .join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t">
<title id="t">Isfaaq Emambocus, R and D Specialist at the LCSB, University of Luxembourg</title>
<defs>
<radialGradient id="glow" cx="72%" cy="50%" r="58%">
<stop offset="0%" stop-color="#5b3fa8" stop-opacity="0.5"/>
<stop offset="45%" stop-color="#1b2a4a" stop-opacity="0.28"/>
<stop offset="100%" stop-color="#07070a" stop-opacity="0"/>
</radialGradient>
<linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
<stop offset="0%" stop-color="#67e8f9" stop-opacity="0.9"/>
<stop offset="100%" stop-color="#a78bfa" stop-opacity="0"/>
</linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="#07070a"/>
<rect width="${W}" height="${H}" fill="url(#glow)"/>
<g>${circles}</g>
<text x="84" y="176" font-family="Iowan Old Style, Palatino, Georgia, serif" font-size="74" fill="#f4f4f6" letter-spacing="-1">Isfaaq Emambocus</text>
<rect x="86" y="206" width="300" height="1" fill="url(#rule)"/>
<text x="84" y="246" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14" fill="#8b8b9a" letter-spacing="3.4">R&amp;D SPECIALIST &#183; LCSB, UNIVERSITY OF LUXEMBOURG</text>
<text x="84" y="304" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="13" fill="#67e8f9" letter-spacing="1.6">48,000 particles &#183; one vertex shader &#183; six forms</text>
<text x="84" y="330" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="13" fill="#5a5a6e" letter-spacing="1.6">react-three-fiber &#183; GLSL &#183; GSAP &#183; Lenis &#183; Vite</text>
</svg>
`

writeFileSync(process.argv[2], svg)
console.log(`wrote ${process.argv[2]}, ${circles.length ? points.length : 0} points, ${(svg.length / 1024).toFixed(1)} kB`)
