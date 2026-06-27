/* -------------------------------------------------------------
   Espacio para Pau - Lógica Frontend
   ------------------------------------------------------------- */

// API Base URL (Dynamic detection based on environment)
const API_BASE = window.location.origin.includes('localhost') 
  ? 'http://localhost:3001' 
  : window.location.origin;

// State management
const state = {
  currentDate: new Date(),
  selectedDate: null,
  outings: [],
  thoughts: [],
  currentPhotoIndex: 0,
  photos: [
    { src: 'assets/photo1.jpg', caption: 'Miradas que iluminan - Tu sonrisa tiene el poder de iluminar cualquier momento.' },
    { src: 'assets/photo2.jpg', caption: 'Risas compartidas - Estar contigo siempre hacía que todo fuera más especial.' },
    { src: 'assets/photo3.jpg', caption: 'Aquellos ojos bonitos - Esos ojos en los que siempre era extremadamente fácil perderse.' },
    { src: 'assets/photo4.jpg', caption: 'Instantes inolvidables - De los mejores recuerdos que guardo con un cariño enorme.' },
    { src: 'assets/photo5.jpg', caption: 'Detalles únicos - Cada pequeña conversación dejó una huella imposible de borrar.' }
  ]
};

// Document Elements
const welcomeOverlay = document.getElementById('welcome-overlay');
const enterBtn = document.getElementById('enter-btn');
const mainContent = document.getElementById('main-content');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section-content');

// Lightbox Elements
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxClose = document.querySelector('.lightbox-close');
const lightboxPrev = document.querySelector('.lightbox-prev');
const lightboxNext = document.querySelector('.lightbox-next');
const momentCards = document.querySelectorAll('.moment-card');

// Thoughts Elements
const thoughtsContainer = document.getElementById('thoughts-container');
const addThoughtTrigger = document.getElementById('add-thought-trigger');
const thoughtModal = document.getElementById('thought-modal');
const closeThoughtModal = document.getElementById('close-thought-modal');
const cancelThoughtBtn = document.getElementById('cancel-thought-btn');
const thoughtForm = document.getElementById('thought-form');
const thoughtContentInput = document.getElementById('thought-content');
const saveThoughtBtn = document.getElementById('save-thought-btn');

// Calendar Elements
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const currentMonthYearLabel = document.getElementById('current-month-year');
const calendarDaysGrid = document.getElementById('calendar-days');
const outingsListContainer = document.getElementById('outings-list');

// Schedule Outing Modal Elements
const scheduleModal = document.getElementById('schedule-modal');
const closeScheduleModal = document.getElementById('close-schedule-modal');
const cancelScheduleBtn = document.getElementById('cancel-schedule-btn');
const scheduleForm = document.getElementById('schedule-form');
const selectedDateDisplay = document.getElementById('selected-date-display');
const outingDateInput = document.getElementById('outing-date');
const outingTitleInput = document.getElementById('outing-title');
const outingTimeInput = document.getElementById('outing-time');
const outingDescInput = document.getElementById('outing-desc');
const saveOutingBtn = document.getElementById('save-outing-btn');

// -------------------------------------------------------------
// 1. INICIALIZACIÓN Y BIENVENIDA
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Configuración del botón de ingreso
  enterBtn.addEventListener('click', () => {
    welcomeOverlay.classList.add('fade-out');
    mainContent.classList.remove('main-content-hidden');
    mainContent.classList.add('main-content-visible');
    
    // Start subtle floating hearts canvas animation
    initHeartsAnimation();
    
    // Load initial data
    loadThoughts();
    loadOutings();
  });
  
  // Navigation tabs
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');
      
      // Update active link
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Update visible section
      sections.forEach(sec => {
        sec.classList.remove('active-section');
        if (sec.id === targetId) {
          sec.classList.add('active-section');
        }
      });
    });
  });
  
  // Initial calendar render
  renderCalendar();
  
  // Wire up event listeners
  setupEvents();
});

