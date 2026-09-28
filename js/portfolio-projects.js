/**
 * TAQI HAIDER PORTFOLIO — DYNAMIC FIRESTORE PROJECTS INTEGRATION
 * - Syncs real-time documents from Firestore collection "projects"
 * - Prepends newly published work dynamically to the corresponding category page
 * - Never overrides or replaces existing curated project cards
 * - Zero empty states or admin upload banners shown to public visitors
 */

import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  onSnapshot 
} from "firebase/firestore";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJ1j32rlyrcpPfvx8jSFhDf-6J_hWRGsY",
  authDomain: "portfolio-63983.firebaseapp.com",
  projectId: "portfolio-63983",
  storageBucket: "portfolio-63983.firebasestorage.app",
  messagingSenderId: "1060924242634",
  appId: "1:1060924242634:web:260479fb57f64a79ec5233",
  measurementId: "G-JNQJ3CCL0Q"
};

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test project IDs and titles to permanently exclude from portfolio display
const TEST_PROJECT_IDS = new Set([
  'IqYwWvwLots1pNkmeSB0', // sdas
  'LchYBpFDeKXpOZmvZaEg', // uga booga
  'tQgx9L172XzBEHFVjcta'  // Poster
]);

const TEST_TITLES = new Set([
  'uga booga',
  'sdas',
  'poster'
]);

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Category Normalization & Matching
function matchesCategory(projectCategory, sectionCategory) {
  if (!projectCategory || !sectionCategory) return false;
  const p = projectCategory.toLowerCase().trim();
  const s = sectionCategory.toLowerCase().trim();

  if (s.includes('graphic') || s.includes('brand') || s.includes('design')) {
    return p.includes('graphic') || p.includes('brand') || p.includes('design') || p.includes('identity') || p.includes('logo') || p.includes('poster');
  }
  if (s.includes('animat') || s.includes('motion')) {
    return p.includes('animat') || p.includes('motion') || p.includes('explainer') || p.includes('rig') || p.includes('2d');
  }
  if (s.includes('video') || s.includes('edit')) {
    return p.includes('video') || p.includes('edit') || p.includes('cut') || p.includes('reel') || p.includes('film');
  }
  return p.includes(s) || s.includes(p);
}

// Build Card HTML for an Image Project
function buildImageCardHtml(project) {
  const title = escapeHtml(project.title || 'Untitled Project');
  const category = escapeHtml(project.categoryTag || project.category || 'Visual Design');
  const description = escapeHtml(project.description || project.subtitle || '');
  const thumbUrl = escapeHtml(project.thumbnailUrl || project.mediaUrl || '');
  const fullUrl = escapeHtml(project.mediaUrl || '');
  const behanceUrl = project.url ? escapeHtml(project.url) : '';
  const tagsHtml = (project.tags || []).map(t => `<span class="card-tag">${escapeHtml(t)}</span>`).join('');

  const linkHref = behanceUrl || fullUrl || '#';
  const isExternal = Boolean(behanceUrl);
  const linkAttrs = isExternal 
    ? 'target="_blank" rel="noopener noreferrer"' 
    : `class="image-preview-trigger" data-img-src="${fullUrl}" data-title="${title}"`;
  const overlayText = isExternal ? 'VIEW ON BEHANCE ↗' : 'VIEW IMAGE ↗';

  return `
    <article class="project-grid-card">
      <a href="${linkHref}" ${linkAttrs} class="project-card-link-wrapper" aria-label="${title}">
        <div class="project-card-thumb-wrap">
          <img src="${thumbUrl}" alt="${title}" class="project-card-img" loading="lazy">
          <div class="project-card-overlay">
            <span class="overlay-action-btn">${overlayText}</span>
          </div>
        </div>
      </a>
      <div class="project-card-body">
        <div class="project-card-meta-top">
          <span class="project-card-category">${category}</span>
          <span class="dynamic-drop-badge">NEW</span>
        </div>
        <h2 class="project-card-title">
          <a href="${linkHref}" ${linkAttrs}>${title}</a>
        </h2>
        ${description ? `<p class="project-card-subtitle">${description}</p>` : ''}
        ${tagsHtml ? `<div class="project-card-tags">${tagsHtml}</div>` : ''}
        <div class="project-card-footer">
          ${isExternal 
            ? `<a href="${behanceUrl}" class="card-behance-btn" target="_blank" rel="noopener noreferrer">
                 <span>View on Behance</span>
                 <span class="arrow-up-right">↗</span>
               </a>`
            : `<button type="button" class="card-behance-btn image-preview-trigger" data-img-src="${fullUrl}" data-title="${title}">
                 <span>View Full Image</span>
                 <span class="arrow-up-right">↗</span>
               </button>`
          }
        </div>
      </div>
    </article>
  `;
}

