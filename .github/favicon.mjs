import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import opentype from 'opentype.js'
import sharp from 'sharp'

/*
 * builds the favicon: an IE monogram cut from real Anton outlines, on the signature blue.
 *
 * the glyphs are converted to paths rather than set as text, because a favicon cannot
 * load a webfont: an <svg> with font-family="Anton" falls back to whatever condensed
 * face the viewer happens to have, or to nothing.
 *
 *   npm install --no-save opentype.js sharp && node .github/favicon.mjs
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const PUBLIC = resolve(ROOT, 'public')

const TILE = 32
const RADIUS = 7
/*
 * 23 of 32, arrived at by rasterising at 16px and looking. Anton's counters are tight:
 * edge to edge the E fills in and the monogram turns to mush. the tile has to visibly
 * frame the letters for them to stay legible small.
 */
const INK_HEIGHT = 23
const OFF_BLACK = '#070707'
const OFF_WHITE = '#f6f6f3'

const font = opentype.parse(
  readFileSync(resolve(ROOT, 'node_modules/@fontsource/anton/files/anton-latin-400-normal.woff'))
    .buffer,
)

// measure at an arbitrary size, then scale so the ink is exactly INK_HEIGHT tall
const probe = font.getPath('IE', 0, 0, 100).getBoundingBox()
const size = (INK_HEIGHT / (probe.y2 - probe.y1)) * 100

const path = font.getPath('IE', 0, 0, size)
const ink = path.getBoundingBox()

path.commands.forEach((command) => {
  const dx = (TILE - (ink.x2 - ink.x1)) / 2 - ink.x1
  const dy = (TILE - (ink.y2 - ink.y1)) / 2 - ink.y1
  for (const [x, y] of [
    ['x', 'y'],
    ['x1', 'y1'],
    ['x2', 'y2'],
  ]) {
    if (command[x] !== undefined) command[x] += dx
    if (command[y] !== undefined) command[y] += dy
  }
})

/*
 * the tile inverts on dark. an off-black tile on a dark tab strip measures 1.2:1: the
 * badge dissolves and only the letters survive. inverting keeps a solid mark in both.
 *
 * it follows prefers-color-scheme rather than the app's own theme, deliberately. the tab
 * strip follows the OS, so the OS is the signal that matches the surface this sits on.
 * the in-app toggle would put an off-black tile on a dark tab strip for anyone on a dark
 * OS who picks light on the site.
 *
 * the colours are presentation attributes with CSS supplying only the dark case. CSS
 * beats presentation attributes, which leaves any rasteriser that ignores the stylesheet
 * (the one generating the PNGs below included) with the light-chrome version instead of
 * an unstyled black-on-black square.
 */
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TILE} ${TILE}" width="${TILE}" height="${TILE}">
  <style>
    @media (prefers-color-scheme: dark) {
      .tile { fill: ${OFF_WHITE} }
      .mark { fill: ${OFF_BLACK} }
    }
  </style>
  <rect class="tile" width="${TILE}" height="${TILE}" rx="${RADIUS}" fill="${OFF_BLACK}"/>
  <path class="mark" d="${path.toPathData(2)}" fill="${OFF_WHITE}"/>
</svg>
`

writeFileSync(resolve(PUBLIC, 'favicon.svg'), svg)

await Promise.all([
  sharp(resolve(PUBLIC, 'favicon.svg'), { density: 600 })
    .resize(32, 32)
    .png()
    .toFile(resolve(PUBLIC, 'favicon.png')),
  sharp(resolve(PUBLIC, 'favicon.svg'), { density: 600 })
    .resize(180, 180)
    .png()
    .toFile(resolve(PUBLIC, 'apple-touch-icon.png')),
])

console.log(`wrote favicon.svg, favicon.png, apple-touch-icon.png (ink ${INK_HEIGHT}/${TILE})`)
