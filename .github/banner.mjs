import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/*
 * builds the readme banner. writes a self-contained banner.html (fonts embedded, so it
 * renders identically anywhere) and screenshots it to banner.png with puppeteer.
 *
 * html and png rather than svg on purpose: the banner is set in Anton, and github will
 * not load a webfont for an svg in a readme, so an svg version silently falls back to
 * whatever condensed face the viewer happens to have. rasterising keeps the type exact
 * and lets the particles use real additive blending and a bloom pass.
 *
 * the banner is the same design rendered twice, light and dark, with the dark layer
 * clipped to a diagonal. diagonal rather than a vertical split on purpose: the wordmark
 * sits left and the field sits right, so a vertical cut would show each element in only
 * one theme. the diagonal crosses both, and the meta and stats rows as well.
 *
 *   npm install --no-save puppeteer && node .github/banner.mjs
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')

const font = (path) => readFileSync(resolve(ROOT, path)).toString('base64')

const ANTON = font('node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2')
const MONO = font(
  'node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2',
)

const W = 1280
const H = 460

/*
 * the seam, top x and bottom x as percentages. leans left going down so it cuts through
 * the wordmark's last letters, which is the whole point: the split has to land on shared
 * content or it reads as two unrelated images.
 *
 * it cannot also cross the field. the wordmark ends at 54% of the width and the field
 * starts at 65%, so any straight cut that splits one leaves the other whole, and this
 * seam only just catches the wordmark as it is. moving it right to reach the field loses
 * the type split, which is the more legible signal at readme scale. so the field reads
 * dark-only by composition, not by accident. both layers still render a field: they are
 * structurally identical, and the light one becomes visible the moment the seam moves.
 */
const SEAM_TOP = 57
const SEAM_BOTTOM = 43

const layer = (theme) => `
<div class="layer ${theme}"${theme === 'dark' ? ` style="clip-path: polygon(${SEAM_TOP}% 0, 100% 0, 100% 100%, ${SEAM_BOTTOM}% 100%)"` : ''}>
  <canvas id="field-${theme}" width="${W * 2}" height="${H * 2}" style="width:${W}px;height:${H}px"></canvas>
  <div class="grid">
    <header>
      <div class="rule"></div>
      <div class="meta">
        <div class="stack">
          <div class="mono bright">Emambocus</div>
          <div class="mono">R&amp;D Specialist, LCSB</div>
        </div>
        <div class="stack right">
          <div class="mono">Luxembourg</div>
        </div>
      </div>
    </header>

    <div class="wordmark">Isfaaq</div>

    <footer>
      <div class="rule"></div>
      <div class="foot">
        <div class="mono">7+ years &middot; React, Vue, Laravel</div>
        <div class="mono accent right">80,000 particles &middot; one vertex shader &middot; six forms</div>
      </div>
    </footer>
  </div>
</div>`

