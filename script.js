/* ═══════════════════════════════════════════════════
   PRINCE LEARNING HUB · script.js
   Core application logic
═══════════════════════════════════════════════════ */

/* ══════════════════════
   STATE
══════════════════════ */
let allCards       = [];
let uploadedFiles  = [];
let activeCategory = 'all';
let currentQuery   = '';

const STORAGE_KEY_FILES = 'plh_files';
const STORAGE_KEY_CARDS = 'plh_cards';

/* ══════════════════════
   CATEGORY COLORS
══════════════════════ */
const CAT_META = {
  tax:      { color: 'var(--tax-color)',      label: 'Direct Tax',  emoji: '📊' },
  law:      { color: 'var(--law-color)',      label: 'Law',         emoji: '⚖️' },
  accounts: { color: 'var(--accounts-color)', label: 'Accounts',    emoji: '🧾' },
  gst:      { color: 'var(--gst-color)',      label: 'GST',         emoji: '📋' },
};

/* ══════════════════════
   SAMPLE FLASHCARDS
══════════════════════ */
const sampleCards = [
  // ── DIRECT TAX ──
  { id:'t1', category:'tax', question:'What is the basic exemption limit for income tax for individuals below 60 years?', answer:'₹2,50,000 per year is the basic exemption limit under the old tax regime.' },
  { id:'t2', category:'tax', question:'What is TDS?', answer:'Tax Deducted at Source — tax deducted at the point of payment by the payer and deposited to the government on the payee\'s behalf.' },
  { id:'t3', category:'tax', question:'What is the due date for filing ITR for salaried individuals?', answer:'31st July of the assessment year (e.g., 31 July 2024 for FY 2023-24).' },
  { id:'t4', category:'tax', question:'Under which section is HRA exempt?', answer:'Section 10(13A) of the Income Tax Act, subject to conditions.' },

  // ── LAW ──
  { id:'l1', category:'law', question:'What is the doctrine of ultra vires?', answer:'An act by a company beyond the scope of its Memorandum of Association is void and cannot be ratified even by all shareholders.' },
  { id:'l2', category:'law', question:'Define "consideration" in contract law.', answer:'Consideration is something of value exchanged between parties — it is essential for a valid contract under the Indian Contract Act, 1872.' },
  { id:'l3', category:'law', question:'What is the limitation period to file a suit for recovery of money?', answer:'3 years from the date the debt becomes due, under the Limitation Act, 1963.' },

  // ── ACCOUNTS ──
  { id:'a1', category:'accounts', question:'What is the accounting equation?', answer:'Assets = Liabilities + Owner\'s Equity. This is the foundation of double-entry bookkeeping.' },
  { id:'a2', category:'accounts', question:'What is the difference between capital expenditure and revenue expenditure?', answer:'Capital expenditure creates future benefits (assets), while revenue expenditure is consumed in the current period (expenses).' },
  { id:'a3', category:'accounts', question:'Define depreciation.', answer:'Depreciation is the systematic allocation of the cost of a tangible asset over its useful life, reflecting wear and tear.' },

  // ── GST ──
  { id:'g1', category:'gst', question:'What are the components of GST in India?', answer:'CGST (Central GST), SGST (State GST), IGST (Integrated GST for inter-state), and UTGST (Union Territory GST).' },
  { id:'g2', category:'gst', question:'What is the threshold limit for GST registration?', answer:'₹20 lakh aggregate turnover for services; ₹40 lakh for goods (for most states). Special category states have ₹10 lakh limit.' },
  { id:'g3', category:'gst', question:'What is the due date for filing GSTR-3B?', answer:'20th of the following month for monthly filers. Quarterly filers (QRMP) have different deadlines.' },
  { id:'g4', category:'gst', question:'What is Input Tax Credit (ITC)?', answer:'ITC allows businesses to reduce the GST paid on purchases from the GST payable on sales, avoiding cascading taxes.' },
];

