/* MFYZI - Cinematic intro: hyperspace jump -> shockwave -> title reveal */
(function () {
  'use strict';
  const ov = document.getElementById('intro-overlay'), cv = document.getElementById('intro-canvas');
  if (!ov || !cv) return;
  const ctx = cv.getContext('2d'), skip = document.getElementById('intro-skip-btn');
  const box = document.getElementById('intro-text-container');
  const pre = ov.querySelector('.intro-pre-title'), title = ov.querySelector('.intro-main-title'), line = ov.querySelector('.intro-glow-line');
  // Always start at the top (fixes landing on the MUSIC section)
  try { history.scrollRestoration = 'manual'; } catch (e) {}
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  const toTop = () => window.scrollTo(0, 0);
  toTop(); addEventListener('load', toTop);
  addEventListener('scroll', () => { if (!done) toTop(); }, { passive: true });
  const R = (a, b) => a + Math.random() * (b - a);
  const FONT = "'Space Grotesk','Manrope',system-ui,sans-serif", MONO = "'IBM Plex Mono',ui-monospace,monospace";

  Object.assign(ov.style, { position: 'fixed', inset: '0', zIndex: '9998', background: '#000', opacity: '0', pointerEvents: 'none', overflow: 'hidden' });
  Object.assign(cv.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
  Object.assign(box.style, { position: 'relative', zIndex: '2', textAlign: 'center', width: '100%', top: '50%', transform: 'translateY(-50%)', padding: '0 20px' });
  Object.assign(pre.style, { fontFamily: MONO, fontSize: 'clamp(10px,1.4vw,14px)', letterSpacing: '.6em', color: '#7fdcff', margin: '0 0 22px', opacity: '0' });
  Object.assign(title.style, { fontFamily: FONT, fontWeight: '700', fontSize: 'clamp(26px,5.2vw,64px)', letterSpacing: '.12em', color: '#fff', margin: '0', textShadow: '0 0 30px rgba(0,180,255,.55)' });
  Object.assign(line.style, { height: '2px', width: 'min(420px,70%)', margin: '28px auto 0', background: 'linear-gradient(90deg,transparent,#00f5ff,#fff,#00f5ff,transparent)', transform: 'scaleX(0)', boxShadow: '0 0 18px #00f5ff' });
  if (skip) Object.assign(skip.style, { position: 'absolute', right: '24px', bottom: '24px', zIndex: '3', fontFamily: MONO, fontSize: '11px', letterSpacing: '.25em', color: 'rgba(255,255,255,.7)', background: 'transparent', border: '1px solid rgba(255,255,255,.25)', padding: '10px 16px', borderRadius: '999px', cursor: 'pointer' });

  // split title into letters
  const text = title.textContent.trim(); title.textContent = '';
  const letters = [...text].map(ch => { const s = document.createElement('span'); s.textContent = ch === ' ' ? '\u00A0' : ch; s.style.cssText = 'display:inline-block;opacity:0'; title.appendChild(s); return s; });

  let W, H, DPR, stars = [], running = false, t0 = 0, done = false, flash = 0, ring = -1;
  function size() { DPR = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
  addEventListener('resize', size); size();
  for (let i = 0; i < 700; i++) stars.push({ x: R(-1, 1), y: R(-1, 1), z: R(.05, 1), c: Math.random() < .25 ? '170,210,255' : '255,255,255' });

  function speed(t) { // seconds -> z velocity
    if (t < 2.6) return 0.0015 + Math.pow(t / 2.6, 3) * 0.045;
    if (t < 4.6) return 0.0015 + 0.045 * Math.pow(1 - (t - 2.6) / 2, 2);
    return 0.0015;
  }
  function frame(now) {
    if (!running) return; requestAnimationFrame(frame);
    const t = (now - t0) / 1000;
    ctx.fillStyle = 'rgba(0,0,4,' + (t < 2.8 ? .28 : .5) + ')'; ctx.fillRect(0, 0, W, H);
    const v = speed(t), cx = W / 2, cy = H / 2, f = Math.min(W, H) * 0.9;
    for (const s of stars) {
      const pz = s.z; s.z -= v * 16.67 / 16.67; if (s.z <= .02) { s.x = R(-1, 1); s.y = R(-1, 1); s.z = 1; continue; }
      const x1 = cx + s.x * f / (s.z * 1.6), y1 = cy + s.y * f / (s.z * 1.6), x0 = cx + s.x * f / (pz * 1.6), y0 = cy + s.y * f / (pz * 1.6);
      const a = Math.min(1, (1 - s.z) * 1.6);
      ctx.strokeStyle = `rgba(${s.c},${a})`; ctx.lineWidth = .6 + (1 - s.z) * 1.6;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    // core glow while accelerating
    if (t < 3) { const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * .5); g.addColorStop(0, `rgba(120,190,255,${Math.pow(t / 2.6, 2) * .45})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    // flash + shockwave at the jump exit
    if (t > 2.6 && flash === 0) { flash = 1; ring = 0; }
    if (flash > 0) { ctx.fillStyle = `rgba(210,235,255,${flash * .85})`; ctx.fillRect(0, 0, W, H); flash = Math.max(0, flash - .035); if (flash === 0) flash = -1; }
    if (ring >= 0) { ring += 14; ctx.strokeStyle = `rgba(0,230,255,${Math.max(0, 1 - ring / (W * .7))})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, ring, 0, 6.283); ctx.stroke(); if (ring > W) ring = -2; }
    if (t > 6.2) finish();
  }

  function reveal() {
    pre.animate([{ opacity: 0, letterSpacing: '1.2em' }, { opacity: 1, letterSpacing: '.6em' }], { duration: 1400, fill: 'forwards', easing: 'cubic-bezier(.2,.8,.2,1)' });
    letters.forEach((s, i) => s.animate([{ opacity: 0, filter: 'blur(14px)', transform: 'translateY(30px) scale(1.4)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }], { duration: 900, delay: 350 + i * 55, fill: 'forwards', easing: 'cubic-bezier(.2,.8,.2,1)' }));
    line.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 1200, delay: 1100, fill: 'forwards', easing: 'cubic-bezier(.6,0,.2,1)' });
  }

  function finish() {
    if (done) return; done = true;
    const a = ov.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.25)' }], { duration: 1100, easing: 'ease-in', fill: 'forwards' });
    a.onfinish = () => { running = false; ov.style.display = 'none'; document.body.classList.remove('intro-active'); if (document.activeElement) document.activeElement.blur(); toTop(); setTimeout(toTop, 60); setTimeout(toTop, 300); window.dispatchEvent(new Event('intro:done')); };
  }

  function start() {
    if (running || done) return; running = true; t0 = performance.now();
    ov.style.opacity = '1'; ov.style.pointerEvents = 'auto';
    setTimeout(reveal, 2500); requestAnimationFrame(frame);
  }
  window.startIntro = start;
  if (skip) skip.addEventListener('click', () => { if (!running) { ov.style.display = 'none'; document.body.classList.remove('intro-active'); done = true; toTop(); } else finish(); });

  // wait until the loader screen is gone, then play the intro (fallback after 9s)
  const t00 = performance.now();
  (function wait() {
    const ld = document.getElementById('loader-overlay');
    const gone = !ld || !document.body.contains(ld) || getComputedStyle(ld).display === 'none' || getComputedStyle(ld).visibility === 'hidden' || parseFloat(getComputedStyle(ld).opacity) < 0.05;
    if ((gone && document.readyState !== 'loading') || performance.now() - t00 > 9000) start(); else setTimeout(wait, 120);
  })();
})();
