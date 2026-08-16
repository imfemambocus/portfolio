import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fieldScript } from './field.mjs'

/*
 * builds the readme banner, one file per theme. writes a self-contained banner.html
 * (fonts embedded, so it renders identically anywhere) and screenshots it twice.
 *
 * html and png rather than svg on purpose. github will not load a webfont for an svg in a
 * readme: an svg version falls back to whatever face the viewer happens to have.
 * rasterising keeps the type exact and lets the particles use real additive blending.
 *
 *   npm install --no-save puppeteer && node .github/banner.mjs
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')

const font = (path) => readFileSync(resolve(ROOT, path)).toString('base64')

const SANS = font('node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2')
const MONO = font(
  'node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2',
)

const W = 1280
const H = 360

// the motif slot, in css pixels. the field is drawn to bleed past it and is clipped back
const MOTIF_W = 430
const MOTIF_H = 200

const page = `<!doctype html>
<html data-theme="dark"><head><meta charset="utf-8">
<style>
  @font-face {
    font-family: 'Geist';
    src: url(data:font/woff2;base64,${SANS}) format('woff2');
    font-weight: 100 900;
  }
  @font-face {
    font-family: 'Geist Mono';
    src: url(data:font/woff2;base64,${MONO}) format('woff2');
    font-weight: 100 900;
  }

  /* the app's own tokens, so the banner cannot drift from the site */
  html[data-theme='dark'] {
    --bg: #070707;
    --fg: #f6f6f3;
    --muted: #8a8a85;
    --accent: #23a8cc;
  }

  html[data-theme='light'] {
    --bg: #f6f6f3;
    --fg: #17171c;
    --muted: #5f5f5c;
    --accent: #0e7490;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: ${W}px;
    height: ${H}px;
    background: var(--bg);
    color: var(--fg);
    font-family: 'Geist', sans-serif;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 76px;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }

  .left { display: flex; flex-direction: column; gap: 22px; }
  .brand { display: flex; align-items: center; gap: 13px; }
  .brand svg { width: 30px; height: 30px; color: var(--accent); }
  .brand span { font-size: 37px; font-weight: 600; letter-spacing: -0.035em; }
  .tagline { font-size: 17px; line-height: 1.5; color: var(--muted); max-width: 23ch; }
  .eyebrow {
    font-family: 'Geist Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .motif { width: ${MOTIF_W}px; height: ${MOTIF_H}px; flex: none; position: relative; overflow: hidden; }
  canvas { position: absolute; inset: 0; width: ${MOTIF_W}px; height: ${MOTIF_H}px; }
  /* a soft vignette. a rectangular edge reads as a screenshot cropped onto the panel */
  #field {
    mask-image: radial-gradient(closest-side ellipse at 50% 50%, #000 45%, transparent 100%);
  }
</style></head><body>
  <div class="left">
    <div class="brand">
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <g stroke="currentColor" stroke-width="3" stroke-linecap="round">
          <path d="M3 21c4-6 7-6 11 0s7 6 11 0"/>
          <path d="M6 12c3.4-5 6-5 9 0s5.6 5 9 0"/>
        </g>
      </svg>
      <span>Portfolio</span>
    </div>
    <p class="tagline">One particle field that becomes every section of the page.</p>
    <p class="eyebrow">React Three Fiber &nbsp;&middot;&nbsp; GLSL &nbsp;&middot;&nbsp; GSAP</p>
  </div>
  <div class="motif">
    <canvas id="field" width="${MOTIF_W * 2}" height="${MOTIF_H * 2}"></canvas>
  </div>

<script>${fieldScript({ w: MOTIF_W, h: MOTIF_H, cx: MOTIF_W / 2, cy: MOTIF_H / 2, scale: 14, count: 90000 })}</script>
</body></html>
`

const html = resolve(HERE, 'banner.html')
writeFileSync(html, page)
console.log('wrote .github/banner.html (' + (page.length / 1024).toFixed(0) + ' kB)')

const require = createRequire(join(process.cwd(), '/'))
let puppeteer
try {
  puppeteer = require('puppeteer')
} catch {
  console.log('puppeteer not installed. open .github/banner.html and screenshot it, or:')
  console.log('  npm install --no-save puppeteer && node .github/banner.mjs')
  process.exit(0)
}

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
const tab = await browser.newPage()
await tab.setViewport({ width: W, height: H, deviceScaleFactor: 2 })
await tab.goto('file://' + html, { waitUntil: 'networkidle0' })
await tab.waitForSelector('body[data-ready="true"]')

for (const theme of ['dark', 'light']) {
  await tab.evaluate((value) => window.paint(value), theme)
  await tab.evaluate(() => document.fonts.ready)
  await tab.screenshot({ path: resolve(HERE, `banner-${theme}.png`) })
  console.log(`wrote .github/banner-${theme}.png`)
}

await browser.close()
