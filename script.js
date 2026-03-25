/* ═══════════════════════════════════════════════════
   DIGITAL TIME CAPSULE — Main Script
   ═══════════════════════════════════════════════════ */

// ─── Config ───
let TARGET_DATE = new Date('2026-05-15T23:55:00Z');
const CREATION_DATE = new Date('2026-03-24T00:00:00');
const API_ENDPOINT = '/api/unlock';

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
  const PARTICLE_COUNT = 60;
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 1.5 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.5 + 0.1;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
      if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 240, 255, ${this.opacity})`;
      ctx.fill();
    }
  }
  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
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
  try {
    const res = await fetch(API_ENDPOINT);
    const data = await res.json();
    if (!data.unlocked) {
      vaultGrid.innerHTML = `<div class="vault__loader" style="grid-column: 1 / -1;"><p style="color: var(--red);">VAULT SEALED.</p></div>`;
      return;
    }
    renderMedia(data.media);
  } catch (err) {
    vaultGrid.innerHTML = `<div class="vault__loader" style="grid-column: 1 / -1;"><p style="color: var(--red);">ERROR.</p></div>`;
  }
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
    const hue = 180 + i * 30;
    lockedCard.innerHTML = `<div class="preview__card-media"><div style="width:100%;height:100%;background:linear-gradient(${135 + i * 20}deg, hsl(${hue},40%,8%) 0%, hsl(${hue + 40},30%,12%) 50%, hsl(${hue},20%,6%) 100%); min-height:200px;"></div><div class="lock-overlay">${LOCK_SVG}<span class="lock-overlay__text">LOCKED</span></div></div><div class="preview__card-info"><span class="preview__card-title">FRAGMENT_${String(i + 3).padStart(3, '0')}</span><span class="preview__card-tag" style="color:var(--red);">SEALED</span></div>`;
    previewGrid.appendChild(lockedCard);
  }
}

function init() {
  initParticles();
  if (new Date() >= TARGET_DATE) {
    isUnlocked = true; countdownSection.classList.remove('section--active'); vaultSection.classList.add('section--active');
    fetch(API_ENDPOINT).then(r => r.json()).then(data => { if (data.unlocked) renderMedia(data.media); });
  } else {
    updateCountdown(); setInterval(updateCountdown, 1000);
    fetch(API_ENDPOINT).then(r => r.json()).then(data => {
      if (data.teasers) {
        if (data.teasers.image) PREVIEW_CONFIG.visibleImage = data.teasers.image;
        if (data.teasers.video) PREVIEW_CONFIG.visibleVideo = data.teasers.video;
        if (data.teasers.totalLockedCount !== undefined) PREVIEW_CONFIG.lockedCount = data.teasers.totalLockedCount;
        renderPreview();
      }
    });
    renderPreview();
  }
}
document.addEventListener('DOMContentLoaded', runBootSequence);
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
    e.preventDefault();
    const newDateStr = prompt('Override date:', new Date(Date.now() - 1000).toISOString().slice(0, 19));
    if (newDateStr) { TARGET_DATE = new Date(newDateStr); updateCountdown(); }
  }
});
