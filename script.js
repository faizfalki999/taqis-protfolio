/**
 * TAQI HAIDER — PORTFOLIO INTERACTIONS & SCRIPTS
 * Features:
 * - Interactive mouse-following eyes for Hero Character Slot
 * - Periodic natural character idle blink cycle
 * - Turntable / 3-angle character model selector in About section
 * - Interactive email copy with tooltip feedback
 * - Dismissible floating hire toast notification
 * - Seamless scroll-triggered section transitions
 */

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // 1. HERO CHARACTER INTERACTION (Mouse / Coordinate Tracking Eyes)
  // =========================================================================
  const heroCharacter = document.getElementById('heroCharacterSlot');
  const pupilLeft = document.getElementById('heroPupilLeft');
  const pupilRight = document.getElementById('heroPupilRight');
  const characterWrapper = document.getElementById('heroCharacterWrapper');
  const heroVideo = document.getElementById('heroCharacterImg');

  if (heroVideo && heroVideo.tagName === 'VIDEO') {
    heroVideo.play().catch(() => {
      // Autoplay with muted is allowed in all modern browsers
    });
  }

  if (heroCharacter && characterWrapper) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    // Listen to global mouse movement
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      updateEyes();
    });

    // Touch device support (touchmove)
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
        updateEyes();
      }
    }, { passive: true });

    function updateEyes() {
      const rect = heroCharacter.getBoundingClientRect();
      const characterCenterX = rect.left + rect.width / 2;
      const characterCenterY = rect.top + rect.height / 2;

      // Distance and angle calculation from character center
      const deltaX = mouseX - characterCenterX;
      const deltaY = mouseY - characterCenterY;

      // Max eye travel distance in SVG coordinate units if SVG pupils exist
      if (pupilLeft && pupilRight) {
        const maxDistanceX = 6.0;
        const maxDistanceY = 3.5;
        const angle = Math.atan2(deltaY, deltaX);
        const rawDistance = Math.hypot(deltaX, deltaY);
        const clampedDistance = Math.min(rawDistance / 35, 1);
        const eyeX = Math.cos(angle) * (clampedDistance * maxDistanceX);
        const eyeY = Math.sin(angle) * (clampedDistance * maxDistanceY);

        pupilLeft.style.transform = `translate(${eyeX}px, ${eyeY}px)`;
        pupilRight.style.transform = `translate(${eyeX}px, ${eyeY}px)`;
      }

      // Subtle 3D character tilt tracking the mouse
      const headTiltX = (deltaX / window.innerWidth) * 12; // degrees
      const headTiltY = -(deltaY / window.innerHeight) * 10;

      characterWrapper.style.transform = `perspective(600px) rotateY(${headTiltX}deg) rotateX(${headTiltY}deg) scale(1.02)`;
    }

    // Periodic Character Natural Idle Blink
    setInterval(() => {
      if (!pupilLeft || !pupilRight) return;
      
      pupilLeft.style.opacity = '0';
      pupilRight.style.opacity = '0';
      
      setTimeout(() => {
        pupilLeft.style.opacity = '1';
        pupilRight.style.opacity = '1';
      }, 150);
    }, 4500);
  }


  // =========================================================================
  // 2. 3D ROTATING CHARACTER MODEL (Smooth 60FPS Ambient 360° Turntable)
  // =========================================================================
  
  /**
   * Continuous 3D Volumetric Turntable Engine
   * - 60 FPS requestAnimationFrame continuous rotation
   * - 3D Perspective foreshortening with cosine lighting & opacity modulation
   * - Rotating studio turntable plinth
   * - IntersectionObserver viewport play/pause for 0% idle CPU overhead
   * - Fully autonomous ambient animation (no manual drag/interaction)
   */
  class CharacterTurntable3D {
    constructor() {
      this.display = document.getElementById('turntableDisplay');
      this.rig = document.getElementById('turntableRig');
      this.label = document.getElementById('turntableAngleLabel');
      this.card = this.display ? this.display.closest('.character-viewer-card') || this.display : null;

      this.planes = [
        { el: document.getElementById('planeFront'), baseAngle: 0, name: 'FRONT' },
        { el: document.getElementById('planeSideR'), baseAngle: 90, name: 'SIDE R' },
        { el: document.getElementById('planeBack'), baseAngle: 180, name: 'BACK' },
        { el: document.getElementById('planeSideL'), baseAngle: 270, name: 'SIDE L' }
      ];

      this.angle = 0;
      this.rotationSpeed = 0.5; // degrees per frame (~12s per full 360° revolution)
      this.animationFrameId = null;
      this.isVisible = false;
      this.lastFrameTime = performance.now();

      if (this.rig) {
        this.init();
      }
    }

    init() {
      // Setup Visibility Observer to only animate when in viewport
      this.setupVisibilityObserver();

      // Initial frame render
      this.renderFrame(0);
    }

    startAnimation() {
      if (this.animationFrameId) return;
      this.lastFrameTime = performance.now();

      const animate = (currentTime) => {
        if (!this.isVisible) {
          this.animationFrameId = null;
          return;
        }

        const delta = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = currentTime;

        // Smooth time-based rotation (~30 degrees per second)
        this.angle = (this.angle + 28 * delta) % 360;
        this.renderFrame(this.angle);

        this.animationFrameId = requestAnimationFrame(animate);
      };

      this.animationFrameId = requestAnimationFrame(animate);
    }

    stopAnimation() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }

    renderFrame(currentAngle) {
      // 1. Rotate the 3D rig in space
      this.rig.style.transform = `rotateY(${currentAngle.toFixed(2)}deg)`;

      // 2. Smoothly calculate view visibility & lighting for each cardinal plane
      const rad = Math.PI / 180;
      let primaryView = 'FRONT';
      let maxFacing = -1;

      this.planes.forEach(plane => {
        if (!plane.el) return;

        // Angle of plane relative to camera view
        const planeAngle = (currentAngle + plane.baseAngle) % 360;
        const facing = Math.cos(planeAngle * rad); // 1 = facing camera directly, 0 = edge-on, -1 = facing away

        if (facing > 0.001) {
          // Visible front-facing hemisphere
          // Smooth cosine curve for natural cross-blending without popping
          const opacity = Math.min(Math.max(Math.pow(facing, 0.75), 0), 1);
          const brightness = 0.88 + 0.16 * facing;
          
          plane.el.style.opacity = opacity.toFixed(3);
          plane.el.style.filter = `brightness(${brightness.toFixed(3)})`;
          plane.el.style.visibility = 'visible';

          if (facing > maxFacing) {
            maxFacing = facing;
            primaryView = plane.name;
          }
        } else {
          // Hidden back-facing hemisphere (prevents reverse overlap & z-fighting)
          plane.el.style.opacity = '0';
          plane.el.style.visibility = 'hidden';
        }
      });

      // 3. Live-update angle readout
      if (this.label) {
        const roundedDeg = Math.floor(currentAngle);
        this.label.textContent = `3D MODEL: ${primaryView} (${roundedDeg}°)`;
      }
    }

    setupVisibilityObserver() {
      if (!('IntersectionObserver' in window)) {
        this.isVisible = true;
        this.startAnimation();
        return;
      }

      const target = this.card || this.display;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.isVisible = true;
            this.startAnimation();
          } else {
            this.isVisible = false;
            this.stopAnimation();
          }
        });
      }, {
        threshold: 0.1
      });

      observer.observe(target);
    }
  }

  // Initialize 3D Turntable
  const characterTurntable3D = new CharacterTurntable3D();


  // =========================================================================
  // 3. COPY EMAIL TO CLIPBOARD WITH FEEDBACK
  // =========================================================================
  const copyEmailBtn = document.getElementById('copyEmailBtn');
  const copyTooltip = document.getElementById('copyTooltip');

  if (copyEmailBtn && copyTooltip) {
    copyEmailBtn.addEventListener('click', (e) => {
      const email = 'mtaqi5771@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        const originalText = copyTooltip.textContent;
        copyTooltip.textContent = 'COPIED!';
        copyTooltip.style.backgroundColor = 'var(--accent-red)';
        copyTooltip.style.color = '#ffffff';

        setTimeout(() => {
          copyTooltip.textContent = originalText;
          copyTooltip.style.backgroundColor = '';
          copyTooltip.style.color = '';
        }, 2200);
      }).catch(err => {
        console.error('Clipboard copy failed:', err);
      });
    });
  }


  // =========================================================================
  // 4. FLOATING HIRE TOAST NOTIFICATION DISMISS
  // =========================================================================
  const toastCloseBtn = document.getElementById('toastCloseBtn');
  const hireToast = document.getElementById('hireToast');

  if (toastCloseBtn && hireToast) {
    toastCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hireToast.style.transform = 'translateY(20px) scale(0.9)';
      hireToast.style.opacity = '0';
      hireToast.style.pointerEvents = 'none';
      setTimeout(() => {
        hireToast.style.display = 'none';
      }, 300);
    });
  }


  // =========================================================================
  // 5. SCROLL-TRIGGERED FADE / SLIDE-IN REVEALS
  // =========================================================================
  const animatedElements = document.querySelectorAll('.about-col, .polaroid-card, .contact-col');
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = entry.target.dataset.originalTransform || '';
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    animatedElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      observer.observe(el);
    });
  }

});