// Build Card HTML for a Video Project
function buildVideoCardHtml(project) {
  const title = escapeHtml(project.title || 'Untitled Video');
  const category = escapeHtml(project.categoryTag || project.category || 'Animation');
  const description = escapeHtml(project.description || project.subtitle || '');
  const videoUrl = escapeHtml(project.mediaUrl || '');
  const posterUrl = escapeHtml(project.thumbnailUrl || '');
  const behanceUrl = project.url ? escapeHtml(project.url) : '';
  const tagsHtml = (project.tags || []).map(t => `<span class="card-tag">${escapeHtml(t)}</span>`).join('');

  return `
    <article class="project-grid-card">
      <a href="#" class="project-card-link-wrapper project-video-trigger" 
         data-video-src="${videoUrl}" 
         data-title="${title}" 
         data-category="${category}"
         aria-label="Play ${title} Video">
        <div class="project-card-thumb-wrap">
          <video class="project-card-video" src="${videoUrl}" poster="${posterUrl}" muted loop playsinline preload="metadata" controlslist="nodownload" disablepictureinpicture oncontextmenu="return false;"></video>
          <div class="project-card-overlay">
            <span class="play-btn-circle">▶</span>
            <span class="overlay-action-btn">WATCH VIDEO ▶</span>
          </div>
        </div>
      </a>
      <div class="project-card-body">
        <div class="project-card-meta-top">
          <span class="project-card-category">${category}</span>
          <span class="dynamic-drop-badge">NEW</span>
        </div>
        <h2 class="project-card-title">
          <a href="#" class="project-video-trigger" data-video-src="${videoUrl}" data-title="${title}" data-category="${category}">${title}</a>
        </h2>
        ${description ? `<p class="project-card-subtitle">${description}</p>` : ''}
        ${tagsHtml ? `<div class="project-card-tags">${tagsHtml}</div>` : ''}
        <div class="project-card-footer">
          <button type="button" class="card-play-btn project-video-trigger" data-video-src="${videoUrl}" data-title="${title}" data-category="${category}">
            <span>Play Video</span>
            <span>▶</span>
          </button>
          ${behanceUrl ? `
            <a href="${behanceUrl}" class="card-behance-btn" target="_blank" rel="noopener noreferrer" style="margin-left:0.5rem;">
              <span>Case Study</span>
              <span class="arrow-up-right">↗</span>
            </a>
          ` : ''}
        </div>
      </div>
    </article>
  `;
}

// Image Lightbox Modal Setup
function setupImageLightbox() {
  const imageModal = document.getElementById('portfolioImageModal');
  const imageModalImg = document.getElementById('imageLightboxImg');
  const imageModalCaption = document.getElementById('imageLightboxCaption');
  const imageModalClose = document.getElementById('imageLightboxClose');

  if (!imageModal) return;

  function openImageModal(imgSrc, title) {
    if (!imageModalImg) return;
    imageModalImg.src = imgSrc;
    imageModalImg.alt = title || 'Project Image';
    if (imageModalCaption) {
      imageModalCaption.textContent = title || '';
    }
    imageModal.classList.add('is-active');
    imageModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeImageModal() {
    imageModal.classList.remove('is-active');
    imageModal.setAttribute('aria-hidden', 'true');
    if (imageModalImg) imageModalImg.src = '';
    document.body.style.overflow = '';
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.image-preview-trigger');
    if (trigger) {
      e.preventDefault();
      const imgSrc = trigger.getAttribute('data-img-src');
      const title = trigger.getAttribute('data-title');
      if (imgSrc) {
        openImageModal(imgSrc, title);
      }
    }
  });

  if (imageModalClose) {
    imageModalClose.addEventListener('click', closeImageModal);
  }

  imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) {
      closeImageModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && imageModal.classList.contains('is-active')) {
      closeImageModal();
    }
  });
}

