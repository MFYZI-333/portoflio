/* MFYZI - Spider-Man suit skin: red/blue suit with web texture spreads over the photo on hover */
(function () {
  'use strict';
  const card = document.getElementById('hero-photo-card');
  if (!card) return;
  card.style.transformStyle = 'flat'; // needed so blend modes work with the tilt

  // web lattice texture (curved diamonds, like the real suit)
  const tile = encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='34' height='34' viewBox='0 0 40 40'>" +
    "<path d='M20 0Q12 10 0 20Q12 30 20 40Q28 30 40 20Q28 10 20 0Z' fill='none' stroke='black' stroke-width='1.3'/>" +
    "<path d='M0 0Q8 6 12 12M40 0Q32 6 28 12M0 40Q8 34 12 28M40 40Q32 34 28 28' fill='none' stroke='black' stroke-width='1'/></svg>");

  const suit = document.createElement('div');
  suit.setAttribute('aria-hidden', 'true');
  const mask = 'radial-gradient(circle at var(--x) var(--y), #000 var(--r), transparent calc(var(--r) + 60px))';
  Object.assign(suit.style, {
    position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: '6', borderRadius: 'inherit', overflow: 'hidden',
    '--x': '50%', '--y': '50%', '--r': '0px', webkitMaskImage: mask, maskImage: mask
  });

  const mkLayer = css => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;inset:0;' + css; suit.appendChild(d); return d; };
  // 1) suit colour: keeps the photo's shading (blend "color"), red body + blue sides/bottom
  mkLayer("background:radial-gradient(ellipse 75% 70% at 50% 42%, #e0001f 0%, #c4001d 48%, #1b3fb3 82%, #0b2a86 100%);mix-blend-mode:color;opacity:.95");
  // 2) extra saturation so the red/blue really pops
  mkLayer("background:radial-gradient(ellipse 75% 70% at 50% 42%, rgba(220,0,30,.55), rgba(200,0,30,.35) 50%, rgba(20,60,190,.55) 85%);mix-blend-mode:soft-light");
  // 3) black web lattice
  mkLayer("background-image:url(\"data:image/svg+xml," + tile + "\");background-size:34px 34px;mix-blend-mode:multiply;opacity:.75");
  // 4) fabric sheen / glossy highlights
  mkLayer("background:linear-gradient(115deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.22) 45%,rgba(255,255,255,0) 60%),radial-gradient(circle at 30% 20%,rgba(255,255,255,.18),transparent 45%);mix-blend-mode:overlay");
  // 5) edge rim light
  mkLayer("box-shadow:inset 0 0 40px rgba(255,0,40,.45), inset 0 0 90px rgba(0,60,255,.35);mix-blend-mode:screen");
  card.appendChild(suit);

  let r = 0, target = 0, raf = null, maxR = 0, last = 0;
  function tick(now) {
    const dt = Math.min(40, now - last); last = now;
    const speed = target > r ? maxR / 650 : maxR / 450; // wrap quickly, unwrap a bit faster
    r += Math.sign(target - r) * speed * dt * (1 - 0.35 * (r / maxR));
    if ((target > r && r > target - 1) || (target < r && r < target + 1) || Math.abs(target - r) < 2) r = target;
    suit.style.setProperty('--r', r + 'px');
    if (r !== target) raf = requestAnimationFrame(tick); else raf = null;
  }
  function go(t) { target = t; if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
  function pos(e) {
    const b = card.getBoundingClientRect();
    suit.style.setProperty('--x', (e.clientX - b.left) + 'px');
    suit.style.setProperty('--y', (e.clientY - b.top) + 'px');
    maxR = Math.hypot(b.width, b.height) + 80;
  }
  card.addEventListener('mouseenter', e => { pos(e); go(maxR); });
  card.addEventListener('mouseleave', () => { go(0); });
  // touch devices: tap toggles the suit
  card.addEventListener('touchstart', e => { const t = e.touches[0]; pos(t); go(target ? 0 : maxR); }, { passive: true });
})();
