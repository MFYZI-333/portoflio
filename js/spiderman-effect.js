/**
 * SPIDER-MAN PHOTO EFFECT & COSMIC PHOTO INTERACTION
 * - 3D Tilt & Parallax Physics
 * - Cursor Gravitational Pull on Deep Space Stars
 * - Cyber Glitch & Scanline Sequence
 * - Spider-Man Holographic Mask & Glowing Eyes
 * - Procedural Spider-Web Geometry Animation
 */

class SpiderPhotoEffect {
  constructor(cardSelector) {
    this.card = document.querySelector(cardSelector);
    if (!this.card) return;

    this.container = this.card.closest('.hero-photo-wrapper');
    this.scanBeam = this.card.querySelector('.photo-scan-beam');
    this.webCanvas = this.card.querySelector('.photo-web-canvas');
    this.energyRing = this.container.querySelector('.photo-energy-ring');

    // Canvas for web strands
    this.ctx = this.webCanvas ? this.webCanvas.getContext('2d') : null;

    // Tilt states
    this.rect = this.card.getBoundingClientRect();
    this.mouseX = 0;
    this.mouseY = 0;
    this.currentRotateX = 0;
    this.currentRotateY = 0;
    this.targetRotateX = 0;
    this.targetRotateY = 0;

    // Hover states & phases
    this.isHovered = false;
    this.isFaceHovered = false;
    this.hoverTimeout = null;
    this.glitchActive = false;

    // Web animation particles
    this.webFilaments = [];
    this.webEmbers = [];

    this.init();
  }

