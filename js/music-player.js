/**
 * CELESTIAL MUSIC MODULE — Compact & Ultra-Premium Space Audio Player
 * - YouTube IFrame API integration for real tracks
 * - Native Web Audio API ambient cosmic synthesizer fallback
 * - Live real-time Canvas Audio Spectrum Visualizer
 * - Sleek holographic vinyl / orbit rotation
 */

/* ============================================================
   YOUTUBE IFRAME API — Load asynchronously
   ============================================================ */
(function loadYouTubeAPI() {
  if (document.getElementById('yt-iframe-api')) return;
  const playerFrame = document.getElementById('yt-track-player');
  if (playerFrame && /^https?:$/.test(location.protocol)) {
    const playerUrl = new URL(playerFrame.src);
    playerUrl.searchParams.set('origin', location.origin);
    playerFrame.src = playerUrl.href;
  }

  const tag = document.createElement('script');
  tag.id = 'yt-iframe-api';
  tag.src = 'https://www.youtube.com/iframe_api';
  tag.onerror = () => {
    window._ytFailed = true;
    if (window.CelestialMusicInstance) {
      window.CelestialMusicInstance.showYouTubeFallback();
    }
  };
  document.head.appendChild(tag);
})();

// Global YT Player instance (set by YouTube callback)
window._ytPlayer = null;
window._ytReady  = false;
window._ytFailed = false;

// Called automatically by YouTube API when ready
window.onYouTubeIframeAPIReady = function () {
  window._ytReady = true;
  window._ytFailed = false;
  if (window._ytPendingCreate) {
    window._ytPendingCreate();
  }
};

/* ============================================================
   CELESTIAL MUSIC PLAYER CLASS
   ============================================================ */
class CelestialMusicPlayer {
  constructor() {
    this.container      = document.getElementById('music-player-pod');
    if (!this.container) return;

    this.playBtn        = document.getElementById('music-play-btn');
    this.prevBtn        = document.getElementById('music-prev-btn');
    this.nextBtn        = document.getElementById('music-next-btn');
    this.progressBar    = document.getElementById('music-progress-bar');
    this.progressFill   = document.getElementById('music-progress-fill');
    this.timeCurrent    = document.getElementById('music-time-current');
    this.timeTotal      = document.getElementById('music-time-total');
    this.albumArt       = document.getElementById('music-album-art');
    this.trackTitle     = document.getElementById('music-track-title');
    this.trackArtist    = document.getElementById('music-track-artist');
    this.playbackError  = document.getElementById('music-playback-error');
    this.youtubeFallback = document.getElementById('music-youtube-fallback');
    this.visualizerCanvas = document.getElementById('music-visualizer-canvas');
    this.volumeSlider   = document.getElementById('music-volume-slider');
    this.audioEl        = document.getElementById('real-audio-element');

    this.vCtx = this.visualizerCanvas ? this.visualizerCanvas.getContext('2d') : null;

    /* ────────────────────────────────────────────────
       PLAYLIST  — add youtubeId for YouTube tracks
    ──────────────────────────────────────────────── */
    this.playlist = [
      {
        title:     "it's 3am, you need sleep.",
        artist:    "she's gone",
        cover:     "assets/album1.svg",
        duration:  0,
        youtubeId: "jDczYMUgCm0",
        audioSrc:  ""
      },
      {
        title:     "STORMY - KILOWAT (VISUALIZER)",
        artist:    "STORMY",
        cover:     "assets/album1.svg",
        duration:  0,               // will be fetched from YT player
        youtubeId: "vkto_zK0SUg",  // ← YouTube video ID
        audioSrc:  ""
      },
      {
        title:    "Spider's Orbit (Midnight City)",
        artist:   "Across the Cosmos • Neon Verse",
        cover:    "assets/album2.svg",
        duration: 215,
        audioSrc: ""
      },
      {
        title:    "Starlight Quantum Drift",
        artist:   "Celestial Horizon • Synth Realm",
        cover:    "assets/album3.svg",
        duration: 198,
        audioSrc: ""
      }
    ];

    this.currentIndex = 0;
    this.isPlaying    = false;
    this.currentTime  = 0;
    this.volume       = 0.2;
    this.timer        = null;
    this.autoplayPending = true;

    // Web Audio API synth nodes (fallback)
    this.audioCtx    = null;
    this.analyser    = null;
    this.synthOscs   = [];
    this.synthGain   = null;
    this.synthFilter = null;
    this.dataArray   = null;

    // YouTube player ref
    this.ytPlayer       = null;
    this.ytReadyForPlayback = false;
    this.ytProgressTimer = null;

    this.init();
  }