// Setup global events
function setupEvents() {
  // Lightbox close/prev/next
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', prevImage);
  lightboxNext.addEventListener('click', nextImage);
  
  // Click on gallery cards
  momentCards.forEach(card => {
    card.addEventListener('click', () => {
      const index = parseInt(card.getAttribute('data-index'));
      openLightbox(index);
    });
  });
  
  // Lightbox keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('lightbox-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
  });

  // Close modals on clicking backdrop
  window.addEventListener('click', (e) => {
    if (e.target === thoughtModal) closeThoughtForm();
    if (e.target === scheduleModal) closeScheduleForm();
    if (e.target === lightbox) closeLightbox();
  });

  // Thoughts form trigger & close
  addThoughtTrigger.addEventListener('click', openThoughtForm);
  closeThoughtModal.addEventListener('click', closeThoughtForm);
  cancelThoughtBtn.addEventListener('click', closeThoughtForm);
  thoughtForm.addEventListener('submit', submitThought);

  // Calendar nav
  prevMonthBtn.addEventListener('click', () => {
    state.currentDate.setMonth(state.currentDate.getMonth() - 1);
    renderCalendar();
    updateOutingsSidebar();
  });
  
  nextMonthBtn.addEventListener('click', () => {
    state.currentDate.setMonth(state.currentDate.getMonth() + 1);
    renderCalendar();
    updateOutingsSidebar();
  });

  // Outing modal close
  closeScheduleModal.addEventListener('click', closeScheduleForm);
  cancelScheduleBtn.addEventListener('click', closeScheduleForm);
  scheduleForm.addEventListener('submit', submitOuting);
}

// -------------------------------------------------------------
// 2. ANIMACIÓN DE CORAZONES FLOTANTES
// -------------------------------------------------------------
function initHeartsAnimation() {
  const canvas = document.createElement('canvas');
  canvas.id = 'hearts-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '0';
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  let animationFrameId;
  
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  
  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });
  
  const hearts = [];
  const heartColors = ['rgba(224, 170, 255, 0.15)', 'rgba(255, 198, 255, 0.15)', 'rgba(217, 4, 41, 0.08)'];
  
  class Heart {
    constructor() {
      this.reset();
      this.y = Math.random() * height; // Start at random height initially
    }
    
    reset() {
      this.x = Math.random() * width;
      this.y = height + 20;
      this.size = Math.random() * 12 + 6;
      this.speedY = -(Math.random() * 0.8 + 0.3);
      this.swingSpeed = Math.random() * 0.02 + 0.01;
      this.swingRange = Math.random() * 15 + 5;
      this.swingAngle = Math.random() * Math.PI;
      this.color = heartColors[Math.floor(Math.random() * heartColors.length)];
    }
    
    update() {
      this.y += this.speedY;
      this.swingAngle += this.swingSpeed;
      this.xOffset = Math.sin(this.swingAngle) * this.swingRange;
      
      if (this.y < -20 || this.x < -20 || this.x > width + 20) {
        this.reset();
      }
    }
    
    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      const drawX = this.x + this.xOffset;
      
      // Draw standard vector heart path
      ctx.moveTo(drawX, this.y);
      ctx.bezierCurveTo(
        drawX - this.size / 2, this.y - this.size / 2, 
        drawX - this.size, this.y + this.size / 3, 
        drawX, this.y + this.size
      );
      ctx.bezierCurveTo(
        drawX + this.size, this.y + this.size / 3, 
        drawX + this.size / 2, this.y - this.size / 2, 
        drawX, this.y
      );
      ctx.fill();
    }
  }
  
  // Create 25 hearts
  for (let i = 0; i < 25; i++) {
    hearts.push(new Heart());
  }
  
  function animate() {
    ctx.clearRect(0, 0, width, height);
    hearts.forEach(heart => {
      heart.update();
      heart.draw();
    });
    animationFrameId = requestAnimationFrame(animate);
  }
  
  animate();
}

// -------------------------------------------------------------
// 3. SECCIÓN MOMENTOS - LIGHTBOX
// -------------------------------------------------------------
function openLightbox(index) {
  state.currentPhotoIndex = index;
  const photo = state.photos[index];
  
  lightboxImg.src = photo.src;
  lightboxCaption.textContent = photo.caption;
  lightbox.classList.add('lightbox-open');
  document.body.style.overflow = 'hidden'; // Disable page scroll
}

function closeLightbox() {
  lightbox.classList.remove('lightbox-open');
  document.body.style.overflow = 'auto'; // Enable page scroll
}

function nextImage() {
  state.currentPhotoIndex = (state.currentPhotoIndex + 1) % state.photos.length;
  updateLightboxContent();
}