/* ══════════════════════
   INIT
══════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  allCards = [...sampleCards, ...loadedFileCards()];
  renderCards();
  updateStats();
  setupDragDrop();
  setupFileInput();
  setupSearch();
  setupCategoryBtns();
  setupTheme();
  setupHamburger();
  setupKeyboardShortcuts();
  setupBackToTop();
  animateStats();
});

function loadedFileCards() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_CARDS) || '[]'); }
  catch { return []; }
}

function loadFromStorage() {
  try {
    uploadedFiles = JSON.parse(localStorage.getItem(STORAGE_KEY_FILES) || '[]');
    renderUploadedList();
  } catch { uploadedFiles = []; }
}

/* ══════════════════════
   STAT ANIMATION
══════════════════════ */
function animateStats() {
  const targets = {
    statCards: allCards.length,
    statFiles: uploadedFiles.length,
  };
  Object.entries(targets).forEach(([id, end]) => {
    const el = document.getElementById(id);
    if (!el || end === 0) { if (el) el.textContent = '0'; return; }
    let start = 0;
    const step = Math.ceil(end / 30);
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      el.textContent = start;
      if (start >= end) clearInterval(timer);
    }, 30);
  });
}

function updateStats() {
  document.getElementById('statCards').textContent = allCards.length;
  document.getElementById('statFiles').textContent = uploadedFiles.length;
}

/* ══════════════════════
   THEME
══════════════════════ */
function setupTheme() {
  const saved = localStorage.getItem('plh_theme') || 'dark';
  setTheme(saved);
  document.getElementById('themeToggle').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    setTheme(cur === 'dark' ? 'light' : 'dark');
  });
}

function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('plh_theme', t);
  document.querySelector('.theme-icon').textContent = t === 'dark' ? '☀' : '☽';
}

/* ══════════════════════
   HAMBURGER NAV
══════════════════════ */
function setupHamburger() {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('mainNav');
  btn.addEventListener('click', () => {
    const isOpen = btn.classList.toggle('open');
    nav.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
  });
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.site-header')) closeNav();
  });
}

function closeNav() {
  document.getElementById('hamburger')?.classList.remove('open');
  document.getElementById('mainNav')?.classList.remove('open');
  document.getElementById('hamburger')?.setAttribute('aria-expanded', 'false');
}

/* ══════════════════════
   BACK TO TOP
══════════════════════ */
function setupBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  const observer = new IntersectionObserver(
    ([entry]) => btn.classList.toggle('visible', !entry.isIntersecting),
    { rootMargin: '-200px' }
  );
  const hero = document.querySelector('.hero');
  if (hero) observer.observe(hero);
}

/* ══════════════════════
   CATEGORY FILTER
══════════════════════ */
function setupCategoryBtns() {
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-pressed');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      activeCategory = btn.dataset.cat;
      renderCards(currentQuery);
      document.getElementById('flashcards').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ══════════════════════
   RENDER FLASHCARDS
══════════════════════ */
function renderCards(query = '') {
  currentQuery = query;
  const grid    = document.getElementById('flashcardGrid');
  const noCards = document.getElementById('noCards');
  const fcCount = document.getElementById('fcCount');

  const filteredCards = allCards.filter(c => {
    const catOk = activeCategory === 'all' || c.category === activeCategory;
    if (!catOk) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      c.question.toLowerCase().includes(q) ||
      c.answer.toLowerCase().includes(q) ||
      c.category.includes(q)
    );
  });

  const filteredFiles = uploadedFiles.filter(f => {
    const catOk = activeCategory === 'all' || f.category === activeCategory;
    if (!catOk) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return f.name.toLowerCase().includes(q) || f.category.includes(q);
  });

  const total = filteredCards.length + filteredFiles.length;

  if (total === 0) {
    grid.innerHTML = '';
    noCards.style.display = 'flex';
    if (fcCount) fcCount.textContent = '0 cards found';
    return;
  }
  noCards.style.display = 'none';
  if (fcCount) fcCount.textContent = `${total} card${total !== 1 ? 's' : ''}`;

  grid.innerHTML =
    filteredCards.map(c => buildFlashcardHTML(c, query)).join('') +
    filteredFiles.map(f => buildFileCardHTML(f)).join('');

  // Flip on click / keyboard
  grid.querySelectorAll('.flashcard').forEach(el => {
    el.addEventListener('click', () => el.classList.toggle('flipped'));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.classList.toggle('flipped');
      }
    });
  });
}