const page = `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: 'Anton';
    src: url(data:font/woff2;base64,${ANTON}) format('woff2');
    font-weight: 400;
  }
  @font-face {
    font-family: 'Geist Mono';
    src: url(data:font/woff2;base64,${MONO}) format('woff2');
    font-weight: 100 900;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body { width: ${W}px; height: ${H}px; position: relative; overflow: hidden; }

  /* the app's own tokens, so the banner cannot drift from the site */
  .light {
    --paper: #f6f6f3;
    --ink: #17171c;
    --mist: #5f5f5c;
    --haze: #dcdcd5;
    --accent: #0e7490;
  }

  .dark {
    --paper: #07070a;
    --ink: #f6f6f3;
    --mist: #8a8a85;
    --haze: #26262a;
    --accent: #23a8cc;
  }

  .layer {
    position: absolute;
    inset: 0;
    background: var(--paper);
  }

  canvas { position: absolute; inset: 0; }

  .grid {
    position: absolute;
    inset: 0;
    padding: 44px 80px 40px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .rule { height: 1px; background: var(--haze); }

  .meta {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-top: 18px;
  }

  .mono {
    font-family: 'Geist Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--mist);
  }

  .bright { color: var(--ink); }
  .accent { color: var(--accent); }
  .right { text-align: right; }
  .stack > * + * { margin-top: 7px; }

  .wordmark {
    font-family: 'Anton', sans-serif;
    font-size: 290px;
    line-height: 0.82;
    letter-spacing: -0.012em;
    text-transform: uppercase;
    color: var(--ink);
  }

  .foot {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: 16px;
  }
</style>

${layer('light')}
${layer('dark')}

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

  var random = rng(1337);

  function onSphere() {
    var theta = random() * Math.PI * 2;
    var phi = Math.acos(2 * random() - 1);
    var s = Math.sin(phi);
    return [s * Math.cos(theta), s * Math.sin(theta), Math.cos(phi)];
  }

  // the site's own bonded-chain walk, so the banner shows the hero's structure
  var NODES = 92, LIMIT = 3.4, nodes = [[0, 0, 0]], x = 0, y = 0, z = 0, i, d;
  for (i = 1; i < NODES; i++) {
    var step = onSphere(), len = 0.55 + random() * 0.25;
    x += step[0] * len; y += step[1] * len; z += step[2] * len;
    d = Math.hypot(x, y, z) || 1;
    if (d > LIMIT) { var pull = LIMIT / d; x *= pull; y *= pull; z *= pull; }
    nodes.push([x, y, z]);
  }

  var cx = 0, cy = 0, cz = 0;
  for (i = 0; i < nodes.length; i++) { cx += nodes[i][0]; cy += nodes[i][1]; cz += nodes[i][2]; }
  cx /= nodes.length; cy /= nodes.length; cz /= nodes.length;
  var extent = 0;
  for (i = 0; i < nodes.length; i++) {
    nodes[i][0] -= cx; nodes[i][1] -= cy; nodes[i][2] -= cz;
    extent = Math.max(extent, Math.hypot(nodes[i][0], nodes[i][1], nodes[i][2]));
  }

  var points = [];
  for (i = 0; i < 26000; i++) {
    var n = Math.floor(random() * (nodes.length - 1)), a = nodes[n], b = nodes[n + 1];
    if (random() < 0.46) {
      var t = random(), j = 0.03;
      points.push([
        a[0] + (b[0] - a[0]) * t + (random() - 0.5) * j,
        a[1] + (b[1] - a[1]) * t + (random() - 0.5) * j,
        a[2] + (b[2] - a[2]) * t + (random() - 0.5) * j
      ]);
    } else {
      var o = onSphere(), r = 0.1 + Math.cbrt(random()) * 0.14;
      points.push([a[0] + o[0] * r, a[1] + o[1] * r, a[2] + o[2] * r]);
    }
  }
  // a thin halo, flagged so it is not styled by depth: strays sit past the extent, so
  // depth clamps them to the brightest tier and they would read as a starfield
  for (i = 0; i < 900; i++) {
    var s2 = onSphere(), rr = 1.05 + random() * 0.85;
    points.push([s2[0] * extent * rr, s2[1] * extent * rr * 0.72, s2[2] * extent * rr, 1]);
  }
  points.sort(function (p, q) { return p[2] - q[2]; });

  var CX = 1000, CY = 238, SCALE = 186 / extent;

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

  function render(id, opts) {
    var canvas = document.getElementById(id);
    var ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    var sprites = {
      near: sprite(opts.near), mid: sprite(opts.mid),
      far: sprite(opts.far), stray: sprite(opts.stray)
    };

    var buffer = document.createElement('canvas');
    buffer.width = ${W * 2}; buffer.height = ${H * 2};
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
      if (px < -30 || px > ${W} + 30 || py < -30 || py > ${H} + 30) continue;

      var stray = p[3];
      // small and tightly graded by depth: the size spread is what reads as particulate
      var rad = stray ? 0.5 : 0.42 + depth * depth * 2.0;
      var alpha = (stray ? 0.10 : 0.045 + depth * 0.16) * opts.gain;
      var art = stray ? sprites.stray : depth > 0.66 ? sprites.near : depth > 0.34 ? sprites.mid : sprites.far;

      bc.globalAlpha = Math.min(alpha, 1);
      bc.drawImage(art, px - rad, py - rad, rad * 2, rad * 2);
    }
    bc.globalAlpha = 1;

    if (opts.wash) {
      var wash = ctx.createRadialGradient(CX, CY, 0, CX, CY, 470);
      wash.addColorStop(0, opts.wash);
      wash.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, ${W}, ${H});
    }

    // a tight halo only. the wide blur that was here smeared the points into fog
    if (opts.additive) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = 'blur(9px)';
      ctx.globalAlpha = 0.28;
      ctx.drawImage(buffer, 0, 0, ${W}, ${H});
      ctx.filter = 'none';
      ctx.globalAlpha = 1;
    }

    ctx.drawImage(buffer, 0, 0, ${W}, ${H});
  }

  render('field-dark', {
    additive: true, gain: 1.35,
    near: '246,246,243', mid: '214,222,228', far: '150,163,175', stray: '140,148,160',
    wash: 'rgba(40,44,60,0.30)'
  });

  render('field-light', {
    additive: false, gain: 2.6,
    near: '23,23,28', mid: '35,42,48', far: '60,68,76', stray: '90,96,104',
    wash: null
  });

  document.body.dataset.ready = 'true';
</script>
`

writeFileSync(resolve(HERE, 'banner.html'), page)
console.log('wrote .github/banner.html (' + (page.length / 1024).toFixed(0) + ' kB)')

let puppeteer
try {
  puppeteer = (await import('puppeteer')).default
} catch {
  console.log('puppeteer not installed. open .github/banner.html and screenshot it, or:')
  console.log('  npm install --no-save puppeteer && node .github/banner.mjs')
  process.exit(0)
}

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
const tab = await browser.newPage()
await tab.setViewport({ width: W, height: H, deviceScaleFactor: 2 })
await tab.goto('file://' + resolve(HERE, 'banner.html'), { waitUntil: 'networkidle0' })
await tab.waitForSelector('body[data-ready="true"]')
await new Promise((r) => setTimeout(r, 400))
await tab.screenshot({ path: resolve(HERE, 'banner.png') })
await browser.close()

console.log('wrote .github/banner.png')