function prevImage() {
  state.currentPhotoIndex = (state.currentPhotoIndex - 1 + state.photos.length) % state.photos.length;
  updateLightboxContent();
}

function updateLightboxContent() {
  const photo = state.photos[state.currentPhotoIndex];
  
  // Fade out/in effect for image change
  lightboxImg.style.opacity = '0.3';
  setTimeout(() => {
    lightboxImg.src = photo.src;
    lightboxCaption.textContent = photo.caption;
    lightboxImg.style.opacity = '1';
  }, 150);
}

// -------------------------------------------------------------
// 4. SECCIÓN PENSAMIENTOS - DIARIO DINÁMICO
// -------------------------------------------------------------
async function loadThoughts() {
  try {
    const res = await fetch(`${API_BASE}/api/thoughts`);
    if (!res.ok) throw new Error('Error al cargar pensamientos');
    
    state.thoughts = await res.json();
    renderThoughts();
  } catch (err) {
    console.error(err);
    thoughtsContainer.innerHTML = `
      <div class="no-thoughts">
        <p>No pudimos cargar los pensamientos de la base de datos.</p>
        <button class="btn btn-secondary" onclick="loadThoughts()" style="margin-top: 15px;">Intentar de nuevo</button>
      </div>
    `;
  }
}

function renderThoughts() {
  if (state.thoughts.length === 0) {
    thoughtsContainer.innerHTML = `
      <div class="no-thoughts">
        <p>Aún no hay ningún pensamiento escrito en este espacio.</p>
        <p style="font-size: 0.9rem; margin-top: 10px; color: var(--text-muted);">Haz clic en "Escribir un Pensamiento" para dejar el primero.</p>
      </div>
    `;
    return;
  }
  
  thoughtsContainer.innerHTML = state.thoughts.map(t => {
    const date = new Date(t.created_at);
    const formattedDate = date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    return `
      <div class="thought-card">
        <div class="thought-body">${escapeHTML(t.content)}</div>
        <div class="thought-footer">
          <span class="thought-date">${formattedDate}</span>
          <span class="thought-heart">❤️</span>
        </div>
      </div>
    `;
  }).join('');
}

function openThoughtForm() {
  thoughtModal.classList.add('modal-open');
}

function closeThoughtForm() {
  thoughtModal.classList.remove('modal-open');
  thoughtForm.reset();
}