  /* ─────────────────────── INIT ─────────────────────── */
  init() {
    this.loadTrack(0);

    this.playBtn.addEventListener('click', () => this.togglePlay());
    this.prevBtn.addEventListener('click', () => this.prevTrack());
    this.nextBtn.addEventListener('click', () => this.nextTrack());

    if (this.progressBar) {
      this.progressBar.addEventListener('click', (e) => this.seek(e));
    }
    if (this.volumeSlider) {
      this.volumeSlider.value = String(this.volume);
      this.volumeSlider.addEventListener('input', (e) => {
        this.setVolume(parseFloat(e.target.value));
      });
    }
    document.addEventListener('pointerdown', () => this._enableAutoplayAudio(), { once: true });
    document.addEventListener('keydown', () => this._enableAutoplayAudio(), { once: true });
    if (window._ytFailed) this.showYouTubeFallback();

    if (this.visualizerCanvas) {
      this.visualizerCanvas.width  = 160;
      this.visualizerCanvas.height = 40;
    }
    this.drawVisualizer();
  }

  /* ─────────────────── LOAD TRACK ─────────────────── */
  loadTrack(index) {
    this.currentIndex = index;
    const track = this.playlist[index];

    this.trackTitle.textContent  = track.title;
    this.trackArtist.textContent = track.artist;
    this.albumArt.src            = track.cover;
    this.timeCurrent.textContent = '00:00';
    this.currentTime             = 0;
    if (this.playbackError) {
      this.playbackError.hidden = true;
      this.playbackError.textContent = '';
    }
    if (this.youtubeFallback) this.youtubeFallback.hidden = true;

    const youtubePlayerContainer = document.getElementById('yt-track-player');
    if (youtubePlayerContainer) youtubePlayerContainer.hidden = !track.youtubeId;

    if (track.youtubeId) {
      this.timeTotal.textContent = '⏳';
      this._setupYouTubePlayer(track.youtubeId);
      if (window._ytFailed) this.showYouTubeFallback();
    } else {
      this.timeTotal.textContent = this.formatTime(track.duration);
      this._destroyYouTubePlayer();
      if (this.audioEl && track.audioSrc) {
        this.audioEl.src = track.audioSrc;
        this.audioEl.load();
      }
    }
    this.updateProgressUI();
  }