function shuffleCards() {
  allCards = [...allCards].sort(() => Math.random() - 0.5);
  renderCards(currentQuery);
  showToast('Cards shuffled!');
}

function highlight(text, query) {
  if (!query) return text;
  const re = new RegExp(`(${escapeReg(query)})`, 'gi');
  return text.replace(re, '<mark class="highlight">$1</mark>');
}
function escapeReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function buildFlashcardHTML(c, query) {
  const meta = CAT_META[c.category] || { color: 'var(--accent)', label: c.category };
  return `
  <div class="flashcard" role="listitem button" tabindex="0" aria-label="Flashcard: ${escapeAttr(c.question)}">
    <div class="flashcard-inner">
      <div class="flashcard-front">
        <div class="fc-top">
          <span class="fc-category" style="color:${meta.color}">${meta.label.toUpperCase()}</span>
          <span class="fc-flip-hint">TAP TO REVEAL</span>
        </div>
        <div class="fc-question">${highlight(c.question, query)}</div>
        <div class="fc-bottom">
          <span class="fc-dot" style="color:${meta.color}"></span>
          <span class="fc-dot" style="color:${meta.color}; opacity:0.2"></span>
          <span class="fc-dot" style="color:${meta.color}; opacity:0.1"></span>
        </div>
      </div>
      <div class="flashcard-back">
        <div class="fc-top">
          <span class="fc-answer-label">ANSWER</span>
          <span class="fc-flip-hint" style="color:${meta.color}">TAP TO FLIP BACK</span>
        </div>
        <div class="fc-answer">${highlight(c.answer, query)}</div>
        <div class="fc-bottom">
          <span class="fc-dot" style="color:${meta.color}"></span>
          <span class="fc-dot" style="color:${meta.color}; opacity:0.2"></span>
          <span class="fc-dot" style="color:${meta.color}; opacity:0.1"></span>
        </div>
      </div>
    </div>
  </div>`;
}

function buildFileCardHTML(f) {
  const meta = CAT_META[f.category] || { color: 'var(--accent)', label: f.category };
  return `
  <div class="file-card" role="listitem">
    <div class="file-card-icon">📄</div>
    <div class="file-card-name">${escapeHTML(f.name)}</div>
    <div class="file-card-meta" style="color:${meta.color}">${meta.label.toUpperCase()}</div>
    <div class="file-card-actions">
      <button class="btn-primary" style="font-size:.8rem;padding:7px 18px"
              onclick="openFileModal('${f.id}')" aria-label="Open ${escapeAttr(f.name)}">
        Open ↗
      </button>
      <button class="btn-ghost" onclick="deleteFile('${f.id}')" aria-label="Delete ${escapeAttr(f.name)}">
        Delete
      </button>
    </div>
  </div>`;
}

function escapeHTML(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escapeAttr(str) {
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ══════════════════════
   SEARCH
══════════════════════ */
function setupSearch() {
  const input = document.getElementById('globalSearch');
  if (!input) return;
  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => renderCards(input.value.trim()), 220);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') runSearch();
    if (e.key === 'Escape') { input.value = ''; renderCards(''); }
  });
}

function runSearch() {
  const q = document.getElementById('globalSearch').value.trim();
  renderCards(q);
  if (q) document.getElementById('flashcards').scrollIntoView({ behavior: 'smooth' });
}

/* ══════════════════════
   FILE UPLOAD
══════════════════════ */
function setupFileInput() {
  document.getElementById('fileInput').addEventListener('change', e => handleFiles(e.target.files));
}

function setupDragDrop() {
  const zone = document.getElementById('uploadArea');
  if (!zone) return;

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', e => {
    if (!zone.contains(e.relatedTarget)) zone.classList.remove('drag-over');
  });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });
  zone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      document.getElementById('fileInput').click();
    }
  });
}