async function submitThought(e) {
  e.preventDefault();
  
  const content = thoughtContentInput.value.trim();
  if (!content) return;
  
  saveThoughtBtn.disabled = true;
  const originalText = saveThoughtBtn.innerHTML;
  saveThoughtBtn.innerHTML = '<span>Guardando...</span>';
  
  try {
    const res = await fetch(`${API_BASE}/api/thoughts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });
    
    if (!res.ok) throw new Error('Error al guardar el pensamiento');
    
    const newThought = await res.json();
    state.thoughts.unshift(newThought); // Add to the top of list
    
    closeThoughtForm();
    renderThoughts();
  } catch (err) {
    console.error(err);
    alert('No se pudo guardar el pensamiento. Inténtalo de nuevo.');
  } finally {
    saveThoughtBtn.disabled = false;
    saveThoughtBtn.innerHTML = originalText;
  }
}

// -------------------------------------------------------------
// 5. SECCIÓN CALENDARIO - COMPONENTE DINÁMICO
// -------------------------------------------------------------
async function loadOutings() {
  try {
    const res = await fetch(`${API_BASE}/api/outings`);
    if (!res.ok) throw new Error('Error al cargar salidas');
    
    state.outings = await res.json();
    renderCalendar();
    updateOutingsSidebar();
  } catch (err) {
    console.error(err);
  }
}

function renderCalendar() {
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();
  
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  
  currentMonthYearLabel.textContent = `${monthNames[month]} ${year}`;
  
  // Clear grid
  calendarDaysGrid.innerHTML = '';
  
  // First day of the month
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Last day of current month
  const lastDay = new Date(year, month + 1, 0).getDate();
  // Today's date representation to match
  const today = new Date();
  
  // Add empty blocks for days of previous month
  for (let i = 0; i < firstDayIndex; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'cal-day cal-day-empty';
    calendarDaysGrid.appendChild(emptyDay);
  }
  
  // Add actual days
  for (let day = 1; day <= lastDay; day++) {
    const dayBtn = document.createElement('div');
    dayBtn.className = 'cal-day';
    dayBtn.textContent = day;
    
    // Construct local date representation (YYYY-MM-DD)
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    
    dayBtn.setAttribute('data-date', dateStr);
    
    // Highlight today
    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      dayBtn.classList.add('cal-day-today');
    }
    
    // Highlight if selected
    if (state.selectedDate === dateStr) {
      dayBtn.classList.add('cal-day-selected');
    }
    
    // Mark if date has outing
    const hasOuting = state.outings.some(out => {
      // Date from DB might be TIMESTAMP/DATE. We split on 'T' or take substring of YYYY-MM-DD
      const outDateStr = out.date.split('T')[0];
      return outDateStr === dateStr;
    });
    
    if (hasOuting) {
      dayBtn.classList.add('cal-day-has-outing');
    }
    
    // Click day handler
    dayBtn.addEventListener('click', () => {
      selectDay(dateStr, day, month, year);
    });
    
    calendarDaysGrid.appendChild(dayBtn);
  }
}

function selectDay(dateStr, day, month, year) {
  state.selectedDate = dateStr;
  
  // Render updates to apply selection class
  renderCalendar();
  
  // Format selected date for display
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const dateObj = new Date(year, month, day);
  const formattedFriendlyDate = `${day} de ${monthNames[month]} de ${year}`;
  
  selectedDateDisplay.textContent = formattedFriendlyDate;
  outingDateInput.value = dateStr;
  
  // Open schedule modal
  scheduleModal.classList.add('modal-open');
}

function closeScheduleForm() {
  scheduleModal.classList.remove('modal-open');
  scheduleForm.reset();
}

async function submitOuting(e) {
  e.preventDefault();
  
  const title = outingTitleInput.value.trim();
  const time = outingTimeInput.value.trim();
  const description = outingDescInput.value.trim();
  const date = outingDateInput.value;
  
  if (!title || !date) return;
  
  saveOutingBtn.disabled = true;
  const originalText = saveOutingBtn.innerHTML;
  saveOutingBtn.innerHTML = '<span>Agendando...</span>';
  
  try {
    const res = await fetch(`${API_BASE}/api/outings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        description,
        date,
        time
      })
    });
    
    if (!res.ok) throw new Error('Error al agendar salida');
    
    const newOuting = await res.json();
    state.outings.push(newOuting);
    
    closeScheduleForm();
    renderCalendar();
    updateOutingsSidebar();
  } catch (err) {
    console.error(err);
    alert('No se pudo agendar la salida. Inténtalo de nuevo.');
  } finally {
    saveOutingBtn.disabled = false;
    saveOutingBtn.innerHTML = originalText;
  }
}

function updateOutingsSidebar() {
  const currentMonth = state.currentDate.getMonth();
  const currentYear = state.currentDate.getFullYear();
  
  // Filter outings for current calendar month
  const filteredOutings = state.outings.filter(out => {
    const outDate = new Date(out.date);
    // Outing date might be set back by timezone. Let's adjust to local if needed,
    // but standard UTC date parsing works fine.
    const outYear = outDate.getUTCFullYear();
    const outMonth = outDate.getUTCMonth();
    return outYear === currentYear && outMonth === currentMonth;
  });
  
  // Sort chronologically
  filteredOutings.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  if (filteredOutings.length === 0) {
    outingsListContainer.innerHTML = `
      <p class="no-outings">No hay planes agendados para este mes aún. ¡Selecciona un día en el calendario para proponer algo!</p>
    `;
    return;
  }
  
  const monthNames = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];
  
  outingsListContainer.innerHTML = filteredOutings.map(out => {
    const dateObj = new Date(out.date);
    const day = dateObj.getUTCDate();
    const monthStr = monthNames[dateObj.getUTCMonth()];
    const dateLabel = `${day} ${monthStr}`;
    
    return `
      <div class="outing-item">
        <div class="outing-item-header">
          <span class="outing-item-title">${escapeHTML(out.title)}</span>
          <span class="outing-item-date">${dateLabel}</span>
        </div>
        <div class="outing-item-time">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          ${escapeHTML(out.time)}
        </div>
        ${out.description ? `<p class="outing-item-desc">${escapeHTML(out.description)}</p>` : ''}
      </div>
    `;
  }).join('');
}

// Helper to escape HTML characters
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