  /* ─────────────────── YOUTUBE SETUP ─────────────────── */
  _setupYouTubePlayer(videoId) {
    const createPlayer = () => {
      if (this.playlist[this.currentIndex].youtubeId !== videoId) return;

      if (this.ytPlayer) return;

      const container = document.getElementById('yt-track-player');
      if (!container) return;

      this.ytPlayer = new YT.Player(container, {
        events: {
          onReady: (e) => {
            if (e.target !== this.ytPlayer) return;
            this.ytReadyForPlayback = true;
            e.target.setVolume(this.volume * 100);
            if (this.autoplayPending &&
                this.playlist[this.currentIndex].youtubeId === videoId) {
              this.autoplayPending = false;
              e.target.unMute();
              e.target.setVolume(this.volume * 100);
              e.target.playVideo();
            }
            // Get duration once ready
            const dur = e.target.getDuration();
            if (dur && dur > 0 &&
                this.playlist[this.currentIndex].youtubeId === videoId) {
              this.playlist[this.currentIndex].duration = dur;
              this.timeTotal.textContent = this.formatTime(dur);
            }
            // Auto-play if player was already playing
            if (this.isPlaying &&
                this.playlist[this.currentIndex].youtubeId === videoId) {
              e.target.playVideo();
            }
          },
          onStateChange: (e) => {
            if (e.target !== this.ytPlayer ||
                this.playlist[this.currentIndex].youtubeId !== videoId) return;
            if (e.data === YT.PlayerState.ENDED) {
              this.nextTrack();
            }
            if (e.data === YT.PlayerState.PLAYING) {
              this._setPlayingUI(true);
              if (this.playbackError) this.playbackError.hidden = true;
              if (this.youtubeFallback) this.youtubeFallback.hidden = true;
              // Sync duration
              const dur = this.ytPlayer.getDuration();
              if (dur > 0) {
                this.playlist[this.currentIndex].duration = dur;
                this.timeTotal.textContent = this.formatTime(dur);
              }
              this._startYTProgressSync();
            }
            if (e.data === YT.PlayerState.PAUSED) {
              this._setPlayingUI(false);
              this._stopYTProgressSync();
            } else if (e.data === YT.PlayerState.BUFFERING) {
              this._stopYTProgressSync();
            }
          },
          onError: (e) => {
            if (e.target !== this.ytPlayer ||
                this.playlist[this.currentIndex].youtubeId !== videoId) return;
            this._stopYTProgressSync();
            this._setPlayingUI(false);
            if (this.playbackError) {
              const messages = {
                2: 'معرّف الفيديو غير صالح.',
                5: 'تعذّر تشغيل الفيديو في هذا المتصفح.',
                100: 'الفيديو غير متاح أو تمت إزالته.',
                101: 'لا يسمح مالك الفيديو بتشغيله هنا.',
                150: 'لا يسمح مالك الفيديو بتشغيله هنا.',
                153: 'تعذّر التحقق من مصدر التشغيل. افتح الموقع عبر خادم محلي أو افتح الأغنية على YouTube.'
              };
              this.playbackError.textContent = messages[e.data] || 'تعذّر تشغيل الأغنية. جرّب فتحها على YouTube.';
              this.playbackError.hidden = false;
            }
            if (this.youtubeFallback) this.youtubeFallback.hidden = false;
          }
        }
      });

      // keep global ref
      window._ytPlayer = this.ytPlayer;
    };

    if (window._ytReady) {
      createPlayer();
    } else {
      window._ytPendingCreate = createPlayer;
    }
  }