function handleFiles(files) {
  const category = document.getElementById('uploadCategory').value;
  let added = 0;

  Array.from(files).forEach(file => {
    if (!file.name.endsWith('.html')) {
      showToast(`"${file.name}" is not an HTML file.`, 'error'); return;
    }
    if (uploadedFiles.find(f => f.name === file.name)) {
      showToast(`"${file.name}" already uploaded.`, 'error'); return;
    }

    const url = URL.createObjectURL(file);
    const id  = 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    uploadedFiles.push({ id, name: file.name, url, category });
    added++;
    parseHTMLFlashcards(file, category, id);
  });

  if (added > 0) {
    saveFiles();
    renderUploadedList();
    updateStats();
    showToast(`${added} file${added > 1 ? 's' : ''} uploaded!`);
  }
}

function parseHTMLFlashcards(file, category, fileId) {
  const reader = new FileReader();
  reader.onload = e => {
    const doc = new DOMParser().parseFromString(e.target.result, 'text/html');
    const questions = doc.querySelectorAll('[data-question], .question, .fc-question, h2, h3');
    const answers   = doc.querySelectorAll('[data-answer], .answer, .fc-answer, p');
    if (questions.length && answers.length) {
      const count = Math.min(questions.length, answers.length);
      for (let i = 0; i < count; i++) {
        const q = questions[i]?.textContent?.trim();
        const a = answers[i]?.textContent?.trim();
        if (q && a && q !== a) {
          allCards.push({ id: `file_${fileId}_${i}`, category, question: q, answer: a, source: 'file', fileName: file.name });
        }
      }
      saveCards(); renderCards(currentQuery); updateStats();
    }
  };
  reader.readAsText(file);
}

function saveFiles() {
  const meta = uploadedFiles.map(f => ({ id: f.id, name: f.name, category: f.category }));
  try { localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(meta)); } catch(e) {}
}

function saveCards() {
  const toSave = allCards.filter(c => c.source === 'file');
  try { localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(toSave)); } catch(e) {}
}

function renderUploadedList() {
  const list = document.getElementById('uploadedList');
  if (!list) return;
  if (!uploadedFiles.length) { list.innerHTML = ''; return; }
  list.innerHTML = uploadedFiles.map(f => {
    const meta = CAT_META[f.category] || { label: f.category };
    return `
    <div class="uploaded-item">
      <span aria-hidden="true">📄</span>
      <span class="uploaded-item-name">${escapeHTML(f.name)}</span>
      <span class="uploaded-item-cat">${meta.label || f.category}</span>
      ${f.url ? `<button class="btn-ghost" onclick="openFileModal('${f.id}')" style="font-size:.78rem" aria-label="View ${escapeAttr(f.name)}">View</button>` : ''}
      <button class="uploaded-item-del" onclick="deleteFile('${f.id}')" aria-label="Remove ${escapeAttr(f.name)}">✕ Remove</button>
    </div>`;
  }).join('');
}

function deleteFile(id) {
  uploadedFiles = uploadedFiles.filter(f => f.id !== id);
  allCards      = allCards.filter(c => !c.id?.startsWith(`file_${id}`));
  saveFiles(); saveCards(); renderUploadedList(); renderCards(currentQuery); updateStats();
  showToast('File removed.');
}

function openFileModal(id) {
  const f = uploadedFiles.find(f => f.id === id);
  if (!f?.url) { showToast('File not available. Re-upload the file.', 'error'); return; }
  document.getElementById('modalFrame').src = f.url;
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.add('open');
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); }, { once: true });
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  setTimeout(() => { document.getElementById('modalFrame').src = ''; }, 300);
}

/* ══════════════════════
   KEYBOARD SHORTCUTS
══════════════════════ */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    // Escape: close modal or clear search
    if (e.key === 'Escape') {
      if (document.getElementById('modalOverlay').classList.contains('open')) {
        closeModal();
      }
    }
    // / : focus search
    const tag = document.activeElement.tagName;
    if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
      e.preventDefault();
      document.getElementById('globalSearch')?.focus();
    }
  });
}

/* ══════════════════════
   TOAST
══════════════════════ */
let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}
