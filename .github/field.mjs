/*
 * the browser-side script that paints the site's diagonal waves onto a canvas, shared by
 * the readme banner and the share card so the wave constants exist in one place here
 * rather than one per generator.
 *
 * the constants are kept in step with LAYOUTS[0] in src/particles/layouts.ts by hand.
 * nothing under .github can import from src, so change them in both places or the
 * generated images quietly stop matching the site.
 */
export const fieldScript = ({ w, h, cx, cy, scale, count }) => `
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

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
  for (i = 0; i < ${count}; i++) {
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
  var CX = ${cx}, CY = ${cy}, SCALE = ${scale};

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
    ctx.clearRect(0, 0, ${w}, ${h});

    var sprites = { near: sprite(opts.near), mid: sprite(opts.mid), far: sprite(opts.far) };

    var buffer = document.createElement('canvas');
    buffer.width = ${w * 2}; buffer.height = ${h * 2};
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
      if (px < -20 || px > ${w} + 20 || py < -20 || py > ${h} + 20) continue;

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
      ctx.drawImage(buffer, 0, 0, ${w}, ${h});
      ctx.filter = 'none';
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.drawImage(buffer, 0, 0, ${w}, ${h});
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
`
