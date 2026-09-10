/**
 * TAQI HAIDER PORTFOLIO — DYNAMIC FIRESTORE PROJECTS SHOWCASE
 * - Fetches real-time documents from Firestore collection "projects"
 * - Renders rich editorial streetwear project cards
 * - Real-time onSnapshot listener for instantaneous updates
 * - Dynamic category filtering with counts
 * - Supports video cards (with auto-preview & video modal) & image cards (with lightbox)
 * - LocalStorage caching for instant rendering
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, 
  collection, 
  getDocs,
  onSnapshot 
} from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDJ1j32rlyrcpPfvx8jSFhDf-6J_hWRGsY",
  authDomain: "portfolio-63983.firebaseapp.com",
  projectId: "portfolio-63983",
  storageBucket: "portfolio-63983.firebasestorage.app",
  messagingSenderId: "1060924242634",
  appId: "1:1060924242634:web:260479fb57f64a79ec5233",
  measurementId: "G-JNQJ3CCL0Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.warn("Analytics notice:", e.message);
}

// Initialize Firestore
const db = getFirestore(app);

// DOM Elements
const projectsGrid = document.getElementById('projectsShowcaseGrid');
const filterBar = document.getElementById('projectsFilterBar');
const imageModal = document.getElementById('portfolioImageModal');
const imageModalImg = document.getElementById('imageLightboxImg');
const imageModalCaption = document.getElementById('imageLightboxCaption');
const imageModalClose = document.getElementById('imageLightboxClose');

// State
let allProjects = [];
let activeCategory = 'ALL';
let isLoadingFirestore = true;

// Helper: Escape HTML to avoid injection
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper: Format Date
function formatProjectDate(timestamp, isoString) {
  try {
    if (timestamp && typeof timestamp.toDate === 'function') {
      const date = timestamp.toDate();
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
    }
    if (isoString) {
      const date = new Date(isoString);
      if (!isNaN(date)) {
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
      }
    }
  } catch (e) {}
  return 'SELECTED WORK';
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

// Build Card HTML for an Image Project (Matching site's exact card HTML structure)
function buildImageCardHtml(project) {
  const title = escapeHtml(project.title || 'Untitled Project');
  const category = escapeHtml(project.category || 'Visual Design');
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
    <article class="project-grid-card" data-category="${escapeHtml(normalizeCategory(project.category))}">
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

// Build Card HTML for a Video Project (Matching site's exact card HTML structure)
function buildVideoCardHtml(project) {
  const title = escapeHtml(project.title || 'Untitled Video');
  const category = escapeHtml(project.category || 'Animation');
  const description = escapeHtml(project.description || project.subtitle || '');
  const videoUrl = escapeHtml(project.mediaUrl || '');
  const posterUrl = escapeHtml(project.thumbnailUrl || '');
  const behanceUrl = project.url ? escapeHtml(project.url) : '';
  const tagsHtml = (project.tags || []).map(t => `<span class="card-tag">${escapeHtml(t)}</span>`).join('');

  return `
    <article class="project-grid-card" data-category="${escapeHtml(normalizeCategory(project.category))}">
      <a href="#" class="project-card-link-wrapper project-video-trigger" 
         data-video-src="${videoUrl}" 
         data-title="${title}" 
         data-category="${category}"
         aria-label="Play ${title} Video">
        <div class="project-card-thumb-wrap">
          <video class="project-card-video" src="${videoUrl}" poster="${posterUrl}" muted loop playsinline preload="metadata"></video>
          <div class="project-card-overlay">
            <span class="play-btn-circle">▶</span>
            <span class="overlay-action-btn">WATCH VIDEO ▶</span>
          </div>
        </div>
      </a>
      <div class="project-card-body">
        <div class="project-card-meta-top">
          <span class="project-card-category">${category}</span>
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

// Render projects strictly into each matching section
function renderProjects() {
  // 1. Filter projects strictly by section category
  const graphicProjects = allProjects.filter(p => matchesCategory(p.category, 'GRAPHIC DESIGN'));
  const animationProjects = allProjects.filter(p => matchesCategory(p.category, 'ANIMATION'));
  const videoProjects = allProjects.filter(p => matchesCategory(p.category, 'VIDEO EDITING'));

  // 2. Update category counts in filter pills
  const countAll = document.getElementById('countAll');
  const countGraphic = document.getElementById('countGraphicDesign');
  const countAnimation = document.getElementById('countAnimation');
  const countVideo = document.getElementById('countVideoEditing');

  if (countAll) countAll.textContent = `(${allProjects.length})`;
  if (countGraphic) countGraphic.textContent = `(${graphicProjects.length})`;
  if (countAnimation) countAnimation.textContent = `(${animationProjects.length})`;
  if (countVideo) countVideo.textContent = `(${videoProjects.length})`;

  // 3. Render helper for each section grid
  function renderGrid(gridId, sectionProjects, sectionName, categoryUrl) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    // While Firestore data is loading, show loading spinner & skeleton placeholders
    if (isLoadingFirestore) {
      grid.innerHTML = `
        <div class="section-skeleton-loader" aria-hidden="true">
          <div class="skeleton-pulse-banner">
            <div class="section-loading-spinner" style="width:14px;height:14px;border-width:2px;"></div>
            <span class="pulse-text">LOADING ${escapeHtml(sectionName)} ARCHIVE...</span>
          </div>
        </div>
        <div class="project-card-skeleton" aria-hidden="true"><div class="skeleton-thumb"></div><div class="skeleton-body"><div class="skeleton-line short"></div><div class="skeleton-line title"></div><div class="skeleton-line desc"></div><div class="skeleton-line desc-short"></div></div></div>
        <div class="project-card-skeleton" aria-hidden="true"><div class="skeleton-thumb"></div><div class="skeleton-body"><div class="skeleton-line short"></div><div class="skeleton-line title"></div><div class="skeleton-line desc"></div><div class="skeleton-line desc-short"></div></div></div>
        <div class="project-card-skeleton" aria-hidden="true"><div class="skeleton-thumb"></div><div class="skeleton-body"><div class="skeleton-line short"></div><div class="skeleton-line title"></div><div class="skeleton-line desc"></div><div class="skeleton-line desc-short"></div></div></div>
      `;
      return;
    }

    if (sectionProjects.length === 0) {
      grid.innerHTML = `
        <div class="projects-empty-state">
          <div class="empty-state-icon">✦</div>
          <h3 class="empty-state-title">NO ${escapeHtml(sectionName)} PROJECTS YET</h3>
          <p class="empty-state-text">
            New projects uploaded in "${escapeHtml(sectionName)}" from the admin portal will appear here in real-time.
          </p>
          <a href="admin.html" class="empty-state-btn">
            <span>UPLOAD VIA ADMIN</span>
            <span>→</span>
          </a>
        </div>
      `;
      return;
    }

    grid.innerHTML = sectionProjects.map(project => {
      return project.mediaType === 'video'
        ? buildVideoCardHtml(project)
        : buildImageCardHtml(project);
    }).join('');
  }

  // 4. Render each section strictly with its own projects
  renderGrid('gridGraphicDesign', graphicProjects, 'GRAPHIC DESIGN', 'graphic-design.html');
  renderGrid('gridAnimation', animationProjects, 'ANIMATION', 'animation.html');
  renderGrid('gridVideoEditing', videoProjects, 'VIDEO EDITING', 'video-editing.html');

  // Also support single-category pages if present (e.g., graphic-design.html, animation.html, video-editing.html)
  document.querySelectorAll('.project-showcase-grid[data-category]').forEach(grid => {
    if (grid.id !== 'gridGraphicDesign' && grid.id !== 'gridAnimation' && grid.id !== 'gridVideoEditing') {
      const cat = grid.getAttribute('data-category');
      const matching = allProjects.filter(p => matchesCategory(p.category, cat));
      renderGrid(grid.id, matching, cat);
    }
  });

  // 5. Attach video card hover auto-play
  document.querySelectorAll('.project-grid-card').forEach(card => {
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
}

// Setup Section Filter Tabs
function setupFilterTabs() {
  const filterButtons = document.querySelectorAll('#projectsFilterBar .filter-pill');
  const graphicSec = document.getElementById('graphicDesignSection');
  const animSec = document.getElementById('animationSection');
  const videoSec = document.getElementById('videoEditingSection');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');

      // Update active button state
      filterButtons.forEach(b => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
      });

      // Show only matching section, or show all
      if (filter === 'ALL') {
        if (graphicSec) graphicSec.style.display = '';
        if (animSec) animSec.style.display = '';
        if (videoSec) videoSec.style.display = '';
      } else if (filter === 'GRAPHIC DESIGN') {
        if (graphicSec) { graphicSec.style.display = ''; graphicSec.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        if (animSec) animSec.style.display = 'none';
        if (videoSec) videoSec.style.display = 'none';
      } else if (filter === 'ANIMATION') {
        if (graphicSec) graphicSec.style.display = 'none';
        if (animSec) { animSec.style.display = ''; animSec.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        if (videoSec) videoSec.style.display = 'none';
      } else if (filter === 'VIDEO EDITING') {
        if (graphicSec) graphicSec.style.display = 'none';
        if (animSec) animSec.style.display = 'none';
        if (videoSec) { videoSec.style.display = ''; videoSec.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      }
    });
  });
}

// Lightbox Modal Setup for Image Projects
function setupImageLightbox() {
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

  // Delegated click for image preview triggers
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

// Initialize and Fetch from Firestore
function initFirestoreProjects() {
  setupImageLightbox();
  setupFilterTabs();

  // Show loading spinner & skeleton placeholders while waiting for Firestore
  isLoadingFirestore = true;
  renderProjects();

  // Real-time Firestore query on collection "projects"
  const projectsCol = collection(db, "projects");

  onSnapshot(projectsCol, (snapshot) => {
    const loadedProjects = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      loadedProjects.push({
        id: doc.id,
        ...data
      });
    });

    // Client-side sort by newest first
    loadedProjects.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || (a.publishedAt ? Date.parse(a.publishedAt) : 0) || 0;
      const timeB = b.createdAt?.toMillis?.() || (b.publishedAt ? Date.parse(b.publishedAt) : 0) || 0;
      return timeB - timeA;
    });

    allProjects = loadedProjects;
    isLoadingFirestore = false;

    // Cache to localStorage
    try {
      localStorage.setItem('taqi_portfolio_cache', JSON.stringify(loadedProjects));
    } catch (e) {}

    renderProjects();
  }, (error) => {
    console.error('Firestore onSnapshot error:', error);
    isLoadingFirestore = false;
    renderProjects();
  });
}

// Auto-run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFirestoreProjects);
} else {
  initFirestoreProjects();
}
