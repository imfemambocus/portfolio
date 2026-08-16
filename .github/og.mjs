import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fieldScript } from './field.mjs'

/*
 * builds public/og.png, the card every service shows when the site's link is pasted. same
 * panel, type scale and motif as the readme banner, but it carries the name rather than the
 * project wordmark, because the link is to a person.
 *
 * 1200x630 is the size facebook, linkedin, x and slack all read. rendered at that size
 * exactly, so nothing resamples it.
 *
 *   npm install --no-save puppeteer && node .github/og.mjs
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')

const font = (path) => readFileSync(resolve(ROOT, path)).toString('base64')

const SANS = font('node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2')
const MONO = font(
  'node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2',
)

const W = 1200
const H = 630

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

  /* the app's own dark tokens, so the card cannot drift from the site */
  html { --bg: #070707; --fg: #f6f6f3; --muted: #8a8a85; --accent: #23a8cc; }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: ${W}px;
    height: ${H}px;
    background: var(--bg);
    color: var(--fg);
    font-family: 'Geist', sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 88px;
    position: relative;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }

  .left { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 26px; }
  .brand { display: flex; align-items: center; gap: 16px; }
  .brand svg { width: 44px; height: 44px; color: var(--accent); flex: none; }
  .brand span { font-size: 52px; font-weight: 600; letter-spacing: -0.035em; }
  .tagline { font-size: 22px; line-height: 1.5; color: var(--muted); max-width: 24ch; }
  .eyebrow {
    font-family: 'Geist Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: var(--muted);
  }

  /*
   * the field runs to all four edges, and the mask clears the left half for the type. it is
   * the site's own composition: copy on the left, waves filling the right.
   */
  canvas {
    position: absolute;
    inset: 0;
    width: ${W}px;
    height: ${H}px;
    mask-image: linear-gradient(to right, transparent 30%, rgba(0, 0, 0, 0.55) 58%, #000 84%);
  }
</style></head><body>
  <canvas id="field" width="${W * 2}" height="${H * 2}"></canvas>
  <div class="left">
    <div class="brand">
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <g stroke="currentColor" stroke-width="3" stroke-linecap="round">
          <path d="M3 21c4-6 7-6 11 0s7 6 11 0"/>
          <path d="M6 12c3.4-5 6-5 9 0s5.6 5 9 0"/>
        </g>
      </svg>
      <span>Isfaaq M. F. Emambocus</span>
    </div>
    <p class="tagline">Full-stack developer. React, React Native, Vue and Laravel.</p>
    <p class="eyebrow">R&amp;D Specialist, LCSB &nbsp;&middot;&nbsp; Luxembourg</p>
  </div>

<script>${fieldScript({ w: W, h: H, cx: 880, cy: 315, scale: 52, count: 220000 })}</script>
</body></html>
`

const html = resolve(HERE, 'og.html')
writeFileSync(html, page)
console.log('wrote .github/og.html (' + (page.length / 1024).toFixed(0) + ' kB)')

const require = createRequire(join(process.cwd(), '/'))
let puppeteer
try {
  puppeteer = require('puppeteer')
} catch {
  console.log('puppeteer not installed. open .github/og.html and screenshot it, or:')
  console.log('  npm install --no-save puppeteer && node .github/og.mjs')
  process.exit(0)
}

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
const tab = await browser.newPage()
await tab.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
await tab.goto('file://' + html, { waitUntil: 'networkidle0' })
await tab.waitForSelector('body[data-ready="true"]')
await tab.evaluate(() => document.fonts.ready)
await tab.screenshot({ path: resolve(ROOT, 'public/og.png') })
console.log('wrote public/og.png')

await browser.close()
