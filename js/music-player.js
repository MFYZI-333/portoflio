/* MFYZI - Music player: YouTube hidden, custom UI, press Play to start */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const pod = $('music-player-pod'), iframe = $('yt-track-player');
  if (!pod || !iframe) return;
  const playBtn = $('music-play-btn'), prevBtn = $('music-prev-btn'), nextBtn = $('music-next-btn');
  const bar = $('music-progress-bar'), fill = $('music-progress-fill');
  const cur = $('music-time-current'), tot = $('music-time-total');
  const vol = $('music-volume-slider'), art = $('music-album-art');
  const errEl = $('music-playback-error'), fb = $('music-youtube-fallback');
  const vcv = $('music-visualizer-canvas');

  // Hide the YouTube player completely (keeps it "rendered" so playback works)
  Object.assign(iframe.style, { position: 'fixed', left: '0', bottom: '0', width: '200px', height: '200px', opacity: '0.001', pointerEvents: 'none', zIndex: '-1', border: '0' });
  iframe.tabIndex = -1; iframe.setAttribute('aria-hidden', 'true');

  // Make sure the iframe allows the JS API and does not autoplay
  try {
    const u = new URL(iframe.src);
    u.searchParams.set('enablejsapi', '1'); u.searchParams.set('autoplay', '0'); u.searchParams.delete('mute');
    u.searchParams.set('controls', '0'); u.searchParams.set('disablekb', '1'); u.searchParams.set('modestbranding', '1');
    if (/^https?:/.test(location.protocol)) u.searchParams.set('origin', location.origin);
    iframe.src = u.toString();
  } catch (e) {}

  // spinning vinyl
  const st = document.createElement('style');
  st.textContent = '@keyframes mfyziSpin{to{transform:rotate(360deg)}}';
  document.head.appendChild(st);
  if (art) art.style.animation = 'mfyziSpin 9s linear infinite paused';

  let player = null, ready = false, playing = false, dur = 0;
  const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  const ICON_PLAY = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><polygon points="6,4 20,12 6,20"></polygon></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>';

  function setPlaying(p) {
    playing = p; playBtn.innerHTML = p ? ICON_PAUSE : ICON_PLAY;
    pod.classList.toggle('is-playing', p);
    if (art) art.style.animationPlayState = p ? 'running' : 'paused';
  }
  function showError(msg) { if (errEl) { errEl.textContent = msg; errEl.hidden = false; } if (fb) fb.hidden = false; }

  function init() {
    player = new YT.Player(iframe, {
      events: {
        onReady() {
          ready = true; player.pauseVideo(); player.setVolume(Math.round((+vol.value || 0.2) * 100));
          dur = player.getDuration() || 0; tot.textContent = fmt(dur);
        },
        onStateChange(e) {
          if (e.data === 1) { setPlaying(true); dur = player.getDuration() || dur; tot.textContent = fmt(dur); }
          else if (e.data === 2) setPlaying(false);
          else if (e.data === 0) { player.seekTo(0); player.playVideo(); } // loop
        },
        onError() { setPlaying(false); showError('تعذر تشغيل الأغنية هنا. افتحها على YouTube.'); }
      }
    });
  }
  if (window.YT && YT.Player) init();
  else {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); init(); };
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true;
    s.onerror = () => showError('تعذر تحميل المشغل. افتح الأغنية على YouTube.');
    document.head.appendChild(s);
  }

  playBtn.addEventListener('click', () => {
    if (!ready) { showError('المشغل قيد التحميل، حاول مرة أخرى بعد لحظة.'); setTimeout(() => { if (errEl && ready) errEl.hidden = true; }, 2500); return; }
    if (errEl) errEl.hidden = true;
    if (playing) player.pauseVideo();
    else { player.unMute(); player.setVolume(Math.round(vol.value * 100)); player.playVideo(); }
  });
  const restart = () => { if (ready) { player.seekTo(0, true); if (!playing) { player.unMute(); player.playVideo(); } } };
  prevBtn.addEventListener('click', restart); nextBtn.addEventListener('click', restart);
  vol.addEventListener('input', () => { if (ready) { player.setVolume(Math.round(vol.value * 100)); if (vol.value > 0) player.unMute(); } });
  bar.addEventListener('click', e => {
    if (!ready || !dur) return;
    const r = bar.getBoundingClientRect(); let p = (e.clientX - r.left) / r.width; if (document.dir === 'rtl') p = 1 - p;
    player.seekTo(Math.min(1, Math.max(0, p)) * dur, true);
  });
  setInterval(() => {
    if (!ready || !dur) return;
    const t = player.getCurrentTime() || 0; fill.style.width = (t / dur * 100) + '%'; cur.textContent = fmt(t);
  }, 250);

  // Visualizer (simulated - YouTube audio can't be analysed)
  if (vcv) {
    const c = vcv.getContext('2d'), N = 40, lv = new Array(N).fill(0), tg = new Array(N).fill(0);
    function fit() { const r = vcv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); vcv.width = (r.width || 240) * d; vcv.height = (r.height || 40) * d; }
    fit(); addEventListener('resize', fit);
    let tick = 0;
    (function draw() {
      requestAnimationFrame(draw);
      const w = vcv.width, h = vcv.height; c.clearRect(0, 0, w, h);
      if (++tick % 6 === 0) for (let i = 0; i < N; i++) { const bass = 1 - i / N * 0.6; tg[i] = playing ? Math.random() * bass : 0.03; }
      const bw = w / N;
      for (let i = 0; i < N; i++) {
        lv[i] += (tg[i] - lv[i]) * 0.22;
        const bh = Math.max(2, lv[i] * h), g = c.createLinearGradient(0, h, 0, h - bh);
        g.addColorStop(0, 'rgba(0,102,255,.9)'); g.addColorStop(1, 'rgba(0,245,255,.95)');
        c.fillStyle = g; c.fillRect(i * bw + 1, h - bh, bw - 2, bh);
      }
    })();
  }
  setPlaying(false);
})();
