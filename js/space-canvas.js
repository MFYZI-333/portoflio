/* MFYZI - Photoreal deep space: Milky Way, dust lanes, nebula, magnitude-based stars, lightning */
(function () {
  'use strict';
  const cv = document.getElementById('space-canvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const R = (a, b) => a + Math.random() * (b - a);
  let W, H, DPR, bg, bgW, bgH, layers = [], mx = 0, my = 0, cx = 0, cy = 0;
  const meteors = []; let bolt = null;

  /* ---------- value-noise fBm ---------- */
  const hash = (x, y) => { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; };
  const sm = t => t * t * (3 - 2 * t);
  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  }
  function fbm(x, y, o) { let v = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { v += a * noise(x * f, y * f); f *= 2.03; a *= 0.5; } return v; }
  const step = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* ---------- static background (Milky Way + nebula) ---------- */
  function buildBackground() {
    bgW = Math.ceil(W * 1.2); bgH = Math.ceil(H * 1.2);
    const nw = Math.ceil(bgW / 3), nh = Math.ceil(bgH / 3);
    const small = document.createElement('canvas'); small.width = nw; small.height = nh;
    const sc = small.getContext('2d'), img = sc.createImageData(nw, nh), d = img.data;
    const ang = -0.5, sa = Math.sin(ang), ca = Math.cos(ang), seed = Math.random() * 100;
    for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) {
      const u = x / nw, v = y / nh, aspect = nw / nh;
      const px = (u - 0.5) * aspect, py = v - 0.5;
      const dist = px * sa + py * ca;                  // distance from galactic plane
      const along = px * ca - py * sa;
      const band = Math.exp(-Math.pow(dist / 0.17, 2));
      const core = Math.exp(-(Math.pow((along - 0.12) / 0.34, 2) + Math.pow(dist / 0.12, 2)));
      const n1 = fbm(u * 6 + seed, v * 6, 6), n2 = fbm(u * 11 + 7, v * 11 + seed, 5);
      const lane = step(0.48, 0.72, n2) * Math.exp(-Math.pow((dist - 0.01) / 0.1, 2)); // dark dust lanes
      let b = band * (0.28 + 0.95 * n1) + core * 0.7;
      b = Math.max(0, b - lane * 0.95);
      // coloured emission nebulae away from the band
      const e1 = step(0.52, 0.85, fbm(u * 2.4 + seed, v * 2.4 + 20, 5)) * 0.30;
      const e2 = step(0.55, 0.88, fbm(u * 2.2 + 50, v * 2.2 + seed, 5)) * 0.24;
      const warm = Math.min(1, core * 1.4);
      let r = 3 + b * (95 + 140 * warm) + e1 * 120 + e2 * 20;
      let g = 4 + b * (110 + 80 * warm) + e1 * 30 + e2 * 95;
      let bl = 9 + b * (150 + 10 * warm) + e1 * 170 + e2 * 150;
      const i = (y * nw + x) * 4;
      d[i] = Math.min(255, r); d[i + 1] = Math.min(255, g); d[i + 2] = Math.min(255, bl); d[i + 3] = 255;
    }
    sc.putImageData(img, 0, 0);
    bg = document.createElement('canvas'); bg.width = bgW; bg.height = bgH;
    const b = bg.getContext('2d'); b.imageSmoothingQuality = 'high'; b.drawImage(small, 0, 0, bgW, bgH);
    // dense faint stars concentrated on the galactic plane
    const asp = bgW / bgH;
    for (let i = 0; i < 14000; i++) {
      const x = Math.random() * bgW, y = Math.random() * bgH;
      const px = (x / bgW - 0.5) * asp, py = y / bgH - 0.5;
      const dist = px * sa + py * ca, p = Math.exp(-Math.pow(dist / 0.2, 2));
      if (Math.random() > 0.15 + p * 0.85) continue;
      b.fillStyle = `rgba(${200 + R(0, 55) | 0},${200 + R(0, 55) | 0},255,${R(0.1, 0.55) * (0.4 + p)})`;
      b.fillRect(x, y, Math.random() < 0.9 ? 1 : 1.5, 1);
    }
    // vignette
    const vg = b.createRadialGradient(bgW / 2, bgH / 2, bgH * 0.3, bgW / 2, bgH / 2, bgW * 0.7);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,6,0.55)');
    b.fillStyle = vg; b.fillRect(0, 0, bgW, bgH);
  }

  /* ---------- dynamic stars (3 parallax layers, real magnitude distribution) ---------- */
  const tints = ['255,255,255', '175,200,255', '255,235,205', '255,200,170', '200,215,255'];
  function buildStars() {
    layers = [0.012, 0.03, 0.07].map((par, li) => {
      const n = Math.floor(W * H / [2600, 6000, 22000][li]);
      return {
        par, stars: Array.from({ length: n }, () => ({
          x: R(-0.1, 1.1) * W, y: R(-0.1, 1.1) * H,
          s: 0.3 + Math.pow(Math.random(), 7) * (2.2 + li * 0.6),
          t: tints[(Math.random() * tints.length) | 0], ph: R(0, 6.28), sp: R(0.4, 1.6), a: R(0.35, 1)
        }))
      };
    });
  }

  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildBackground(); buildStars();
  }

  /* ---------- lightning ---------- */
  function makeBolt() {
    const sx = R(W * 0.15, W * 0.85), ex = sx + R(-W * 0.18, W * 0.18), ey = H * R(0.55, 0.95), segs = [];
    (function jag(a, b, off, dp, w) {
      if (!dp) { segs.push([a, b, w]); return; }
      const m = { x: (a.x + b.x) / 2 + R(-.5, .5) * off, y: (a.y + b.y) / 2 + R(-.5, .5) * off * .4 };
      jag(a, m, off / 2, dp - 1, w); jag(m, b, off / 2, dp - 1, w);
      if (dp >= 4 && w > .4 && Math.random() < .2) jag(m, { x: m.x + (Math.random() < .5 ? -1 : 1) * R(30, 180), y: m.y + R(60, 260) }, off / 2.2, dp - 2, w * .5);
    })({ x: sx, y: -10 }, { x: ex, y: ey }, H * .35, 7, 1);
    window.dispatchEvent(new Event('mfyzi:lightning'));
    bolt = { segs, sx, f: 0, seq: [1, .15, .9, .3, .65, .2, .35, .12, .06, .02] };
  }
  function drawBolt(a) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(bolt.sx, 0, 0, bolt.sx, 0, H * 1.1);
    g.addColorStop(0, `rgba(140,170,255,${a * .35})`); g.addColorStop(1, 'rgba(60,80,200,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = `rgba(150,180,255,${a * .06})`; ctx.fillRect(0, 0, W, H);
    ctx.lineCap = ctx.lineJoin = 'round';
    for (const [lw, al, col] of [[16, .07, '90,130,255'], [7, .18, '130,170,255'], [3, .55, '200,220,255'], [1.2, 1, '255,255,255']]) {
      ctx.strokeStyle = `rgba(${col},${al * a})`;
      for (const [p, q, w] of bolt.segs) { ctx.lineWidth = Math.max(.4, lw * w); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
    }
    ctx.restore();
  }
  window.triggerLightning = makeBolt;
  let nextBolt = performance.now() + R(4000, 7000);

  addEventListener('mousemove', e => { mx = e.clientX / W - .5; my = e.clientY / H - .5; }, { passive: true });
  addEventListener('resize', resize);

  let last = performance.now(), fr = 0;
  function frame(t) {
    requestAnimationFrame(frame);
    if (document.hidden) { last = t; return; }
    const dt = Math.min(50, t - last) / 16.67; last = t; fr += dt;
    cx += (mx - cx) * .04; cy += (my - cy) * .04;
    // background with very slow drift + parallax
    const drift = Math.sin(fr * 0.0006) * 14;
    ctx.drawImage(bg, -(bgW - W) / 2 - cx * 40 + drift, -(bgH - H) / 2 - cy * 28, bgW, bgH);

    for (const L of layers) {
      const ox = -cx * L.par * W + fr * L.par * 0.05, oy = -cy * L.par * H;
      for (const s of L.stars) {
        let x = (s.x + ox) % (W * 1.2); if (x < 0) x += W * 1.2; x -= W * .1;
        const y = s.y + oy;
        const al = s.a * (0.78 + 0.22 * Math.sin(fr * 0.04 * s.sp + s.ph));
        if (s.s > 1.4) { // bright stars: soft glow + diffraction spikes
          const gl = s.s * 5, g = ctx.createRadialGradient(x, y, 0, x, y, gl);
          g.addColorStop(0, `rgba(${s.t},${al * .55})`); g.addColorStop(1, `rgba(${s.t},0)`);
          ctx.fillStyle = g; ctx.fillRect(x - gl, y - gl, gl * 2, gl * 2);
          ctx.strokeStyle = `rgba(${s.t},${al * .35})`; ctx.lineWidth = .6;
          ctx.beginPath(); ctx.moveTo(x - gl * 1.6, y); ctx.lineTo(x + gl * 1.6, y); ctx.moveTo(x, y - gl * 1.6); ctx.lineTo(x, y + gl * 1.6); ctx.stroke();
        }
        ctx.fillStyle = `rgba(${s.t},${al})`;
        ctx.beginPath(); ctx.arc(x, y, s.s * .6, 0, 6.283); ctx.fill();
      }
    }

    if (Math.random() < .0035 * dt) {
      const a = R(.5, .9), sp = R(12, 20);
      meteors.push({ x: R(0, W), y: R(-40, H * .35), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, l: R(90, 220), life: 1 });
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i]; m.x += m.vx * dt; m.y += m.vy * dt; m.life -= .02 * dt;
      if (m.life <= 0) { meteors.splice(i, 1); continue; }
      const sp = Math.hypot(m.vx, m.vy), tx = m.x - m.vx / sp * m.l, ty = m.y - m.vy / sp * m.l;
      const g = ctx.createLinearGradient(m.x, m.y, tx, ty);
      g.addColorStop(0, `rgba(255,255,255,${m.life})`); g.addColorStop(.3, `rgba(190,215,255,${m.life * .5})`); g.addColorStop(1, 'rgba(120,160,255,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
    }

    if (!bolt && t > nextBolt) makeBolt();
    if (bolt) {
      const i = Math.floor(bolt.f);
      if (i >= bolt.seq.length) { bolt = null; nextBolt = t + R(5000, 12000); }
      else { drawBolt(bolt.seq[i] * (.85 + Math.random() * .15)); bolt.f += .35 * dt; }
    }
  }
  resize();
  requestAnimationFrame(frame);
})();
