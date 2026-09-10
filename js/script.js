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
  const heroNameVideo = document.getElementById('heroNameVideo');

  [heroVideo, heroNameVideo].forEach(vid => {
    if (vid && vid.tagName === 'VIDEO') {
      vid.play().catch(() => {});
    }
  });

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
  // 2. COPY EMAIL TO CLIPBOARD WITH FEEDBACK
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


  // =========================================================================
  // 6. PORTFOLIO VIDEO MODAL LIGHTBOX CONTROLLER
  // =========================================================================
  let videoModal = document.getElementById('portfolioVideoModal');
  
  // Create modal element if not present in DOM
  if (!videoModal && document.querySelector('.project-video-trigger')) {
    videoModal = document.createElement('div');
    videoModal.id = 'portfolioVideoModal';
    videoModal.className = 'video-modal-backdrop';
    videoModal.innerHTML = `
      <div class="video-modal-container" role="dialog" aria-modal="true">
        <div class="video-modal-header">
          <div class="video-modal-title-wrap">
            <span class="video-modal-category" id="videoModalCategory">PROJECT VIDEO</span>
            <h3 class="video-modal-title" id="videoModalTitle">Video Title</h3>
          </div>
          <button class="video-modal-close-btn" id="videoModalCloseBtn" aria-label="Close Video">×</button>
        </div>
        <div class="video-modal-video-wrap">
          <video id="videoModalPlayer" controls controlslist="nodownload noplaybackrate" disablepictureinpicture playsinline preload="metadata" oncontextmenu="return false;">
            <source src="" type="video/mp4">
            Your browser does not support HTML5 video.
          </video>
        </div>
      </div>
    `;
    document.body.appendChild(videoModal);
  }

  if (videoModal) {
    const player = document.getElementById('videoModalPlayer');
    const titleEl = document.getElementById('videoModalTitle');
    const catEl = document.getElementById('videoModalCategory');
    const closeBtn = document.getElementById('videoModalCloseBtn');

    function openVideoModal(videoSrc, title, category) {
      if (!player) return;
      if (titleEl) titleEl.textContent = title || 'PROJECT PREVIEW';
      if (catEl) catEl.textContent = category || 'VIDEO';

      player.src = videoSrc;
      videoModal.classList.add('is-active');
      document.body.style.overflow = 'hidden';

      player.play().catch(() => {});
    }

    function closeVideoModal() {
      if (!player) return;
      videoModal.classList.remove('is-active');
      player.pause();
      player.currentTime = 0;
      player.src = '';
      document.body.style.overflow = '';
    }

    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('.project-video-trigger');
      if (trigger) {
        e.preventDefault();
        const videoSrc = trigger.getAttribute('data-video-src');
        const title = trigger.getAttribute('data-title');
        const cat = trigger.getAttribute('data-category');
        if (videoSrc) {
          openVideoModal(videoSrc, title, cat);
        }
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeVideoModal);
    }

    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) {
        closeVideoModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && videoModal.classList.contains('is-active')) {
        closeVideoModal();
      }
    });

    // Disable right-click context menu on all video elements to prevent "Save video as..."
    document.addEventListener('contextmenu', (e) => {
      if (e.target && (e.target.tagName === 'VIDEO' || e.target.closest('video') || e.target.closest('.video-modal-video-wrap'))) {
        e.preventDefault();
      }
    });
  }

  // =========================================================================
  // 7. VIDEO CARD HOVER PREVIEWS
  // =========================================================================
  const videoCards = document.querySelectorAll('.project-grid-card');
  videoCards.forEach(card => {
    const video = card.querySelector('video.project-card-video');
    if (video) {
      let playPromise = null;
      card.addEventListener('mouseenter', () => {
        playPromise = video.play();
      });
      card.addEventListener('mouseleave', () => {
        if (playPromise !== null) {
          playPromise.then(() => {
            video.pause();
            video.currentTime = 0;
          }).catch(() => {});
        } else {
          video.pause();
          video.currentTime = 0;
        }
      });
    }
  });

});

