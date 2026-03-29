/* ═══════════════════════════════════════
   PRINCE LEARNING HUB · script.js
═══════════════════════════════════════ */

/* ══════════════════════
   STATE
══════════════════════ */
let allCards   = [];   // { id, question, answer, category, source:'builtin'|'file', fileName, fileURL }
let uploadedFiles = []; // { name, url, category, id }
let activeCategory = 'all';
let aiHistory = [];

const STORAGE_KEY_FILES   = 'plh_files';
const STORAGE_KEY_CARDS   = 'plh_cards';
const AI_ENDPOINT = 'https://api.anthropic.com/v1/messages';

/* ══════════════════════
   BUILT-IN SAMPLE FLASHCARDS
══════════════════════ */
const sampleCards = [
  // ── TAX ──
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
  allCards = [...sampleCards, ...loadedCards()];
  renderCards();
  updateStats();
  setupDragDrop();
  setupFileInput();
  setupSearch();
  setupCategoryBtns();
  setupTheme();
  setupHamburger();
  setupAIInput();
});

function loadedCards() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_CARDS) || '[]');
  } catch { return []; }
}

function loadFromStorage() {
  try {
    uploadedFiles = JSON.parse(localStorage.getItem(STORAGE_KEY_FILES) || '[]');
    renderUploadedList();
  } catch { uploadedFiles = []; }
}

/* ══════════════════════
   THEME TOGGLE
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
    btn.classList.toggle('open');
    nav.classList.toggle('open');
  });
}
function closeNav() {
  document.getElementById('hamburger').classList.remove('open');
  document.getElementById('mainNav').classList.remove('open');
}

/* ══════════════════════
   STATS
══════════════════════ */
function updateStats() {
  document.getElementById('statCards').textContent = allCards.length;
  document.getElementById('statFiles').textContent = uploadedFiles.length;
}

/* ══════════════════════
   CATEGORY FILTER
══════════════════════ */
function setupCategoryBtns() {
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
      renderCards();
      // Smooth scroll to flashcards
      document.getElementById('flashcards').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ══════════════════════
   RENDER FLASHCARDS
══════════════════════ */
function renderCards(query = '') {
  const grid = document.getElementById('flashcardGrid');
  const noCards = document.getElementById('noCards');

  let filtered = allCards.filter(c => {
    const catOk = activeCategory === 'all' || c.category === activeCategory;
    if (!catOk) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return c.question.toLowerCase().includes(q) || c.answer.toLowerCase().includes(q) || c.category.includes(q);
  });

  // Also show file cards
  let fileFiltered = uploadedFiles.filter(f => {
    const catOk = activeCategory === 'all' || f.category === activeCategory;
    if (!catOk) return false;
    if (!query) return true;
    return f.name.toLowerCase().includes(query.toLowerCase()) || f.category.includes(query.toLowerCase());
  });

  if (!filtered.length && !fileFiltered.length) {
    grid.innerHTML = '';
    noCards.style.display = 'block';
    return;
  }
  noCards.style.display = 'none';

  const cardsHTML = filtered.map(c => buildFlashcardHTML(c, query)).join('');
  const filesHTML = fileFiltered.map(f => buildFileCardHTML(f)).join('');

  grid.innerHTML = cardsHTML + filesHTML;

  // Flip logic
  grid.querySelectorAll('.flashcard').forEach(el => {
    el.addEventListener('click', () => el.classList.toggle('flipped'));
  });
}

function highlight(text, query) {
  if (!query) return text;
  const re = new RegExp(`(${escapeReg(query)})`, 'gi');
  return text.replace(re, '<mark class="highlight">$1</mark>');
}
function escapeReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

const CAT_COLORS = { tax:'#c9a96e', law:'#6e9ec9', accounts:'#81b29a', gst:'#e07a5f' };

function buildFlashcardHTML(c, query) {
  const color = CAT_COLORS[c.category] || 'var(--accent)';
  return `
  <div class="flashcard" role="button" aria-label="Flashcard: ${c.question}" tabindex="0">
    <div class="flashcard-inner">
      <div class="flashcard-front">
        <div class="fc-category" style="color:${color}">${c.category.toUpperCase()}</div>
        <div class="fc-question">${highlight(c.question, query)}</div>
        <div class="fc-hint">Tap to reveal answer</div>
      </div>
      <div class="flashcard-back">
        <div class="fc-label" style="color:${color}">ANSWER</div>
        <div class="fc-answer">${highlight(c.answer, query)}</div>
        <div class="fc-label">Tap to flip back</div>
      </div>
    </div>
  </div>`;
}

function buildFileCardHTML(f) {
  const color = CAT_COLORS[f.category] || 'var(--accent)';
  return `
  <div class="file-card">
    <div class="file-card-icon">📄</div>
    <div class="file-card-name">${f.name}</div>
    <div class="file-card-meta" style="color:${color}">${f.category.toUpperCase()}</div>
    <div class="file-card-actions">
      <button class="btn-primary" style="font-size:.8rem;padding:7px 16px" onclick="openFileModal('${f.id}')">Open</button>
      <button class="btn-ghost" onclick="deleteFile('${f.id}')">Delete</button>
    </div>
  </div>`;
}

/* ══════════════════════
   SEARCH
══════════════════════ */
function setupSearch() {
  const input = document.getElementById('globalSearch');
  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      renderCards(input.value.trim());
    }, 250);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') runSearch();
  });
}