// Video Modal Player Setup
function setupVideoModal() {
  if (window.__taqiVideoModalReady) return;
  window.__taqiVideoModalReady = true;

  let videoModal = document.getElementById('portfolioVideoModal');

  if (!videoModal) {
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
            Your browser does not support HTML5 video.
          </video>
        </div>
      </div>
    `;
    document.body.appendChild(videoModal);
  }

  const player = document.getElementById('videoModalPlayer');
  const titleEl = document.getElementById('videoModalTitle');
  const catEl = document.getElementById('videoModalCategory');
  const closeBtn = document.getElementById('videoModalCloseBtn');

  if (player) {
    // Remove dummy source tags that conflict with direct src
    const dummySource = player.querySelector('source');
    if (dummySource) dummySource.remove();

    player.addEventListener('loadedmetadata', () => {
      player.removeAttribute('muted');
      player.muted = false;
      player.volume = 1.0;
    });

    player.addEventListener('loadeddata', () => {
      player.removeAttribute('muted');
      player.muted = false;
      player.volume = 1.0;
    });

    player.addEventListener('play', () => {
      player.removeAttribute('muted');
      player.muted = false;
      if (player.volume === 0) {
        player.volume = 1.0;
      }
    });
  }

  function openVideoModal(videoSrc, title, category) {
    if (!player) return;
    if (titleEl) titleEl.textContent = title || 'PROJECT PREVIEW';
    if (catEl) catEl.textContent = category || 'VIDEO';

    // Remove dummy source tags that conflict with direct src
    const dummySource = player.querySelector('source');
    if (dummySource) dummySource.remove();

    player.removeAttribute('muted');
    player.muted = false;
    player.defaultMuted = false;
    player.volume = 1.0;

    if (player.src !== videoSrc) {
      player.src = videoSrc;
    }

    videoModal.classList.add('is-active');
    document.body.style.overflow = 'hidden';

    // Ensure volume is always initialized at 100% full volume and unmuted
    player.removeAttribute('muted');
    player.muted = false;
    player.defaultMuted = false;
    player.volume = 1.0;

    const playPromise = player.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        player.removeAttribute('muted');
        player.muted = false;
        player.volume = 1.0;
      }).catch((err) => {
        console.warn('Video playback notice:', err);
        player.removeAttribute('muted');
        player.muted = false;
        player.volume = 1.0;
      });
    }
  }

  window.openPortfolioVideoModal = openVideoModal;

  function closeVideoModal() {
    if (!player) return;
    videoModal.classList.remove('is-active');
    player.pause();
    player.currentTime = 0;
    player.removeAttribute('src');
    player.load();
    player.volume = 1.0;
    player.muted = false;
    document.body.style.overflow = '';
  }

  // Delegated click listener for all video triggers (cards, links, play buttons)
  if (!window.__taqiVideoClickAttached) {
    window.__taqiVideoClickAttached = true;
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('.project-video-trigger');
      if (trigger) {
        e.preventDefault();
        e.stopPropagation();
        const videoSrc = trigger.getAttribute('data-video-src');
        const title = trigger.getAttribute('data-title');
        const cat = trigger.getAttribute('data-category');
        if (videoSrc) {
          if (window.openPortfolioVideoModal) {
            window.openPortfolioVideoModal(videoSrc, title, cat);
          } else {
            openVideoModal(videoSrc, title, cat);
          }
        }
      }
    });
  }

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

  // Prevent right-click save on video modal
  videoModal.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
}

// Category Page Dynamic Loader
function initCategoryLoader() {
  const dynamicContainer = document.getElementById('dynamicProjectsList');
  const showcaseGrid = document.querySelector('.project-showcase-grid[data-category]') || document.querySelector('.project-showcase-grid');
  if (!dynamicContainer || !showcaseGrid) return;

  const targetCategory = showcaseGrid.getAttribute('data-category') || '';
  if (!targetCategory) return;

  setupImageLightbox();
  setupVideoModal();

  const projectsCol = collection(db, "projects");

  onSnapshot(projectsCol, (snapshot) => {
    const docs = [];
    snapshot.forEach(doc => {
      docs.push({ id: doc.id, ...doc.data() });
    });

    // Sort by placement order (ascending 1, 2, 3...) first, then newest first for ties
    docs.sort((a, b) => {
      const getOrder = (item) => {
        if (typeof item.order === 'number' && !isNaN(item.order)) return item.order;
        const parsed = parseInt(item.order, 10);
        return !isNaN(parsed) ? parsed : 9999;
      };
      const orderA = getOrder(a);
      const orderB = getOrder(b);
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      const timeA = a.createdAt?.toMillis?.() || (a.publishedAt ? Date.parse(a.publishedAt) : 0) || 0;
      const timeB = b.createdAt?.toMillis?.() || (b.publishedAt ? Date.parse(b.publishedAt) : 0) || 0;
      return timeB - timeA;
    });

    // Filter strictly for this category, excluding deleted test projects and metadata docs
    const matchingDocs = docs.filter(p => {
      if (p.id === 'site_cv_metadata' || p.id === 'cv' || !p.title) return false;
      if (TEST_PROJECT_IDS.has(p.id)) return false;
      const titleClean = (p.title || '').trim().toLowerCase();
      if (TEST_TITLES.has(titleClean)) return false;
      return matchesCategory(p.category, targetCategory);
    });

    if (matchingDocs.length === 0) {
      dynamicContainer.innerHTML = '';
      return;
    }

    dynamicContainer.innerHTML = matchingDocs.map(p => {
      return p.mediaType === 'video' ? buildVideoCardHtml(p) : buildImageCardHtml(p);
    }).join('');

    // Attach video hover preview
    dynamicContainer.querySelectorAll('.project-grid-card').forEach(card => {
      const video = card.querySelector('video.project-card-video');
      if (video) {
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        let playPromise = null;
        card.addEventListener('mouseenter', () => {
          video.muted = true;
          playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
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
  }, (err) => {
    console.warn("Firestore category live sync notice:", err);
  });
}

// Auto-run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCategoryLoader);
} else {
  initCategoryLoader();
}
