/**
 * DEEP SPACE ENGINE — High Performance Cinematic Canvas
 * Handles dynamic stars, nebula clouds, meteors, parallax, cosmic lightning,
 * and photo gravitational interaction.
 */

class SpaceEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Mouse coordinates & smooth damping (lerp)
    this.mouse = { x: this.width / 2, y: this.height / 2 };
    this.smoothMouse = { x: this.width / 2, y: this.height / 2 };
    this.targetScroll = 0;
    this.smoothScroll = 0;

    // Interaction flags
    this.isAttractingToPhoto = false;
    this.attractTarget = { x: this.width / 2, y: this.height / 2 };
    this.currentSection = 'hero';

    // Entities
    this.stars = [];
    this.dustParticles = [];
    this.meteors = [];
    this.lightningBolts = [];
    this.galaxies = [];
    this.nebulaOrbs = [];

    // Lighting flash state
    this.flashAlpha = 0;
    this.lightningTimer = 0;
    this.nextLightningInterval = 500 + Math.random() * 600; // frames (~10-15s)

    // Reduced motion check
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    this.resize();
    this.createStarfield();
    this.createGalaxies();
    this.createNebulaOrbs();
    this.createDust();

    // Event listeners
    window.addEventListener('resize', () => this.resize(), { passive: true });
    window.addEventListener('mousemove', (e) => this.onMouseMove(e), { passive: true });
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });

    // Start loop
    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.scale(this.dpr, this.dpr);

    // Rebuild or update bounds
    this.createStarfield();
    this.createDust();
  }

  onMouseMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  onScroll() {
    this.targetScroll = window.scrollY;
  }

  setSection(sectionId) {
    this.currentSection = sectionId;
  }

  setPhotoAttraction(active, clientX, clientY) {
    this.isAttractingToPhoto = active;
    if (clientX !== undefined && clientY !== undefined) {
      this.attractTarget.x = clientX;
      this.attractTarget.y = clientY;
    }
  }

  createStarfield() {
    this.stars = [];
    // Mobile optimization: fewer stars
    const isMobile = this.width < 768;
    const starCount = isMobile ? 180 : 420;

    for (let i = 0; i < starCount; i++) {
      // 3 depth layers: 0: far, 1: mid, 2: near
      const depth = Math.random() < 0.6 ? 0 : Math.random() < 0.88 ? 1 : 2;
      let radius, baseAlpha, color;

      if (depth === 0) {
        radius = Math.random() * 0.9 + 0.3;
        baseAlpha = Math.random() * 0.5 + 0.2;
        color = '#ffffff';
      } else if (depth === 1) {
        radius = Math.random() * 1.3 + 0.8;
        baseAlpha = Math.random() * 0.6 + 0.4;
        color = Math.random() > 0.4 ? '#d8f4ff' : '#00f5ff';
      } else {
        radius = Math.random() * 1.8 + 1.2;
        baseAlpha = Math.random() * 0.4 + 0.6;
        color = Math.random() > 0.5 ? '#ffffff' : Math.random() > 0.5 ? '#00e5ff' : '#93c5fd';
      }

      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        depth: depth,
        radius: radius,
        color: color,
        baseAlpha: baseAlpha,
        alpha: baseAlpha,
        twinkleSpeed: Math.random() * 0.03 + 0.008,
        twinklePhase: Math.random() * Math.PI * 2,
        hasCrossSpike: depth === 2 && Math.random() > 0.65
      });
    }
  }

  createGalaxies() {
    this.galaxies = [
      {
        x: this.width * 0.82,
        y: this.height * 0.28,
        rx: 140,
        ry: 55,
        rotation: -0.45,
        colorInner: 'rgba(0, 245, 255, 0.12)',
        colorMid: 'rgba(0, 102, 255, 0.07)',
        colorOuter: 'rgba(15, 23, 42, 0)'
      },
      {
        x: this.width * 0.16,
        y: this.height * 0.75,
        rx: 180,
        ry: 70,
        rotation: 0.38,
        colorInner: 'rgba(99, 102, 241, 0.10)',
        colorMid: 'rgba(14, 165, 233, 0.05)',
        colorOuter: 'rgba(5, 11, 24, 0)'
      }
    ];
  }

  createNebulaOrbs() {
    this.nebulaOrbs = [
      { x: this.width * 0.3, y: this.height * 0.35, r: 380, color: 'rgba(0, 210, 255, 0.055)', vx: 0.08, vy: 0.05 },
      { x: this.width * 0.75, y: this.height * 0.65, r: 450, color: 'rgba(0, 102, 255, 0.045)', vx: -0.06, vy: 0.07 },
      { x: this.width * 0.5, y: this.height * 0.85, r: 520, color: 'rgba(67, 56, 202, 0.04)', vx: 0.04, vy: -0.05 }
    ];
  }

  createDust() {
    this.dustParticles = [];
    const count = this.width < 768 ? 40 : 85;
    for (let i = 0; i < count; i++) {
      this.dustParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.5 + 0.6,
        alpha: Math.random() * 0.4 + 0.15,
        color: Math.random() > 0.4 ? 'rgba(0, 245, 255,' : 'rgba(147, 197, 253,'
      });
    }
  }

  spawnMeteor() {
    const startX = Math.random() * (this.width * 0.9) + this.width * 0.1;
    const startY = Math.random() * (this.height * 0.35) - 50;
    const angle = (Math.PI / 180) * (Math.random() * 25 + 35); // 35 to 60 deg down-left/down-right
    const speed = Math.random() * 8 + 14;
    const length = Math.random() * 110 + 90;

    this.meteors.push({
      x: startX,
      y: startY,
      dx: -Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      length: length,
      alpha: 1,
      decay: Math.random() * 0.015 + 0.018,
      thickness: Math.random() * 1.6 + 1.2,
      sparks: []
    });
  }

  triggerCosmicLightning(startX, startY, intensity = 1.0) {
    const x1 = startX !== undefined ? startX : Math.random() * (this.width * 0.8) + this.width * 0.1;
    const y1 = startY !== undefined ? startY : 0;
    const targetY = y1 + Math.random() * (this.height * 0.6) + this.height * 0.35;
    const targetX = x1 + (Math.random() - 0.5) * (this.width * 0.5);

    const bolt = this.generateFractalLightning(x1, y1, targetX, targetY, 6, 45);
    this.lightningBolts.push({
      segments: bolt,
      alpha: 1.0 * intensity,
      decay: 0.06,
      color: '#ffffff',
      glow: '#00d2ff'
    });

    this.flashAlpha = Math.min(0.55 * intensity, 0.7);
  }

  generateFractalLightning(x1, y1, x2, y2, depth, roughness) {
    let segments = [{ x1, y1, x2, y2 }];
    for (let d = 0; d < depth; d++) {
      const newSegments = [];
      for (const seg of segments) {
        const midX = (seg.x1 + seg.x2) / 2;
        const midY = (seg.y1 + seg.y2) / 2;
        const displacement = (Math.random() - 0.5) * roughness;
        const normalX = -(seg.y2 - seg.y1) * 0.15;
        const normalY = (seg.x2 - seg.x1) * 0.15;

        const displacedX = midX + normalX + displacement;
        const displacedY = midY + normalY + displacement;

        newSegments.push({ x1: seg.x1, y1: seg.y1, x2: displacedX, y2: displacedY });
        newSegments.push({ x1: displacedX, y1: displacedY, x2: seg.x2, y2: seg.y2 });

        // Occasional branch
        if (Math.random() < 0.22 && d < 4) {
          const branchTargetX = displacedX + (Math.random() - 0.5) * 120;
          const branchTargetY = displacedY + Math.random() * 90 + 30;
          newSegments.push({ x1: displacedX, y1: displacedY, x2: branchTargetX, y2: branchTargetY });
        }
      }
      segments = newSegments;
      roughness *= 0.55;
    }
    return segments;
  }

  update() {
    // Parallax damping
    this.smoothMouse.x += (this.mouse.x - this.smoothMouse.x) * 0.05;
    this.smoothMouse.y += (this.mouse.y - this.smoothMouse.y) * 0.05;
    this.smoothScroll += (this.targetScroll - this.smoothScroll) * 0.08;

    const offsetX = (this.smoothMouse.x - this.width / 2) / (this.width / 2);
    const offsetY = (this.smoothMouse.y - this.height / 2) / (this.height / 2);

    // Drifting Nebulas
    for (const orb of this.nebulaOrbs) {
      orb.x += orb.vx;
      orb.y += orb.vy;
      if (orb.x < -100 || orb.x > this.width + 100) orb.vx *= -1;
      if (orb.y < -100 || orb.y > this.height + 100) orb.vy *= -1;
    }

    // Stars update & twinkle
    for (const star of this.stars) {
      star.twinklePhase += star.twinkleSpeed;
      star.alpha = star.baseAlpha + Math.sin(star.twinklePhase) * 0.25;
      star.alpha = Math.max(0.08, Math.min(1, star.alpha));
    }

    // Dust particles
    for (const p of this.dustParticles) {
      if (this.isAttractingToPhoto) {
        // Gravitational pull toward photo
        const dx = this.attractTarget.x - p.x;
        const dy = this.attractTarget.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 450) {
          const force = (450 - dist) / 450 * 1.8;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }
      } else {
        p.x += p.vx;
        p.y += p.vy;
      }

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;
    }

    // Meteors
    // Check section for meteor frequency
    const meteorRate = this.currentSection === 'interests' ? 0.045 : 0.015;
    if (Math.random() < meteorRate && this.meteors.length < 5) {
      this.spawnMeteor();
    }

    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.x += m.dx;
      m.y += m.dy;
      m.alpha -= m.decay;

      // Trail spark particles
      if (Math.random() < 0.4) {
        m.sparks.push({
          x: m.x,
          y: m.y,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          alpha: m.alpha,
          radius: Math.random() * 1.2 + 0.5
        });
      }

      // Update sparks
      for (let s = m.sparks.length - 1; s >= 0; s--) {
        const sp = m.sparks[s];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.alpha -= 0.04;
        if (sp.alpha <= 0) m.sparks.splice(s, 1);
      }

      if (m.alpha <= 0 || m.x < -150 || m.y > this.height + 150) {
        this.meteors.splice(i, 1);
      }
    }

    // Ambient lightning timer
    this.lightningTimer++;
    if (this.lightningTimer > this.nextLightningInterval) {
      this.triggerCosmicLightning();
      this.lightningTimer = 0;
      this.nextLightningInterval = 550 + Math.random() * 650;
    }

    // Lightning decay
    for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
      const b = this.lightningBolts[i];
      b.alpha -= b.decay;
      if (b.alpha <= 0) {
        this.lightningBolts.splice(i, 1);
      }
    }

    if (this.flashAlpha > 0) {
      this.flashAlpha -= 0.04;
      if (this.flashAlpha < 0) this.flashAlpha = 0;
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Deep Space Base Gradient
    const baseGradient = ctx.createLinearGradient(0, 0, 0, this.height);
    baseGradient.addColorStop(0, '#020409');
    baseGradient.addColorStop(0.5, '#050b14');
    baseGradient.addColorStop(1, '#010307');
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Dynamic Nebula Clouds
    for (const orb of this.nebulaOrbs) {
      const grad = ctx.createRadialGradient(orb.x, orb.y, 10, orb.x, orb.y, orb.r);
      grad.addColorStop(0, orb.color);
      grad.addColorStop(1, 'rgba(2, 4, 10, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 3. Distant Galaxies
    for (const gal of this.galaxies) {
      ctx.save();
      ctx.translate(gal.x, gal.y);
      ctx.rotate(gal.rotation);
      const galGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, gal.rx);
      galGrad.addColorStop(0, gal.colorInner);
      galGrad.addColorStop(0.5, gal.colorMid);
      galGrad.addColorStop(1, gal.colorOuter);
      ctx.fillStyle = galGrad;
      ctx.scale(1, gal.ry / gal.rx);
      ctx.beginPath();
      ctx.arc(0, 0, gal.rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Parallax calculations
    const offsetX = (this.smoothMouse.x - this.width / 2) * 0.025;
    const offsetY = (this.smoothMouse.y - this.height / 2) * 0.025;
    const scrollShift = this.smoothScroll * 0.15;

    // 4. Starfield Layers
    for (const star of this.stars) {
      const factor = (star.depth + 1) * 0.45;
      let sx = star.x + offsetX * factor;
      let sy = star.y + offsetY * factor - (scrollShift * factor) % this.height;

      // Wrap-around
      if (sy < 0) sy += this.height;
      if (sy > this.height) sy -= this.height;
      if (sx < 0) sx += this.width;
      if (sx > this.width) sx -= this.width;

      ctx.fillStyle = star.color;
      ctx.globalAlpha = star.alpha;
      ctx.beginPath();
      ctx.arc(sx, sy, star.radius, 0, Math.PI * 2);
      ctx.fill();

      // Cross diffraction spikes on luminous stars
      if (star.hasCrossSpike && star.alpha > 0.6) {
        ctx.strokeStyle = star.color;
        ctx.lineWidth = 0.6;
        const spikeLen = star.radius * 3.5;
        ctx.beginPath();
        ctx.moveTo(sx - spikeLen, sy);
        ctx.lineTo(sx + spikeLen, sy);
        ctx.moveTo(sx, sy - spikeLen);
        ctx.lineTo(sx, sy + spikeLen);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1.0;

    // 5. Cosmic Dust / Energy Particles
    for (const p of this.dustParticles) {
      ctx.fillStyle = p.color + p.alpha + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Meteors / Shooting Stars
    for (const m of this.meteors) {
      ctx.save();
      const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.dx * (m.length / 14), m.y - m.dy * (m.length / 14));
      grad.addColorStop(0, `rgba(255, 255, 255, ${m.alpha})`);
      grad.addColorStop(0.3, `rgba(0, 245, 255, ${m.alpha * 0.85})`);
      grad.addColorStop(0.8, `rgba(0, 102, 255, ${m.alpha * 0.4})`);
      grad.addColorStop(1, 'rgba(0, 30, 80, 0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = m.thickness;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - m.dx * (m.length / 14), m.y - m.dy * (m.length / 14));
      ctx.stroke();

      // Meteor Head Glow
      ctx.fillStyle = `rgba(255, 255, 255, ${m.alpha})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.thickness * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Meteor Sparks
      for (const sp of m.sparks) {
        ctx.fillStyle = `rgba(0, 245, 255, ${sp.alpha})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 7. Cosmic Lightning Bolts
    for (const b of this.lightningBolts) {
      ctx.save();
      // Outer Glow
      ctx.strokeStyle = b.glow;
      ctx.lineWidth = 5;
      ctx.globalAlpha = b.alpha * 0.55;
      ctx.beginPath();
      for (const seg of b.segments) {
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
      }
      ctx.stroke();

      // Inner Core
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = b.alpha;
      ctx.beginPath();
      for (const seg of b.segments) {
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 8. Lightning Screen Flash
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(0, 210, 255, ${this.flashAlpha * 0.35})`;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha * 0.25})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  animate() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}

// Global instance
window.SpaceEngineInstance = null;
window.addEventListener('DOMContentLoaded', () => {
  window.SpaceEngineInstance = new SpaceEngine('space-canvas');
});