function runSearch() {
  const q = document.getElementById('globalSearch').value.trim();
  renderCards(q);
  document.getElementById('flashcards').scrollIntoView({ behavior: 'smooth' });
}

/* ══════════════════════
   FILE UPLOAD
══════════════════════ */
function setupFileInput() {
  const input = document.getElementById('fileInput');
  input.addEventListener('change', () => handleFiles(input.files));
}

function setupDragDrop() {
  const zone = document.getElementById('uploadArea');
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });
  zone.addEventListener('click', e => {
    if (!e.target.closest('button')) {
      document.getElementById('fileInput').click();
    }
  });
}

function handleFiles(files) {
  const category = document.getElementById('uploadCategory').value;
  let added = 0;

  Array.from(files).forEach(file => {
    if (!file.name.endsWith('.html')) {
      showToast(`"${file.name}" is not an HTML file.`, 'error');
      return;
    }
    const existing = uploadedFiles.find(f => f.name === file.name);
    if (existing) {
      showToast(`"${file.name}" is already uploaded.`, 'error');
      return;
    }

    const url = URL.createObjectURL(file);
    const id = 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
    uploadedFiles.push({ id, name: file.name, url, category });
    added++;

    // Try to extract Q&A from HTML if it follows the flashcard format
    parseHTMLFlashcards(file, category, id);
  });

  if (added > 0) {
    saveFiles();
    renderUploadedList();
    updateStats();
    showToast(`${added} file(s) uploaded successfully!`);
  }
}

function parseHTMLFlashcards(file, category, fileId) {
  const reader = new FileReader();
  reader.onload = e => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(e.target.result, 'text/html');

    // Look for common flashcard patterns in HTML
    const questions = doc.querySelectorAll('[data-question], .question, .fc-question, h2, h3');
    const answers   = doc.querySelectorAll('[data-answer], .answer, .fc-answer, p');

    if (questions.length && answers.length) {
      const count = Math.min(questions.length, answers.length);
      for (let i = 0; i < count; i++) {
        const q = questions[i]?.textContent?.trim();
        const a = answers[i]?.textContent?.trim();
        if (q && a && q !== a) {
          const card = {
            id: `file_${fileId}_${i}`,
            category,
            question: q,
            answer: a,
            source: 'file',
            fileName: file.name
          };
          allCards.push(card);
        }
      }
      saveCards();
      renderCards();
      updateStats();
    }
  };
  reader.readAsText(file);
}

function saveFiles() {
  // Store only metadata (not blob URLs, which don't persist across sessions)
  const meta = uploadedFiles.map(f => ({ id: f.id, name: f.name, category: f.category }));
  try { localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(meta)); } catch(e) {}
}

function saveCards() {
  const toSave = allCards.filter(c => c.source === 'file');
  try { localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(toSave)); } catch(e) {}
}

function renderUploadedList() {
  const list = document.getElementById('uploadedList');
  if (!uploadedFiles.length) { list.innerHTML = ''; return; }

  list.innerHTML = uploadedFiles.map(f => `
    <div class="uploaded-item">
      <span>📄</span>
      <span class="uploaded-item-name">${f.name}</span>
      <span class="uploaded-item-cat">${f.category}</span>
      ${f.url ? `<button class="btn-ghost" onclick="openFileModal('${f.id}')" style="font-size:.78rem">View</button>` : ''}
      <button class="uploaded-item-del" onclick="deleteFile('${f.id}')">✕ Remove</button>
    </div>
  `).join('');
}

function deleteFile(id) {
  uploadedFiles = uploadedFiles.filter(f => f.id !== id);
  allCards = allCards.filter(c => !c.id?.startsWith('file_' + id));
  saveFiles();
  saveCards();
  renderUploadedList();
  renderCards();
  updateStats();
  showToast('File removed.');
}

