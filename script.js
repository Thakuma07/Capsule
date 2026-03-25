/* ═══════════════════════════════════════════════════
   DIGITAL TIME CAPSULE — Main Script
   ═══════════════════════════════════════════════════ */

// ─── Config ───
let TARGET_DATE = new Date('2026-05-15T23:55:00Z');
const CREATION_DATE = new Date('2026-03-24T00:00:00');
const API_ENDPOINT = '/api/unlock';
let isCheatMode = false;

// ─── DOM Refs ───
const $ = (sel) => document.querySelector(sel);
const countdownSection = $('#countdown-section');
const vaultSection = $('#vault-section');
const daysEl = $('#days');
const hoursEl = $('#hours');
const minutesEl = $('#minutes');
const secondsEl = $('#seconds');
const progressFill = $('#progress-fill');
const progressText = $('#progress-text');
const currentTimeEl = $('#current-time');
const vaultGrid = $('#vault-grid');
const vaultMessage = $('#vault-message');
const unlockTimeEl = $('#unlock-time');
const previewGrid = $('#preview-grid');
const bootSequence = $('#boot-sequence');
const bootText = $('#boot-text');
const audioToggle = $('#audio-toggle');
const iconOn = $('.audio-icon--on');
const iconOff = $('.audio-icon--off');
const ambientSound = $('#ambient-sound');
const unlockSound = $('#unlock-sound');
const mouseGlow = $('#mouse-glow');
const themeToggle = $('#theme-toggle');
const sunIcon = $('.theme-icon--sun');
const moonIcon = $('.theme-icon--moon');

// Modal Refs
const mediaModal = $('#media-modal');
const modalBody = $('#modal-body');
const modalClose = $('.modal__close');
const modalOverlay = $('.modal__overlay');

// ─── Mouse Glow Effect ───
document.addEventListener('mousemove', (e) => {
  if (mouseGlow) {
    mouseGlow.style.opacity = '1';
    mouseGlow.style.setProperty('--mouse-x', `${e.clientX}px`);
    mouseGlow.style.setProperty('--mouse-y', `${e.clientY}px`);
  }
});

// ─── Preview Teaser Config ───
const PREVIEW_CONFIG = {
  visibleImage: { url: '', title: 'TEASER_01', tag: 'PREVIEW' },
  visibleVideo: { url: '', poster: '', title: 'CLIP_01', tag: 'TRAILER' },
  lockedCount: 4,
};

const LOCK_SVG = `<svg class="lock-overlay__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-dim);">
  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
</svg>`;

// ─── State ───
let timerInterval = null;
let isUnlocked = false;
let isMuted = true;

// ─── Audio Setup ───
if (ambientSound) ambientSound.volume = 0.3;
if (unlockSound) unlockSound.volume = 0.8;

if (audioToggle && iconOn && iconOff) {
  iconOn.style.display = isMuted ? 'none' : 'block';
  iconOff.style.display = isMuted ? 'block' : 'none';

  audioToggle.addEventListener('click', () => {
    isMuted = !isMuted;
    iconOn.style.display = isMuted ? 'none' : 'block';
    iconOff.style.display = isMuted ? 'block' : 'none';
    if (isMuted) {
      if (ambientSound) ambientSound.pause();
    } else {
      if (ambientSound) ambientSound.play().catch(err => console.log('Audio error:', err));
    }
  });
}

// ─── Theme Toggle Logic (Resets to Light on Reload) ───
if (themeToggle && sunIcon && moonIcon) {
  // Always start as light mode on load
  const currentTheme = 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcons(currentTheme);

  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    // Removed persistence so it resets on reload
    updateThemeIcons(newTheme);
  });
}

function updateThemeIcons(theme) {
  if (theme === 'light') {
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  } else {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  }
}

// ═══════════════════════════════════════════════════
// LIGHTBOX / MODAL LOGIC
// ═══════════════════════════════════════════════════
function openModal(type, url, title) {
  if (!mediaModal || !modalBody) return;
  
  modalBody.innerHTML = '';
  
  if (type === 'image') {
    const img = document.createElement('img');
    img.src = url;
    img.alt = title;
    modalBody.appendChild(img);
  } else if (type === 'video') {
    const vid = document.createElement('video');
    vid.src = url;
    vid.controls = true;
    vid.autoplay = false; // Manual play per user request
    vid.playsinline = true;
    modalBody.appendChild(vid);
  }
  
  mediaModal.classList.add('modal--active');
  mediaModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden'; // Prevent scrolling background
}

