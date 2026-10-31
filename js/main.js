/**
 * MAIN INTERACTION & NAVIGATION CONTROLLER
 * - Active Section Tracking & Ambient Atmosphere Modulation
 * - IntersectionObserver Scroll Reveal (Fade, Blur to Sharp, Slide Up)
 * - Mobile Navigation Drawer
 * - Sound FX Manager
 * - Contact Portal Direct WhatsApp & Transmission actions
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Navigation & Section Tracking
  const nav = document.getElementById('main-nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  const mobileToggle = document.getElementById('nav-mobile-toggle');
  const mobileMenu = document.getElementById('nav-mobile-menu');

  // Active section indicator pill
  const activePill = document.querySelector('.nav-active-pill');

  function updateActivePill(targetLink) {
    if (!activePill || !targetLink) return;
    const rect = targetLink.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    activePill.style.width = `${rect.width}px`;
    activePill.style.left = `${rect.left - navRect.left}px`;
    activePill.style.opacity = '1';
  }

  // Section Observer for atmosphere & nav highlights
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');

        // Update active nav link
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
            updateActivePill(link);
          } else {
            link.classList.remove('active');
          }
        });

        // Notify space canvas to adjust cosmic mood
        if (window.SpaceEngineInstance) {
          window.SpaceEngineInstance.setSection(id);
        }
      }
    });
  }, {
    rootMargin: '-20% 0px -40% 0px',
    threshold: 0.15
  });

  sections.forEach(sec => sectionObserver.observe(sec));

  // 2. Smooth Navigation click
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetSec = document.querySelector(targetId);
      if (targetSec) {
        targetSec.scrollIntoView({ behavior: 'smooth' });
      }
      if (mobileMenu && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
      }
    });
  });

  // Mobile Menu Toggle
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      mobileToggle.classList.toggle('is-active');
    });
  }

  // 3. Scroll Reveal Animations (Blur to sharp, slide up, glow)
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // 4. Interactive Interest Plates: mini particle burst on hover
  const interestCards = document.querySelectorAll('.interest-card');
  interestCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.classList.add('sparkle');
    });
    card.addEventListener('mouseleave', () => {
      card.classList.remove('sparkle');
    });
  });

  // 5. Contact Section Form & Direct WhatsApp
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('sender-name').value;
      const message = document.getElementById('sender-message').value;

      if (formStatus) {
        const success = document.createElement('div');
        const statusDot = document.createElement('span');
        const statusText = document.createElement('span');
        success.className = 'transmission-success';
        statusDot.className = 'status-dot';
        statusText.textContent = 'TRANSMISSION ENCRYPTED & SENT TO DEEP SPACE • STAND BY';
        success.append(statusDot, statusText);
        formStatus.replaceChildren(success);
        formStatus.classList.add('active');
      }

      // If user configured a WhatsApp number, offer one-click WhatsApp redirect
      const waNumber = contactForm.getAttribute('data-whatsapp') || "";
      if (/^\d{8,15}$/.test(waNumber)) {
        const text = encodeURIComponent(`Hi, I'm ${name} from your portfolio: ${message}`);
        window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank', 'noopener,noreferrer');
      }

      contactForm.reset();
      setTimeout(() => {
        if (formStatus) formStatus.classList.remove('active');
      }, 5000);
    });
  }

  // Copy Email button with notification
  const copyEmailBtn = document.getElementById('copy-email-btn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
      const email = copyEmailBtn.getAttribute('data-email') || "contact@yourdomain.com";
      navigator.clipboard.writeText(email).then(() => {
        const originalText = copyEmailBtn.innerText;
        copyEmailBtn.innerText = "COPIED TO QUANTUM CLIPBOARD ✓";
        copyEmailBtn.classList.add('copied');
        setTimeout(() => {
          copyEmailBtn.innerText = originalText;
          copyEmailBtn.classList.remove('copied');
        }, 2500);
      });
    });
  }

  // 6. Ambient Sound Toggle in Navbar
  const soundToggle = document.getElementById('ambient-sound-toggle');
  let ambientAudioCtx = null;
  let ambientDroneOsc = null;
  let isSoundActive = false;

  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      if (!isSoundActive) {
        startAmbientAtmosphere();
        soundToggle.classList.add('sound-on');
        soundToggle.setAttribute('title', 'Mute Cosmic Ambient Sound');
      } else {
        stopAmbientAtmosphere();
        soundToggle.classList.remove('sound-on');
        soundToggle.setAttribute('title', 'Enable Cosmic Ambient Sound');
      }
      isSoundActive = !isSoundActive;
    });
  }

  function startAmbientAtmosphere() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      ambientAudioCtx = new AudioCtx();

      // Deep space atmospheric hum
      ambientDroneOsc = ambientAudioCtx.createOscillator();
      const filter = ambientAudioCtx.createBiquadFilter();
      const gain = ambientAudioCtx.createGain();

      ambientDroneOsc.type = 'sine';
      ambientDroneOsc.frequency.setValueAtTime(55, ambientAudioCtx.currentTime); // 55Hz low A

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, ambientAudioCtx.currentTime);

      gain.gain.setValueAtTime(0.04, ambientAudioCtx.currentTime);

      ambientDroneOsc.connect(filter);
      filter.connect(gain);
      gain.connect(ambientAudioCtx.destination);

      ambientDroneOsc.start();
    } catch (e) {
      console.log('Ambient sound not allowed without user interaction');
    }
  }

  function stopAmbientAtmosphere() {
    if (ambientDroneOsc) {
      try {
        ambientDroneOsc.stop();
        ambientDroneOsc.disconnect();
      } catch (e) {}
      ambientDroneOsc = null;
    }
    if (ambientAudioCtx) {
      ambientAudioCtx.close();
      ambientAudioCtx = null;
    }
  }
});