  init() {
    this.updateBounds();
    window.addEventListener('resize', () => this.updateBounds(), { passive: true });
    window.addEventListener('scroll', () => this.updateBounds(), { passive: true });

    // Desktop Mouse Events
    this.card.addEventListener('mouseenter', (e) => this.onMouseEnter(e));
    this.card.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.card.addEventListener('mouseleave', () => this.onMouseLeave());

    // Mobile Touch Events
    this.card.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
    this.card.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: true });
    this.card.addEventListener('touchend', () => this.onTouchEnd());

    // Start physics & web canvas loop
    this.animate();
  }

  updateBounds() {
    this.rect = this.card.getBoundingClientRect();
    if (this.webCanvas) {
      this.webCanvas.width = this.rect.width;
      this.webCanvas.height = this.rect.height;
    }
  }

  onMouseEnter(e) {
    this.isHovered = true;
    this.card.classList.add('is-hovered');

    // Notify Space canvas for gravitational pull
    const centerX = this.rect.left + this.rect.width / 2;
    const centerY = this.rect.top + this.rect.height / 2;
    if (window.SpaceEngineInstance) {
      window.SpaceEngineInstance.setPhotoAttraction(true, centerX, centerY);
    }

    // Step 1: Initial Glitch Trigger (150ms)
    this.triggerGlitch();

    // Step 2: Trigger Scanline
    this.card.classList.add('scanning');

    // Step 3: Spawn Spider Web Filaments
    this.generateWebFilaments();

    // Step 4: Red/Blue Dual Energy Surge
    this.card.classList.add('energy-active');
  }

  onMouseMove(e) {
    if (!this.rect) this.updateBounds();

    const clientX = e.clientX;
    const clientY = e.clientY;

    const x = clientX - this.rect.left;
    const y = clientY - this.rect.top;

    // Calculate normalized -1 to +1
    const normX = (x / this.rect.width) * 2 - 1;
    const normY = (y / this.rect.height) * 2 - 1;

    // 3D Tilt rotation angles
    this.targetRotateY = normX * 14;  // deg
    this.targetRotateX = -normY * 14; // deg

    // Check if mouse is hovering over the Face Area (top 15% to 55%, center 60%)
    const faceLeft = this.rect.width * 0.22;
    const faceRight = this.rect.width * 0.78;
    const faceTop = this.rect.height * 0.15;
    const faceBottom = this.rect.height * 0.55;

    const insideFace = (x >= faceLeft && x <= faceRight && y >= faceTop && y <= faceBottom);
    if (insideFace !== this.isFaceHovered) {
      this.isFaceHovered = insideFace;
      if (this.isFaceHovered) {
        this.card.classList.add('face-focused');
        this.emitWebEmbers(x, y, 12);
      } else {
        this.card.classList.remove('face-focused');
      }
    }

    // Spawn subtle web sparks along cursor
    if (Math.random() < 0.25) {
      this.emitWebEmbers(x, y, 2);
    }
  }

  onMouseLeave() {
    this.isHovered = false;
    this.isFaceHovered = false;
    this.targetRotateX = 0;
    this.targetRotateY = 0;

    this.card.classList.remove('is-hovered', 'scanning', 'energy-active', 'face-focused');

    if (window.SpaceEngineInstance) {
      window.SpaceEngineInstance.setPhotoAttraction(false);
    }

    // Gradual clear of web filaments
    this.clearWebs();
  }

  onTouchStart(e) {
    if (e.touches.length > 0) {
      this.onMouseEnter(e.touches[0]);
    }
  }

  onTouchMove(e) {
    if (e.touches.length > 0) {
      this.onMouseMove(e.touches[0]);
    }
  }

  onTouchEnd() {
    setTimeout(() => this.onMouseLeave(), 1200);
  }

  triggerGlitch() {
    this.card.classList.add('glitching');
    setTimeout(() => {
      this.card.classList.remove('glitching');
    }, 380);
  }

  generateWebFilaments() {
    this.webFilaments = [];
    const w = this.rect.width;
    const h = this.rect.height;

    // Corner anchor points for Spider-Man webs
    const anchors = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: 0, y: h },
      { x: w, y: h },
      { x: w * 0.5, y: 0 },
      { x: 0, y: h * 0.4 },
      { x: w, y: h * 0.4 }
    ];

    const faceCenter = { x: w * 0.5, y: h * 0.35 };

    // Procedural web branches
    for (const a of anchors) {
      this.webFilaments.push({
        x1: a.x,
        y1: a.y,
        x2: a.x,
        y2: a.y,
        targetX: faceCenter.x + (Math.random() - 0.5) * (w * 0.4),
        targetY: faceCenter.y + (Math.random() - 0.5) * (h * 0.3),
        progress: 0,
        speed: Math.random() * 0.08 + 0.04,
        color: Math.random() > 0.4 ? 'rgba(255, 0, 75, 0.7)' : 'rgba(0, 245, 255, 0.75)',
        width: Math.random() * 1.5 + 0.8
      });
    }
  }

  emitWebEmbers(x, y, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.webEmbers.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.02,
        color: Math.random() > 0.5 ? '#ff0055' : '#00f5ff',
        radius: Math.random() * 1.5 + 0.8
      });
    }
  }

  clearWebs() {
    this.webFilaments = [];
  }

  animate() {
    // Smooth 3D tilt interpolation
    this.currentRotateX += (this.targetRotateX - this.currentRotateX) * 0.1;
    this.currentRotateY += (this.targetRotateY - this.currentRotateY) * 0.1;

    // Apply transform to the card
    this.card.style.transform = `perspective(1000px) rotateX(${this.currentRotateX.toFixed(2)}deg) rotateY(${this.currentRotateY.toFixed(2)}deg) scale3d(${this.isHovered ? 1.03 : 1}, ${this.isHovered ? 1.03 : 1}, 1)`;

    // Draw Web Canvas overlay
    if (this.ctx && this.webCanvas) {
      this.ctx.clearRect(0, 0, this.webCanvas.width, this.webCanvas.height);

      // 1. Draw web filaments shooting into frame
      for (const web of this.webFilaments) {
        if (web.progress < 1) {
          web.progress = Math.min(1, web.progress + web.speed);
        }
        const curX = web.x1 + (web.targetX - web.x1) * web.progress;
        const curY = web.y1 + (web.targetY - web.y1) * web.progress;

        this.ctx.strokeStyle = web.color;
        this.ctx.lineWidth = web.width;
        this.ctx.shadowColor = web.color;
        this.ctx.shadowBlur = 6;
        this.ctx.beginPath();
        this.ctx.moveTo(web.x1, web.y1);
        this.ctx.lineTo(curX, curY);
        this.ctx.stroke();
      }

      // 2. Draw Embers
      for (let i = this.webEmbers.length - 1; i >= 0; i--) {
        const ember = this.webEmbers[i];
        ember.x += ember.vx;
        ember.y += ember.vy;
        ember.alpha -= ember.decay;

        this.ctx.fillStyle = ember.color;
        this.ctx.globalAlpha = Math.max(0, ember.alpha);
        this.ctx.beginPath();
        this.ctx.arc(ember.x, ember.y, ember.radius, 0, Math.PI * 2);
        this.ctx.fill();

        if (ember.alpha <= 0) {
          this.webEmbers.splice(i, 1);
        }
      }
      this.ctx.globalAlpha = 1.0;
    }

    requestAnimationFrame(() => this.animate());
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.SpiderPhotoInstance = new SpiderPhotoEffect('.hero-photo-card');
});