function closeModal() {
  if (!mediaModal) return;
  
  // Stop any playing video
  const video = modalBody.querySelector('video');
  if (video) video.pause();
  
  mediaModal.classList.remove('modal--active');
  mediaModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  
  // Clear content after transition
  setTimeout(() => {
    modalBody.innerHTML = '';
  }, 400);
}

if (modalClose) modalClose.addEventListener('click', closeModal);
if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ═══════════════════════════════════════════════════
// TERMINAL BOOT SEQUENCE
// ═══════════════════════════════════════════════════
async function runBootSequence() {
  if (!bootSequence || !bootText) {
    init();
    return;
  }
  document.body.style.overflow = 'hidden';
  const lines = ['Establishing secure connection...', 'Bypassing firewall...', 'Accessing vault: TIME CAPSULE', 'Status: SEEKING ASSETS...'];
  let currentText = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      currentText += line[j];
      bootText.textContent = currentText;
      await sleep(Math.random() * 40 + 10);
    }
    currentText += '\n';
    bootText.textContent = currentText;
    await sleep(400);
  }
  await sleep(600);
  bootSequence.classList.add('boot-sequence--hidden');
  document.body.style.overflow = '';
  setTimeout(() => {
    bootSequence.style.display = 'none';
    init();
  }, 800);
}

