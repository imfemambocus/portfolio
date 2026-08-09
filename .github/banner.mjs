import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/*
 * builds the readme banner, one file per theme. writes a self-contained banner.html
 * (fonts embedded, so it renders identically anywhere) and screenshots it twice.
 *
 * html and png rather than svg on purpose: github will not load a webfont for an svg in a
 * readme, so an svg version falls back to whatever face the viewer happens to have.
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
  /* a soft vignette, so the field has no rectangular edge to read as a cropped screenshot */
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

<script>
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /*
   * the site's own diagonal waves, kept in step with LAYOUTS[0] in src/particles/layouts.ts.
   * this file cannot import from src, so the constants are duplicated: change them there and
   * change them here, or the readme stops matching the site.
   */
  var WAVE_LINES = 6, WAVE_ANGLE = 0.5, WAVE_SPAN = 20, WAVE_SPREAD = 12;
  var WAVE_FREQ = 0.62, WAVE_AMP = 0.6, WAVE_THICKNESS = 0.8;
  var WAVE_PHASE_STEP = 0.28, WAVE_BUILD = 1.7, WAVE_DEPTH = 0.5, WAVE_BIAS = 0.68;

  var random = rng(1337);
  var i, dx = Math.cos(WAVE_ANGLE), dy = Math.sin(WAVE_ANGLE);
  var phases = [], wobble = [];
  for (i = 0; i < WAVE_LINES; i++) {
    phases.push(i * WAVE_PHASE_STEP + (random() - 0.5) * 0.12);
    wobble.push(0.96 + random() * 0.08);
  }

  var points = [];
  for (i = 0; i < 90000; i++) {
    var line = Math.floor(random() * WAVE_LINES);
    var t = Math.pow(random(), WAVE_BIAS);
    var along = (t - 0.5) * WAVE_SPAN;
    var across = (line / (WAVE_LINES - 1) - 0.5) * WAVE_SPREAD;
    var freq = WAVE_FREQ * wobble[line];
    var amp = WAVE_AMP * (0.12 + t * t * WAVE_BUILD);
    var crest = Math.sin(along * freq + phases[line]) * amp +
                Math.sin(along * freq * 2.3 + phases[line] * 1.7) * amp * 0.34;
    var sp = random() - random();
    var offset = across + crest + sp * Math.abs(sp) * WAVE_THICKNESS;
    points.push([
      dx * along - dy * offset,
      dy * along + dx * offset,
      Math.sin(along * 0.4 + phases[line]) * WAVE_DEPTH
    ]);
  }
  points.sort(function (p, q) { return p[2] - q[2]; });

  var extent = WAVE_DEPTH;
  var CX = ${MOTIF_W / 2}, CY = ${MOTIF_H / 2}, SCALE = 14;

  /*
   * one pre-rendered sprite per colour tier, stamped per particle. a createRadialGradient
   * per point is far too slow at this count, and painting flat discs instead loses the
   * soft edge that makes a point read as a particle rather than a dot.
   */
  function sprite(color) {
    var S = 32, c = document.createElement('canvas');
    c.width = S; c.height = S;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grad.addColorStop(0, 'rgba(' + color + ',1)');
    grad.addColorStop(0.25, 'rgba(' + color + ',0.55)');
    grad.addColorStop(0.6, 'rgba(' + color + ',0.12)');
    grad.addColorStop(1, 'rgba(' + color + ',0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);
    return c;
  }

  function render(opts) {
    var canvas = document.getElementById('field');
    var ctx = canvas.getContext('2d');
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, ${MOTIF_W}, ${MOTIF_H});

    var sprites = { near: sprite(opts.near), mid: sprite(opts.mid), far: sprite(opts.far) };

    var buffer = document.createElement('canvas');
    buffer.width = ${MOTIF_W * 2}; buffer.height = ${MOTIF_H * 2};
    var bc = buffer.getContext('2d');
    bc.scale(2, 2);
    // dark accumulates light additively; on an off-white page that would do nothing
    bc.globalCompositeOperation = opts.additive ? 'lighter' : 'source-over';

    for (var k = 0; k < points.length; k++) {
      var p = points[k];
      var depth = Math.min(Math.max((p[2] + extent) / (extent * 2), 0), 1);
      var persp = 1 + (p[2] / extent) * 0.2;
      var px = CX + p[0] * SCALE * persp;
      var py = CY + p[1] * SCALE * persp;
      if (px < -20 || px > ${MOTIF_W} + 20 || py < -20 || py > ${MOTIF_H} + 20) continue;

      // small and tightly graded by depth: the size spread is what reads as particulate
      var rad = 0.4 + depth * depth * 1.45;
      var alpha = (0.05 + depth * 0.17) * opts.gain;
      var art = depth > 0.66 ? sprites.near : depth > 0.34 ? sprites.mid : sprites.far;

      bc.globalAlpha = Math.min(alpha, 1);
      bc.drawImage(art, px - rad, py - rad, rad * 2, rad * 2);
    }
    bc.globalAlpha = 1;

    // a tight halo only. a wide blur smears the points into fog
    if (opts.additive) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = 'blur(7px)';
      ctx.globalAlpha = 0.22;
      ctx.drawImage(buffer, 0, 0, ${MOTIF_W}, ${MOTIF_H});
      ctx.filter = 'none';
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.drawImage(buffer, 0, 0, ${MOTIF_W}, ${MOTIF_H});
  }

  window.paint = function (theme) {
    document.documentElement.dataset.theme = theme;
    if (theme === 'dark') {
      render({ additive: true, gain: 0.85, near: '246,246,243', mid: '214,222,228', far: '150,163,175' });
    } else {
      render({ additive: false, gain: 2.4, near: '23,23,28', mid: '35,42,48', far: '60,68,76' });
    }
  };

  window.paint('dark');
  document.body.dataset.ready = 'true';
</script>
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