function openFileModal(id) {
  const f = uploadedFiles.find(f => f.id === id);
  if (!f || !f.url) { showToast('File URL is not available. Re-upload the file.', 'error'); return; }
  document.getElementById('modalFrame').src = f.url;
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('modalFrame').src = '';
}

/* ══════════════════════
   AI ASSISTANT
══════════════════════ */
function setupAIInput() {
  document.getElementById('aiInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI(); }
  });
}

async function sendAI() {
  const inputEl = document.getElementById('aiInput');
  const sendBtn = document.getElementById('aiSend');
  const msg = inputEl.value.trim();
  if (!msg) return;

  inputEl.value = '';
  sendBtn.disabled = true;

  appendMessage('user', msg);
  aiHistory.push({ role: 'user', content: msg });

  const typingId = appendTyping();

  try {
    const response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are a helpful educational assistant for Prince Learning Hub, specializing in Indian Tax Law, Business Law, Accounting, and GST. 
Answer concisely and clearly. Use examples where helpful. Format lists with dashes. 
Keep answers focused and educational. If a question is outside these domains, politely redirect.`,
        messages: aiHistory
      })
    });

    removeTyping(typingId);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const reply = data?.content?.map(b => b.text || '').join('') || '(No response)';

    appendMessage('bot', reply);
    aiHistory.push({ role: 'assistant', content: reply });

  } catch (err) {
    removeTyping(typingId);
    appendMessage('bot', `⚠️ Sorry, I couldn't connect to the AI service. Please check your internet connection and try again.\n\n*Error: ${err.message}*`);
  }

  sendBtn.disabled = false;
  inputEl.focus();
}

function appendMessage(role, text) {
  const box = document.getElementById('aiMessages');
  const div = document.createElement('div');
  div.className = `ai-msg ${role}`;

  const avatar = role === 'bot'
    ? `<div class="ai-avatar">◈</div>`
    : `<div class="ai-avatar" style="background:linear-gradient(135deg,#6e9ec9,#81b29a)">✦</div>`;

  // Basic markdown: bold, italic, newlines
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,.08);padding:1px 5px;border-radius:4px">$1</code>')
    .replace(/\n/g, '<br>');

  div.innerHTML = role === 'bot'
    ? `${avatar}<div class="ai-bubble">${html}</div>`
    : `<div class="ai-bubble">${html}</div>${avatar}`;

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}

let typingCounter = 0;
function appendTyping() {
  const id = 'typing_' + (++typingCounter);
  const box = document.getElementById('aiMessages');
  const div = document.createElement('div');
  div.className = 'ai-msg bot ai-typing';
  div.id = id;
  div.innerHTML = `
    <div class="ai-avatar">◈</div>
    <div class="ai-bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return id;
}

function removeTyping(id) {
  document.getElementById(id)?.remove();
}

/* ══════════════════════
   TOAST NOTIFICATIONS
══════════════════════ */
let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show${type === 'error' ? ' error' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('show'); }, 3500);
}

/* ══════════════════════
   KEYBOARD SHORTCUTS
══════════════════════ */
document.addEventListener('keydown', e => {
  // Escape closes modal
  if (e.key === 'Escape') closeModal();
  // / focuses search
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault();
    document.getElementById('globalSearch').focus();
  }
});

/* ══════════════════════
   KEYBOARD FLIP for flashcards
══════════════════════ */
document.getElementById('flashcardGrid').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    e.target.closest('.flashcard')?.classList.toggle('flipped');
  }
});
async function sendAI() {
const input = document.getElementById("aiInput");
const message = input.value;

if (!message) return;

const messages = document.getElementById("aiMessages");

// user message
messages.innerHTML += `
<div class="ai-msg user">
<div class="ai-bubble">${message}</div>
</div>
`;

input.value = "";

// loading
messages.innerHTML += `
<div class="ai-msg bot">
<div class="ai-bubble">Thinking...</div>
</div>
`;

const API_KEY = "AIzaSyALhebdXG0JpLPiMmoOLrsuCm6LjRw13J4";

try {
const response = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
{
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
contents: [{
parts: [{ text: message }]
}]
})
}
);

const data = await response.json();

const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

messages.innerHTML += `
<div class="ai-msg bot">
<div class="ai-bubble">${reply}</div>
</div>
`;

} catch (error) {
messages.innerHTML += `
<div class="ai-msg bot">
<div class="ai-bubble">⚠️ Error connecting AI</div>
</div>
`;
}
}