// ═══════════════════════════════════════════════════
// PARTICLE BACKGROUND
// ═══════════════════════════════════════════════════
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let shootingStars = [];
  let spaceObjects = [];
  
  const PARTICLE_COUNT = 180;
  
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initSpaceObjects(); // Re-init objects on resize
  }
  
  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      // Varying sizes: Small (0.5-1.2), Medium (1.2-2.5), Big (2.5-4)
      const r = Math.random();
      if (r < 0.6) this.size = Math.random() * 0.7 + 0.5; // Small
      else if (r < 0.9) this.size = Math.random() * 1.3 + 1.2; // Medium
      else this.size = Math.random() * 1.5 + 2.5; // Big
      
      // Some move fast, some slow
      const speedMult = Math.random() < 0.1 ? 1.5 : 0.4; 
      this.speedX = (Math.random() - 0.5) * speedMult;
      this.speedY = (Math.random() - 0.5) * speedMult;
      this.opacity = Math.random() * 0.4 + 0.1;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
    }
    draw() {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? `rgba(20, 20, 20, ${this.opacity * 0.8})` : `rgba(218, 222, 149, ${this.opacity})`;
      ctx.fill();
    }
  }

  class ShootingStar {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * (canvas.height * 0.5);
      this.length = Math.random() * 80 + 40;
      this.speed = Math.random() * 10 + 5;
      this.opacity = 0;
      this.active = false;
      this.wait = Math.random() * 400; // Delay between streaks
    }
    update() {
      if (!this.active) {
        if (this.wait-- <= 0) this.active = true;
        return;
      }
      this.x -= this.speed;
      this.y += this.speed * 0.5;
      this.opacity += 0.05;
      if (this.x < -this.length || this.y > canvas.height) this.reset();
    }
    draw() {
      if (!this.active) return;
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      ctx.strokeStyle = isLight ? `rgba(20, 20, 20, ${this.opacity})` : `rgba(218, 222, 149, ${this.opacity})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + this.length, this.y - this.length * 0.5);
      ctx.stroke();
    }
  }

  // --- Space Elements: Planets, UFO, etc ---
  function initSpaceObjects() {
    spaceObjects = [
      { type: 'saturn', x: canvas.width * 0.85, y: canvas.height * 0.2, s: 35, angle: 0, rot: 0.005, id: 1 },
      { type: 'jupiter', x: canvas.width * 0.1, y: canvas.height * 0.3, s: 45, rot: 0.003, t: 0, id: 2 },
      { type: 'mars', x: canvas.width * 0.7, y: canvas.height * 0.75, s: 18, rot: 0.008, t: 0, id: 3 },
      { type: 'earth', x: canvas.width * 0.25, y: canvas.height * 0.15, s: 22, rot: 0.004, t: 0, id: 4 },
      { type: 'moon', x: canvas.width * 0.2, y: canvas.height * 0.8, s: 12, rot: 0.002, t: 0, id: 5 },
      { type: 'ufo', x: canvas.width * 0.45, y: canvas.height * 0.55, t: 0, id: 6 },
      { type: 'satellite', x: 200, y: 150, vx: 0.2, vy: 0.08, id: 7 },
      { type: 'asteroid', x: canvas.width * 0.6, y: canvas.height * 0.85, s: 5, id: 8 }
    ];
  }

  // --- INTERACTIVE DRAGGING ---
  let draggedObj = null;
  let dragOffset = { x: 0, y: 0 };

  function handleInteractionStart(e, x, y) {
    // If we click on a button, toggle or card, ignore the drag
    if (e.target.closest('button, .status-bar, .preview__card, .vault__card, .timer__block, .progress-wrapper')) return;

    for (let i = spaceObjects.length - 1; i >= 0; i--) {
      const obj = spaceObjects[i];
      const dist = Math.sqrt((x - obj.x) ** 2 + (y - obj.y) ** 2);
      if (dist < (obj.s || 20) + 15) { 
        draggedObj = obj;
        dragOffset.x = x - obj.x;
        dragOffset.y = y - obj.y;
        document.body.style.cursor = 'grabbing';
        e.preventDefault(); // Only prevent default if we've hit an object
        break;
      }
    }
  }

  function handleInteractionMove(x, y) {
    if (draggedObj) {
      draggedObj.x = x - dragOffset.x;
      draggedObj.y = y - dragOffset.y;
    }
  }

  function handleInteractionEnd() {
    draggedObj = null;
    document.body.style.cursor = '';
  }

  window.addEventListener('mousedown', (e) => handleInteractionStart(e, e.clientX, e.clientY));
  window.addEventListener('mousemove', (e) => handleInteractionMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', handleInteractionEnd);

  // Touch Support
  window.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    handleInteractionStart(e, touch.clientX, touch.clientY);
  }, { passive: false });
  window.addEventListener('touchmove', (e) => {
    if (draggedObj) {
      const touch = e.touches[0];
      handleInteractionMove(touch.clientX, touch.clientY);
      e.preventDefault(); // Stop scrolling only if dragging
    }
  }, { passive: false });
  window.addEventListener('touchend', handleInteractionEnd);

  function drawObject(obj) {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const mainCol = isLight ? '#2B2B2B' : '#BAC095';
    const accentCol = isLight ? '#D4D4D4' : '#636B2F';
    const highlightCol = isLight ? '#000000' : '#DADE95';

    ctx.save();
    ctx.translate(obj.x, obj.y);

    if (obj.type === 'saturn') {
      obj.angle += obj.rot;
      // Shadow / Base
      ctx.beginPath(); ctx.arc(0, 0, obj.s, 0, Math.PI * 2);
      ctx.fillStyle = mainCol; ctx.fill();
      // Ring (Under planet)
      ctx.beginPath(); ctx.ellipse(0, 0, obj.s * 2.3, obj.s * 0.7, Math.PI / 8, 0, Math.PI);
      ctx.strokeStyle = accentCol; ctx.stroke();
      // Ring (Over planet)
      ctx.beginPath(); ctx.ellipse(0, 0, obj.s * 2.3, obj.s * 0.7, Math.PI / 8, Math.PI, Math.PI * 2);
      ctx.strokeStyle = accentCol; ctx.stroke();
    } 
    else if (obj.type === 'jupiter') {
      obj.t += obj.rot;
      // Clip to sphere
      ctx.beginPath(); ctx.arc(0, 0, obj.s, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = mainCol; ctx.fill();
      // Banded Stripes (Rotating)
      ctx.fillStyle = accentCol;
      for (let i = -2; i < 3; i++) {
        let y = i * (obj.s / 2) + (Math.sin(obj.t + i) * 2);
        ctx.fillRect(-obj.s * 2, y, obj.s * 4, 3);
      }
      // Great Spot
      let spotX = (obj.t * 50) % (obj.s * 4) - obj.s * 2;
      ctx.beginPath(); ctx.ellipse(spotX, 10, 8, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? '#FF5722' : '#FF5722'; ctx.fill();
    }
    else if (obj.type === 'mars' || obj.type === 'moon') {
      obj.t += obj.rot;
      ctx.beginPath(); ctx.arc(0, 0, obj.s, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = obj.type === 'mars' ? (isLight ? '#A34428' : '#FF5722') : accentCol;
      ctx.fill();
      // Craters (Rotating)
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      for (let i = 0; i < 5; i++) {
          let cx = ((obj.t * 30 + i * 20) % (obj.s * 3)) - obj.s * 1.5;
          let cy = Math.sin(i) * (obj.s * 0.6);
          ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    else if (obj.type === 'earth') {
      obj.t += obj.rot;
      ctx.beginPath(); ctx.arc(0, 0, obj.s, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = isLight ? '#D4D4D4' : '#4A4F32'; ctx.fill();
      // Continents (Rotating)
      ctx.fillStyle = mainCol;
      for (let i = 0; i < 3; i++) {
        let ex = ((obj.t * 40 + i * 50) % (obj.s * 4)) - obj.s * 2;
        ctx.fillRect(ex, -10 + i * 5, 15, 8);
      }
    }
    else if (obj.type === 'ufo') {
      obj.t += 0.05;
      if (draggedObj !== obj) {
        ctx.translate(Math.sin(obj.t) * 15, Math.cos(obj.t * 0.4) * 8);
      }
      ctx.beginPath(); ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = mainCol; ctx.fill();
      ctx.beginPath(); ctx.arc(0, -3, 6, 0, Math.PI, true);
      ctx.fillStyle = isLight ? '#BAC095' : '#DADE95'; ctx.fill();
    }
    else if (obj.type === 'satellite') {
      if (draggedObj !== obj) {
        obj.x += obj.vx; obj.y += obj.vy;
        if (obj.x > canvas.width) obj.x = -50;
      }
      ctx.fillStyle = mainCol; ctx.fillRect(0, 0, 10, 5);
      ctx.fillRect(3, -4, 4, 13);
    }
    else if (obj.type === 'asteroid') {
      ctx.rotate(Date.now() * 0.001);
      ctx.fillStyle = accentCol;
      ctx.fillRect(-obj.s, -obj.s, obj.s * 2, obj.s * 2);
    }

    if (draggedObj === obj) {
      ctx.beginPath(); ctx.arc(0, 0, (obj.s || 20) + 5, 0, Math.PI * 2);
      ctx.strokeStyle = highlightCol; ctx.lineWidth = 1; ctx.stroke();
    }

    ctx.restore();
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
  for (let i = 0; i < 3; i++) shootingStars.push(new ShootingStar());

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    shootingStars.forEach(s => { s.update(); s.draw(); });
    spaceObjects.forEach(o => drawObject(o));
    requestAnimationFrame(animate);
  }
  animate();
}

// ═══════════════════════════════════════════════════
// COUNTDOWN TIMER
// ═══════════════════════════════════════════════════
function padZero(n) { return String(n).padStart(2, '0'); }
function updateClock() {
  const now = new Date();
  if (currentTimeEl) currentTimeEl.textContent = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function updateCountdown() {
  const now = new Date();
  const diff = TARGET_DATE.getTime() - now.getTime();
  if (diff <= 0) {
    daysEl.textContent = '00'; hoursEl.textContent = '00'; minutesEl.textContent = '00'; secondsEl.textContent = '00';
    progressFill.style.width = '100%';
    progressText.textContent = '100% complete — UNLOCKING VAULT...';
    clearInterval(timerInterval);
    if (!isUnlocked) { isUnlocked = true; unlockVault(); }
    return;
  }
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  daysEl.textContent = padZero(days); hoursEl.textContent = padZero(hours); minutesEl.textContent = padZero(minutes); secondsEl.textContent = padZero(seconds);
  const totalDuration = TARGET_DATE.getTime() - CREATION_DATE.getTime();
  const elapsed = now.getTime() - CREATION_DATE.getTime();
  const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  progressFill.style.width = `${progress.toFixed(2)}%`;
  progressText.textContent = `${progress.toFixed(2)}% complete`;
  updateClock();
}

// ═══════════════════════════════════════════════════
// VAULT UNLOCK
// ═══════════════════════════════════════════════════
async function unlockVault() {
  countdownSection.classList.remove('section--active');
  await sleep(800);
  if (!isMuted && unlockSound) unlockSound.play().catch(e => console.log('Vault sound blocked:', e));
  vaultSection.classList.add('section--active');
  if (unlockTimeEl) unlockTimeEl.textContent = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' });
  vaultGrid.innerHTML = `<div class="vault__loader" style="grid-column: 1 / -1;"><div class="spinner"></div><p>DECRYPTING VAULT CONTENTS...</p></div>`;
  
  const MOCK_UNLOCKED = {
    unlocked: true,
    media: {
      images: [
        { url: '/assets/anshu ram.jpeg', title: 'Anshu Ram', tag: 'IMAGE' }, // Fixed path
        { url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa', title: 'Earth Orbit', tag: 'IMAGE' },
        { url: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5', title: 'Jupiter', tag: 'IMAGE' }
      ],
      videos: [
        { url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', title: 'Flower Bloom Video', tag: 'VIDEO' }
      ]
    }
  };

  let data;
  if (isCheatMode) {
    // Attempt real fetch even in cheat mode, with a flag to bypass the server's date check.
    data = await safeFetch(`${API_ENDPOINT}?cheat=true`, MOCK_UNLOCKED);
  } else {
    data = await safeFetch(API_ENDPOINT, MOCK_UNLOCKED);
  }

  if (!data.unlocked) {
    vaultGrid.innerHTML = `<div class="vault__loader" style="grid-column: 1 / -1;"><p style="color: var(--red);">VAULT SEALED.</p></div>`;
    return;
  }
  renderMedia(data.media);
}

function renderMedia(media) {
  if (!media) return;
  if (media.message && vaultMessage) { vaultMessage.textContent = media.message; vaultMessage.style.display = 'block'; }
  vaultGrid.innerHTML = '';
  const allMedia = [
    ...(media.images || []).map(m => ({ ...m, type: 'image' })),
    ...(media.videos || []).map(m => ({ ...m, type: 'video' }))
  ];
  allMedia.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = `vault__card fade-up ${item.type === 'video' ? 'vault__card--video' : ''}`;
    card.style.animationDelay = `${i * 0.12}s`;
    
    // Open modal on click
    card.addEventListener('click', () => openModal(item.type, item.url, item.title));

    if (item.type === 'image') {
      card.innerHTML = `<img src="${item.url}" alt="${item.title}" loading="lazy" /><div class="vault__card-info"><span class="vault__card-title">${item.title}</span><span class="vault__card-tag">${item.tag || 'IMAGE'}</span></div>`;
    } else {
      card.innerHTML = `<div class="vault__card-video-wrapper"><video src="${item.url}" muted playsinline preload="metadata"></video><div class="video-badge"><svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"></polygon></svg></div></div><div class="vault__card-info"><span class="vault__card-title">${item.title}</span><span class="vault__card-tag">${item.tag || 'VIDEO'}</span></div>`;
    }
    vaultGrid.appendChild(card);
  });
}

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

