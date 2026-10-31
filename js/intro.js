/**
 * CINEMATIC INTRO CONTROLLER
 * Sequence: Dark Space -> Massive Cosmic Lightning Bolt -> Shockwave Flash ->
 * Cosmic Particle Burst -> "WELCOME TO MY PORTFOLIO" -> Warp Zoom -> Hero Reveal
 */

class CinematicIntro {
  constructor() {
    this.overlay = document.getElementById('intro-overlay');
    this.canvas = document.getElementById('intro-canvas');
    this.textContainer = document.getElementById('intro-text-container');
    this.skipBtn = document.getElementById('intro-skip-btn');
    this.warpContainer = document.getElementById('intro-warp-container');
    this.heroSection = document.getElementById('hero');

    if (!this.overlay || !this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.scale(this.dpr, this.dpr);

    this.particles = [];
    this.shockwaves = [];
    this.lightningBranches = [];
    this.isLightningActive = false;
    this.lightningFlash = 0;
    this.isCompleted = false;

    this.init();
  }

  init() {
    this.skipBtn.addEventListener('click', () => this.completeIntro(true));
    this.runIntroSequence();
  }

  async runIntroSequence() {
    // 1. Initial State: Dark space with faint stars emerging (0 to 600ms)
    await this.wait(400);

    // 2. MASSIVE CINEMATIC LIGHTNING STRIKE (~600ms)
    this.triggerMassiveLightning();

    // 3. Energy Flash & Shockwave Ring (~700ms - 1100ms)
    await this.wait(250);
    this.triggerEnergyShockwave();

    // 4. Reveal "WELCOME TO MY PORTFOLIO" (~1200ms)
    await this.wait(350);
    this.revealWelcomeText();

    // 5. Star Warp Zoom Transition (~2700ms)
    await this.wait(1400);
    this.triggerWarpTransition();

    // 6. Complete and remove overlay (~3400ms)
    await this.wait(800);
    this.completeIntro(false);
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  triggerMassiveLightning() {
    this.isLightningActive = true;
    this.overlay.classList.add('screen-shake');

    // Create primary giant bolt cutting from top across screen
    const startX = this.width * (0.35 + Math.random() * 0.3);
    const startY = 0;
    const endX = this.width * (0.4 + (Math.random() - 0.5) * 0.4);
    const endY = this.height * 0.85;

    this.lightningBranches = this.buildForkedLightning(startX, startY, endX, endY, 7, 75);
    this.lightningFlash = 1.0;

    // Trigger Space background lightning in sync
    if (window.SpaceEngineInstance) {
      window.SpaceEngineInstance.triggerCosmicLightning(startX, startY, 1.2);
    }

    // Audio SFX synthesis if available
    this.playCosmicThunderSFX();

    // Loop render
    this.renderIntroEffects();

    setTimeout(() => {
      this.overlay.classList.remove('screen-shake');
    }, 450);
  }

  buildForkedLightning(x1, y1, x2, y2, depth, spread) {
    let lines = [{ x1, y1, x2, y2, alpha: 1.0, main: true }];

    for (let i = 0; i < depth; i++) {
      const next = [];
      for (const line of lines) {
        const mx = (line.x1 + line.x2) / 2;
        const my = (line.y1 + line.y2) / 2;
        const offset = (Math.random() - 0.5) * spread;
        const nx = -(line.y2 - line.y1) * 0.12;
        const ny = (line.x2 - line.x1) * 0.12;

        const px = mx + nx + offset;
        const py = my + ny + offset;

        next.push({ x1: line.x1, y1: line.y1, x2: px, y2: py, alpha: line.alpha, main: line.main });
        next.push({ x1: px, y1: py, x2: line.x2, y2: line.y2, alpha: line.alpha, main: line.main });

        // Branching forks
        if (Math.random() < 0.35 && i < 5) {
          const angle = (Math.random() - 0.5) * 1.5;
          const len = (Math.random() * 80 + 40);
          next.push({
            x1: px,
            y1: py,
            x2: px + Math.cos(angle) * len,
            y2: py + Math.sin(angle) * len + 20,
            alpha: line.alpha * 0.8,
            main: false
          });
        }
      }
      lines = next;
      spread *= 0.5;
    }
    return lines;
  }

  triggerEnergyShockwave() {
    const cx = this.width / 2;
    const cy = this.height * 0.45;

    // Expanding shockwaves
    this.shockwaves.push({ x: cx, y: cy, radius: 10, maxRadius: Math.max(this.width, this.height) * 0.75, alpha: 1.0, speed: 18 });
    this.shockwaves.push({ x: cx, y: cy, radius: 5, maxRadius: Math.max(this.width, this.height) * 0.55, alpha: 0.85, speed: 12 });

    // Cosmic Particle Burst
    const count = this.width < 768 ? 60 : 120;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 14 + 4;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1.0,
        decay: Math.random() * 0.02 + 0.015,
        size: Math.random() * 3 + 1.5,
        color: Math.random() > 0.4 ? '#00f5ff' : '#ffffff'
      });
    }
  }

  revealWelcomeText() {
    if (this.textContainer) {
      this.textContainer.classList.add('visible');
    }
  }

  triggerWarpTransition() {
    if (this.warpContainer) {
      this.warpContainer.classList.add('active');
    }
    this.overlay.classList.add('warp-zoom-out');
  }

  completeIntro(skipped = false) {
    if (this.isCompleted) return;
    this.isCompleted = true;

    this.overlay.classList.add('fade-out');

    setTimeout(() => {
      this.overlay.style.display = 'none';
      document.body.classList.remove('intro-active');
      document.body.classList.add('site-ready');

      // Trigger entrance animations in Hero
      const heroContent = document.querySelector('.hero-content');
      if (heroContent) {
        heroContent.classList.add('animate-in');
      }
    }, 700);
  }

  renderIntroEffects() {
    if (this.isCompleted) return;

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.globalAlpha = 1;

    // 1. Lightning Flash Screen
    if (this.lightningFlash > 0) {
      this.ctx.fillStyle = `rgba(0, 215, 255, ${this.lightningFlash * 0.45})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash * 0.55})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.lightningFlash -= 0.045;
    }

    // 2. Giant Lightning Bolt Render
    if (this.lightningBranches.length > 0) {
      // Glow pass
      this.ctx.save();
      this.ctx.strokeStyle = '#00f5ff';
      this.ctx.lineWidth = 8;
      this.ctx.shadowColor = '#00f5ff';
      this.ctx.shadowBlur = 25;
      this.ctx.beginPath();
      for (const line of this.lightningBranches) {
        this.ctx.globalAlpha = line.alpha * 0.7;
        this.ctx.moveTo(line.x1, line.y1);
        this.ctx.lineTo(line.x2, line.y2);
      }
      this.ctx.stroke();

      // White Hot Core
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 3;
      this.ctx.shadowColor = '#ffffff';
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      for (const line of this.lightningBranches) {
        this.ctx.globalAlpha = line.alpha;
        this.ctx.moveTo(line.x1, line.y1);
        this.ctx.lineTo(line.x2, line.y2);
      }
      this.ctx.stroke();
      this.ctx.restore();

      // Fade out bolt
      for (const line of this.lightningBranches) {
        line.alpha -= 0.07;
      }
      this.lightningBranches = this.lightningBranches.filter(l => l.alpha > 0);
    }

    // 3. Shockwave rings
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed;
      sw.alpha -= 0.022;

      this.ctx.save();
      this.ctx.strokeStyle = `rgba(0, 245, 255, ${sw.alpha})`;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();

      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 4. Exploding Cosmic Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.alpha -= p.decay;

      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
    this.ctx.globalAlpha = 1;

    requestAnimationFrame(() => this.renderIntroEffects());
  }

  playCosmicThunderSFX() {
    // Graceful synthesized cosmic thunder using AudioContext
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const actx = new AudioCtx();
      if (actx.state === 'suspended') return; // Browser policy, will play once user interacts

      // White noise buffer for thunder crash
      const bufferSize = actx.sampleRate * 1.5;
      const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = actx.createBufferSource();
      whiteNoise.buffer = buffer;

      // Lowpass filter for deep thunder rumble
      const filter = actx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, actx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(45, actx.currentTime + 1.2);

      const gain = actx.createGain();
      gain.gain.setValueAtTime(0.35, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 1.4);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(actx.destination);

      whiteNoise.start();
      whiteNoise.stop(actx.currentTime + 1.5);
    } catch (e) {
      // Audio not permitted yet or unsupported; silent fallback
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('intro-active');
  window.CinematicIntroInstance = new CinematicIntro();
});