  _destroyYouTubePlayer() {
    this._stopYTProgressSync();
    if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      this.ytPlayer.pauseVideo();
    }
  }

  showYouTubeFallback() {
    if (!this.playlist[this.currentIndex].youtubeId) return;
    this._setPlayingUI(false);
    if (this.playbackError) {
      this.playbackError.textContent = 'استخدم أزرار الفيديو لتشغيل الأغنية. يمكنك أيضًا فتحها مباشرة على YouTube.';
      this.playbackError.hidden = false;
    }
    if (this.youtubeFallback) this.youtubeFallback.hidden = false;
  }

  _enableAutoplayAudio() {
    const track = this.playlist[this.currentIndex];
    if (!track.youtubeId || !this.ytPlayer || !this.ytReadyForPlayback) return;

    this.ytPlayer.unMute();
    this.ytPlayer.setVolume(this.volume * 100);
    if (this.ytPlayer.getPlayerState() !== YT.PlayerState.PLAYING) {
      this.ytPlayer.playVideo();
    }
  }

  _startYTProgressSync() {
    this._stopYTProgressSync();
    this.ytProgressTimer = setInterval(() => {
      if (!this.ytPlayer) return;
      try {
        this.currentTime = this.ytPlayer.getCurrentTime() || 0;
        this.updateProgressUI();
      } catch(e) {}
    }, 500);
  }

  _stopYTProgressSync() {
    if (this.ytProgressTimer) {
      clearInterval(this.ytProgressTimer);
      this.ytProgressTimer = null;
    }
  }

  /* ─────────────────── AUDIO CONTEXT ─────────────────── */
  initAudioContext() {
    if (this.audioCtx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;

    this.audioCtx    = new AC();
    this.analyser    = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 64;
    this.dataArray   = new Uint8Array(this.analyser.frequencyBinCount);

    this.synthGain   = this.audioCtx.createGain();
    this.synthGain.gain.setValueAtTime(this.volume * 0.25, this.audioCtx.currentTime);

    this.synthFilter = this.audioCtx.createBiquadFilter();
    this.synthFilter.type = 'lowpass';
    this.synthFilter.frequency.setValueAtTime(800, this.audioCtx.currentTime);

    this.synthFilter.connect(this.synthGain);
    this.synthGain.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
  }

  /* ─────────────────── PLAY / PAUSE ─────────────────── */
  togglePlay() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  play() {
    const track = this.playlist[this.currentIndex];

    if (track.youtubeId && !this.ytPlayer && window._ytFailed) {
      this.showYouTubeFallback();
      return;
    }

    this._setPlayingUI(true);

    if (track.youtubeId) {
      // ── YouTube track ──
      if (this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
        this.ytPlayer.unMute();
        this.ytPlayer.setVolume(this.volume * 100);
        this.ytPlayer.playVideo();
      } else {
        // Player not ready yet — set up and auto-play via onReady event
        this._setupYouTubePlayer(track.youtubeId);
      }
      // Animate album art
      this._startAlbumSpin();
    } else if (track.audioSrc && this.audioEl) {
      // ── MP3 track ──
      this.initAudioContext();
      if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
      this.audioEl.currentTime = this.currentTime;
      this.audioEl.play().catch(() => {});
      this._startAlbumSpin();
      clearInterval(this.timer);
      this.timer = setInterval(() => this._tickProgress(), 1000);
    } else {
      // ── Synth fallback ──
      this.initAudioContext();
      if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
      this.startSynthesizerMusic();
      this._startAlbumSpin();
      clearInterval(this.timer);
      this.timer = setInterval(() => this._tickProgress(), 1000);
    }
  }

  pause() {
    this._setPlayingUI(false);

    const track = this.playlist[this.currentIndex];

    clearInterval(this.timer);
    this._stopYTProgressSync();

    if (track.youtubeId && this.ytPlayer) {
      try { this.ytPlayer.pauseVideo(); } catch(e) {}
    }
    if (this.audioEl) this.audioEl.pause();
    this.stopSynthesizerMusic();
    this._stopAlbumSpin();
  }

  _tickProgress() {
    this.currentTime++;
    const track = this.playlist[this.currentIndex];
    if (track.duration > 0 && this.currentTime >= track.duration) {
      this.nextTrack();
    } else {
      this.updateProgressUI();
    }
  }

  /* ─────────────────── ALBUM ART SPIN ─────────────────── */
  _setPlayingUI(playing) {
    this.isPlaying = playing;
    this.container.classList.toggle('is-playing', playing);
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('width', '20');
    icon.setAttribute('height', '20');
    icon.setAttribute('fill', 'currentColor');

    if (playing) {
      for (const x of [6, 14]) {
        const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bar.setAttribute('x', String(x));
        bar.setAttribute('y', '4');
        bar.setAttribute('width', '4');
        bar.setAttribute('height', '16');
        bar.setAttribute('rx', '1');
        icon.append(bar);
      }
    } else {
      const playIcon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      playIcon.setAttribute('points', '6,4 20,12 6,20');
      icon.append(playIcon);
    }

    this.playBtn.replaceChildren(icon);

    if (playing) this._startAlbumSpin();
    else this._stopAlbumSpin();
  }

  _startAlbumSpin() {
    if (this.albumArt) this.albumArt.style.animationPlayState = 'running';
  }
  _stopAlbumSpin() {
    if (this.albumArt) this.albumArt.style.animationPlayState = 'paused';
  }

  /* ─────────────────── SYNTH FALLBACK ─────────────────── */
  startSynthesizerMusic() {
    if (!this.audioCtx) return;
    this.stopSynthesizerMusic();
    const freqs = [65.41, 98.00, 155.56, 233.08];
    this.synthOscs = freqs.map((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      osc.detune.setValueAtTime((idx - 1.5) * 8, this.audioCtx.currentTime);
      const oscGain = this.audioCtx.createGain();
      oscGain.gain.setValueAtTime(0.2 / freqs.length, this.audioCtx.currentTime);
      osc.connect(oscGain);
      oscGain.connect(this.synthFilter);
      osc.start();
      return osc;
    });
  }

  stopSynthesizerMusic() {
    for (const osc of this.synthOscs) {
      try { osc.stop(); osc.disconnect(); } catch(e) {}
    }
    this.synthOscs = [];
  }

  /* ─────────────────── NEXT / PREV ─────────────────── */
  nextTrack() {
    const was = this.isPlaying;
    if (was) this.pause();
    this.loadTrack((this.currentIndex + 1) % this.playlist.length);
    if (was) this.play();
  }

  prevTrack() {
    const was = this.isPlaying;
    if (was) this.pause();
    let idx = this.currentIndex - 1;
    if (idx < 0) idx = this.playlist.length - 1;
    this.loadTrack(idx);
    if (was) this.play();
  }

  /* ─────────────────── SEEK ─────────────────── */
  seek(e) {
    const rect  = this.progressBar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const track = this.playlist[this.currentIndex];
    const newTime = ratio * (track.duration || 0);

    this.currentTime = newTime;

    if (track.youtubeId && this.ytPlayer) {
      try { this.ytPlayer.seekTo(newTime, true); } catch(e) {}
    } else if (this.audioEl && track.audioSrc) {
      this.audioEl.currentTime = newTime;
    }
    this.updateProgressUI();
  }

  /* ─────────────────── VOLUME ─────────────────── */
  setVolume(val) {
    this.volume = val;
    if (this.synthGain && this.audioCtx) {
      this.synthGain.gain.setValueAtTime(this.volume * 0.25, this.audioCtx.currentTime);
    }
    if (this.audioEl) this.audioEl.volume = this.volume;
    if (this.ytPlayer) {
      try { this.ytPlayer.setVolume(this.volume * 100); } catch(e) {}
    }
  }

  /* ─────────────────── PROGRESS UI ─────────────────── */
  updateProgressUI() {
    const track = this.playlist[this.currentIndex];
    const dur   = track.duration || 0;
    const pct   = dur > 0 ? (this.currentTime / dur) * 100 : 0;
    if (this.progressFill)  this.progressFill.style.width = `${pct}%`;
    if (this.timeCurrent)   this.timeCurrent.textContent  = this.formatTime(this.currentTime);
    if (this.timeTotal && dur > 0) this.timeTotal.textContent = this.formatTime(dur);
  }

  formatTime(sec) {
    sec = Math.floor(sec || 0);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  /* ─────────────────── VISUALIZER ─────────────────── */
  drawVisualizer() {
    if (this.vCtx && this.visualizerCanvas) {
      const ctx = this.vCtx;
      const w   = this.visualizerCanvas.width;
      const h   = this.visualizerCanvas.height;
      ctx.clearRect(0, 0, w, h);

      const numBars  = 18;
      const barWidth = 4;
      const gap      = (w - numBars * barWidth) / (numBars - 1);

      if (this.isPlaying && this.analyser) {
        this.analyser.getByteFrequencyData(this.dataArray);
      }

      for (let i = 0; i < numBars; i++) {
        let barH;
        if (this.isPlaying) {
          if (this.dataArray && this.dataArray[i]) {
            barH = (this.dataArray[i] / 255) * h * 0.85 + 4;
          } else {
            // Lively wave animation (YouTube or synth playing)
            barH = Math.sin(Date.now() * 0.005 + i * 0.4) * (h * 0.35) + (h * 0.45);
          }
        } else {
          barH = 3;
        }

        const x    = i * (barWidth + gap);
        const y    = h - barH;
        const grad = ctx.createLinearGradient(0, y, 0, h);
        grad.addColorStop(0, '#00f5ff');
        grad.addColorStop(1, '#0066ff');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, 2);
        ctx.fill();
      }
    }
    requestAnimationFrame(() => this.drawVisualizer());
  }
}

/* ─────────────────── GLOBAL INIT ─────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  window.CelestialMusicInstance = new CelestialMusicPlayer();
});