// ═══════════════════════════════════════════════════
// VAULT PREVIEW
// ═══════════════════════════════════════════════════
function renderPreview() {
  if (!previewGrid) return;
  previewGrid.innerHTML = '';
  const { visibleImage, visibleVideo, lockedCount } = PREVIEW_CONFIG;
  if (visibleImage.url) {
    const imgCard = document.createElement('div');
    imgCard.className = 'preview__card fade-up';
    imgCard.addEventListener('click', () => openModal('image', visibleImage.url, visibleImage.title));
    imgCard.innerHTML = `<img src="${visibleImage.url}" alt="${visibleImage.title}" loading="lazy" /><div class="preview__card-info"><span class="preview__card-title">${visibleImage.title}</span><span class="preview__card-tag">${visibleImage.tag}</span></div>`;
    previewGrid.appendChild(imgCard);
  }
  if (visibleVideo.url) {
    const vidCard = document.createElement('div');
    vidCard.className = 'preview__card preview__card--video fade-up';
    vidCard.addEventListener('click', () => openModal('video', visibleVideo.url, visibleVideo.title));
    vidCard.innerHTML = `<div class="preview__card-media"><video src="${visibleVideo.url}" muted loop playsinline poster="${visibleVideo.poster}"></video><div class="play-badge"><svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"></polygon></svg></div></div><div class="preview__card-info"><span class="preview__card-title">${visibleVideo.title}</span><span class="preview__card-tag">${visibleVideo.tag}</span></div>`;
    previewGrid.appendChild(vidCard);
  }
  const placeholders = Math.max(0, Math.min(lockedCount || 4, 12));
  for (let i = 0; i < placeholders; i++) {
    const lockedCard = document.createElement('div');
    lockedCard.className = 'preview__card preview__card--locked fade-up';
    const hue = 65 + i * 12;
    lockedCard.innerHTML = `<div class="preview__card-media"><div style="width:100%;height:100%;background:linear-gradient(${135 + i * 20}deg, hsl(${hue},30%,12%) 0%, hsl(${hue + 20},20%,16%) 50%, hsl(${hue},15%,10%) 100%); min-height:200px;"></div><div class="lock-overlay">${LOCK_SVG}<span class="lock-overlay__text">LOCKED</span></div></div><div class="preview__card-info"><span class="preview__card-title">FRAGMENT_${String(i + 3).padStart(3, '0')}</span><span class="preview__card-tag" style="color:var(--red);">SEALED</span></div>`;
    previewGrid.appendChild(lockedCard);
  }
}

