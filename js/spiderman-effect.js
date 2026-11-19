/* MFYZI - Realistic Spider-Man web effect + 3D tilt + glare */
(function () {
  'use strict';
  const card = document.getElementById('hero-photo-card');
  const cv = card && card.querySelector('.photo-web-canvas');
  if (!card || !cv) return;
  const ctx = cv.getContext('2d');
  const R = (a, b) => a + Math.random() * (b - a);
  const ease = t => 1 - Math.pow(1 - t, 3);
  let W, H, DPR, webs = [], hover = false, mouse = { x: 0, y: 0 };

  // Let the card receive mouse events (the iframe would swallow them)
  const ifr = card.querySelector('iframe');
  if (ifr) ifr.style.pointerEvents = 'none';
  Object.assign(cv.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 8 });
  card.style.transformStyle = 'preserve-3d';
  card.style.willChange = 'transform';

  const glare = document.createElement('div');
  Object.assign(glare.style, { position: 'absolute', inset: '0', pointerEvents: 'none', opacity: 0, mixBlendMode: 'overlay', transition: 'opacity .3s', zIndex: 7, borderRadius: 'inherit' });
  card.appendChild(glare);

  function size() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    const r = card.getBoundingClientRect();
    W = card.offsetWidth; H = card.offsetHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  addEventListener('resize', size); size();

  function addWeb(x, y) {
    const n = Math.floor(R(9, 13)), spokes = [], base = Math.min(W, H) * R(0.38, 0.55);
    for (let i = 0; i < n; i++) spokes.push({ a: (i / n) * 6.283 + R(-.12, .12), l: base * R(0.8, 1.15) });
    // anchor: shot from nearest edge
    const ex = x < W / 2 ? 0 : W, ey = y < H / 2 ? 0 : H;
    webs.push({ x, y, ex, ey, spokes, rings: 6, t0: performance.now(), dur: 900, out: 0, sway: R(0, 6) });
    if (webs.length > 3) webs[0].out = performance.now();
  }

  function pt(w, i, r) { const s = w.spokes[i % w.spokes.length]; return { x: w.x + Math.cos(s.a) * r, y: w.y + Math.sin(s.a) * r }; }

  function drawWeb(w, now) {
    const p = Math.min(1, (now - w.t0) / w.dur);
    let alpha = 1;
    if (w.out) { alpha = 1 - (now - w.out) / 900; if (alpha <= 0) return false; }
    const sh = Math.sin(now * 0.0015 + w.sway) * 1.2; // gentle sway
    ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(180,220,255,.9)'; ctx.shadowBlur = 5;

    // shot thread from the edge (first 25%)
    const sp = ease(Math.min(1, p / 0.25));
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(w.ex, w.ey);
    ctx.lineTo(w.ex + (w.x - w.ex) * sp, w.ey + (w.y - w.ey) * sp); ctx.stroke();

    const q = ease(Math.max(0, (p - 0.2) / 0.8));
    if (q > 0) {
      // radial spokes
      ctx.lineWidth = 1.1; ctx.strokeStyle = 'rgba(255,255,255,.92)';
      w.spokes.forEach(s => {
        const l = s.l * q;
        ctx.beginPath(); ctx.moveTo(w.x, w.y);
        ctx.lineTo(w.x + Math.cos(s.a) * l + sh * q, w.y + Math.sin(s.a) * l);
        ctx.stroke();
      });
      // sagging spiral rings
      ctx.lineWidth = 0.7; ctx.strokeStyle = 'rgba(255,255,255,.8)';
      for (let k = 1; k <= w.rings; k++) {
        const rr = (k / w.rings) * w.spokes[0].l * 0.95 * q;
        for (let i = 0; i < w.spokes.length; i++) {
          const s1 = w.spokes[i], s2 = w.spokes[(i + 1) % w.spokes.length];
          if (rr > Math.min(s1.l, s2.l) * q) continue;
          const a = pt(w, i, rr), b = pt(w, i + 1, rr);
          const mxp = (a.x + b.x) / 2, myp = (a.y + b.y) / 2;
          const sag = 0.28 + k * 0.01; // pull toward center = real web curve
          const cxp = mxp + (w.x - mxp) * sag, cyp = myp + (w.y - myp) * sag;
          ctx.beginPath(); ctx.moveTo(a.x + sh * q, a.y);
          ctx.quadraticCurveTo(cxp + sh * q, cyp, b.x + sh * q, b.y); ctx.stroke();
        }
      }
      // dew-like sparkle at center
      ctx.shadowBlur = 12; ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.beginPath(); ctx.arc(w.x, w.y, 2, 0, 6.283); ctx.fill();
    }
    ctx.restore();
    return true;
  }

  function loop(now) {
    requestAnimationFrame(loop);
    ctx.clearRect(0, 0, W, H);
    webs = webs.filter(w => drawWeb(w, now));
  }
  requestAnimationFrame(loop);

  function local(e) { const r = card.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height }; }

  card.addEventListener('mouseenter', e => {
    hover = true; size(); card.style.transition = 'transform .12s ease-out, box-shadow .3s';
    glare.style.opacity = 1;
    const p = local(e); addWeb(p.x, p.y);
  });
  card.addEventListener('mousemove', e => {
    const p = local(e), px = p.x / p.w - 0.5, py = p.y / p.h - 0.5;
    card.style.transform = `perspective(900px) rotateX(${-py * 14}deg) rotateY(${px * 16}deg) translateZ(20px) scale(1.04)`;
    card.style.boxShadow = `${-px * 40}px ${-py * 40}px 60px rgba(0,180,255,.25), 0 0 40px rgba(255,0,60,.2)`;
    glare.style.background = `radial-gradient(circle at ${p.x}px ${p.y}px, rgba(255,255,255,.55), rgba(255,255,255,0) 55%)`;
  });
  card.addEventListener('mouseleave', () => {
    hover = false; const now = performance.now();
    webs.forEach(w => { if (!w.out) w.out = now; });
    card.style.transition = 'transform .7s cubic-bezier(.2,.8,.2,1), box-shadow .7s';
    card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateZ(0) scale(1)';
    card.style.boxShadow = ''; glare.style.opacity = 0;
  });
  card.addEventListener('click', e => { const p = local(e); addWeb(p.x, p.y); });
})();
