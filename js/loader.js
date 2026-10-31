/**
 * SPACE LOADING SCREEN
 * Cinematic progress bar with animated stars background,
 * boot sequence text, and smooth entry transition.
 */

(function () {
  'use strict';

  /* ── DOM refs ── */
  const overlay   = document.getElementById('loader-overlay');
  const canvas    = document.getElementById('loader-canvas');
  const barFill   = document.getElementById('loader-bar-fill');
  const barGlow   = document.getElementById('loader-bar-glow');
  const pctEl     = document.getElementById('loader-pct');
  const statusEl  = document.getElementById('loader-status');
  const bootLines = document.querySelectorAll('.boot-line');
  const skipBtn   = document.getElementById('loader-skip-btn');

  if (!overlay) return;

  /* ── Stars canvas ── */
  const ctx = canvas.getContext('2d');
  let stars = [];
  let raf;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    spawnStars();
  }

  function spawnStars() {
    stars = [];
    const count = Math.floor((canvas.width * canvas.height) / 3000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.2,
        a: Math.random(),
        speed: Math.random() * 0.008 + 0.002,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function drawStars(ts) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      const alpha = 0.3 + 0.5 * Math.abs(Math.sin(ts * s.speed + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${alpha})`;
      ctx.fill();
    }
    raf = requestAnimationFrame(drawStars);
  }

  resize();
  window.addEventListener('resize', resize);
  raf = requestAnimationFrame(drawStars);

  /* ── Boot lines reveal ── */
  bootLines.forEach((line) => {
    const delay = parseInt(line.dataset.delay) || 0;
    setTimeout(() => line.classList.add('visible'), delay);
  });

  /* ── Progress animation ── */
  let progress = 0;
  const DURATION = 2800; // ms total load time
  const startTime = performance.now();

  // Status labels at certain progress thresholds
  const statusMap = [
    { at: 0,   label: 'LOADING'     },
    { at: 30,  label: 'SYNCING'     },
    { at: 55,  label: 'CALIBRATING' },
    { at: 80,  label: 'FINALIZING'  },
    { at: 99,  label: 'READY'       }
  ];

  function getStatus(pct) {
    let label = 'LOADING';
    for (const s of statusMap) {
      if (pct >= s.at) label = s.label;
    }
    return label;
  }

  function updateBar(pct) {
    pct = Math.min(100, Math.max(0, pct));
    barFill.style.width = pct + '%';
    barGlow.style.width = pct + '%';
    pctEl.textContent   = Math.floor(pct) + '%';
    statusEl.textContent = getStatus(pct);
  }

  function easeInOut(t) {
    // Slow start, fast middle, slight pause at end
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function tick(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / DURATION, 1);
    progress = easeInOut(t) * 100;
    updateBar(progress);

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      // Done — short pause then dismiss
      updateBar(100);
      statusEl.textContent = 'ONLINE ✓';
      setTimeout(dismissLoader, 500);
    }
  }

  requestAnimationFrame(tick);

  /* ── Dismiss ── */
  function dismissLoader() {
    cancelAnimationFrame(raf);
    overlay.classList.add('loader-done');
    // Remove from DOM after fade
    setTimeout(() => {
      overlay.remove();
    }, 900);
  }

  /* ── Skip button ── */
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      updateBar(100);
      dismissLoader();
    });
  }

})();