// ─── Robust API Fetch Helper ───
async function safeFetch(url, fallbackData) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response not OK');
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return await response.json();
    }
    throw new Error('Response is not JSON');
  } catch (err) {
    console.warn(`API Fallback (${url}):`, err.message);
    return fallbackData;
  }
}

async function init() {
  initParticles();

  const MOCK_TEASERS = {
    teasers: {
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
      video: '',
      totalLockedCount: 6
    }
  };

  const MOCK_UNLOCKED = {
    unlocked: true,
    media: {
      images: [
        { url: '/assets/anshu ram.jpeg', title: 'Anshu Ram', tag: 'IMAGE' },
        { url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa', title: 'Earth Orbit', tag: 'IMAGE' },
        { url: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5', title: 'Jupiter', tag: 'IMAGE' }
      ],
      videos: [
        { url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', title: 'Flower Bloom Video', tag: 'VIDEO' }
      ]
    }
  };

  if (new Date() >= TARGET_DATE) {
    isUnlocked = true;
    if (countdownSection) countdownSection.classList.remove('section--active');
    if (vaultSection) vaultSection.classList.add('section--active');
    
    const data = await safeFetch(API_ENDPOINT, MOCK_UNLOCKED);
    if (data.unlocked) renderMedia(data.media);
  } else {
    updateCountdown();
    setInterval(updateCountdown, 1000);
    
    const data = await safeFetch(API_ENDPOINT, MOCK_TEASERS);
    if (data.teasers) {
      if (data.teasers.image) PREVIEW_CONFIG.visibleImage = data.teasers.image;
      if (data.teasers.video) PREVIEW_CONFIG.visibleVideo = data.teasers.video;
      if (data.teasers.totalLockedCount !== undefined) PREVIEW_CONFIG.lockedCount = data.teasers.totalLockedCount;
      renderPreview();
    }
    renderPreview();
  }
}
document.addEventListener('DOMContentLoaded', runBootSequence);
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
    e.preventDefault();
    const newDateStr = prompt('Override date:', new Date(Date.now() - 1000).toISOString().slice(0, 19));
    if (newDateStr) { 
      TARGET_DATE = new Date(newDateStr); 
      isCheatMode = true; 
      updateCountdown(); 
    }
  }
});
