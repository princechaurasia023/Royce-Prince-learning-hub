/* =============================================
   PRINCE LEARNING HUB — MAIN JS
   ============================================= */

(function () {
  'use strict';

  /* ─── STATE ──────────────────────────────── */
  const state = {
    theme: localStorage.getItem('plh-theme') || 'light',
    activeCategory: 'all',
    flashcards: [],
    uploadedFiles: JSON.parse(localStorage.getItem('plh-files') || '[]'),
    chatHistory: [],
    streakCount: parseInt(localStorage.getItem('plh-streak') || '0'),
    streakDays: JSON.parse(localStorage.getItem('plh-streak-days') || '[]'),
  };

  /* ─── SAMPLE FLASHCARDS DATA ─────────────── */
  const SAMPLE_FLASHCARDS = [
    { id: 1, chapter: 'Income Tax Basics', q: 'What is the basic exemption limit for an Individual below 60 years for AY 2025-26?', a: 'The basic exemption limit is ₹2,50,000 per year under the old tax regime. Under the new tax regime, the rebate u/s 87A makes income up to ₹12,00,000 effectively tax-free.', cat: 'tax', tag: 'Slab Rates' },
    { id: 2, chapter: 'Income Tax Basics', q: 'What is the surcharge rate applicable when total income exceeds ₹50 lakhs but does not exceed ₹1 crore?', a: 'Surcharge rate is 10% of tax payable when income exceeds ₹50L but ≤ ₹1 Cr. For income > ₹1 Cr but ≤ ₹2 Cr: 15%. Marginal relief is available.', cat: 'tax', tag: 'Surcharge' },
    { id: 3, chapter: 'Heads of Income', q: 'Name the five heads of income under the Income Tax Act, 1961.', a: '1. Salaries (Sec 15-17)\n2. House Property (Sec 22-27)\n3. Business/Profession (Sec 28-44)\n4. Capital Gains (Sec 45-55A)\n5. Other Sources (Sec 56-59)', cat: 'tax', tag: 'Basics' },
    { id: 4, chapter: 'GST Fundamentals', q: 'What is the threshold limit for GST registration for a normal taxpayer (goods)?', a: 'For supply of goods: ₹40 lakhs aggregate turnover (₹20 lakhs for special category states). For services: ₹20 lakhs (₹10 lakhs for special category states).', cat: 'gst', tag: 'Registration' },
    { id: 5, chapter: 'GST Fundamentals', q: 'What is the composition scheme limit under GST and what are the tax rates?', a: 'Limit: ₹1.5 Cr aggregate turnover. Rates: Manufacturers & Traders: 1% (0.5% CGST + 0.5% SGST). Restaurants: 5%. Service providers (10-17 lakh turnover): 6%.', cat: 'gst', tag: 'Composition' },
    { id: 6, chapter: 'Company Law', q: 'What is the minimum number of members required to form a Private Limited Company?', a: 'Minimum 2 members (shareholders) are required to form a Private Limited Company. Maximum limit is 200 members. A One Person Company (OPC) can be formed by a single member.', cat: 'law', tag: 'Formation' },
    { id: 7, chapter: 'Company Law', q: 'What is the time limit for holding the first Annual General Meeting (AGM) of a company?', a: 'First AGM must be held within 9 months from the close of the first financial year. Subsequent AGMs must be held within 6 months from close of financial year, with a gap of not more than 15 months between two AGMs.', cat: 'law', tag: 'Meetings' },
    { id: 8, chapter: 'Partnership Accounts', q: 'What is the treatment of interest on capital in the absence of a Partnership Deed?', a: 'In the absence of a Partnership Deed, NO interest is payable on capital as per the Indian Partnership Act, 1932. The Act provides for equal profit sharing, no salary, no commission, and no interest on capital.', cat: 'acc', tag: 'Partnership' },
    { id: 9, chapter: 'Depreciation', q: 'What is the rate of depreciation on a Motor Car (not used for hiring) under the Income Tax Act?', a: 'Rate of depreciation on Motor Car (other than those used for hire) is 15% under the WDV method. For new Electric Vehicles, an additional 15% depreciation is available in the first year (total 30%).', cat: 'tax', tag: 'Depreciation' },
    { id: 10, chapter: 'Input Tax Credit', q: 'What are the conditions for availing Input Tax Credit (ITC) under GST?', a: '1. Registered person\n2. Tax invoice/debit note received\n3. Goods/services received\n4. Tax actually paid to Government\n5. Return filed u/s 39\n6. Not blocked credit u/s 17(5)', cat: 'gst', tag: 'ITC' },
    { id: 11, chapter: 'Capital Gains', q: 'What is the holding period for Long Term Capital Gain on listed equity shares?', a: 'For listed equity shares and equity-oriented mutual funds: Holding period > 12 months = LTCG. Rate: 12.5% (after ₹1.25L exemption) under new regime (Finance Act 2024). No indexation benefit.', cat: 'tax', tag: 'LTCG' },
    { id: 12, chapter: 'Company Audit', q: 'Who appoints the first auditor of a company?', a: 'The Board of Directors must appoint the first auditor within 30 days of incorporation. If Board fails, members appoint within 90 days. First auditor holds office till conclusion of the first AGM.', cat: 'acc', tag: 'Audit' },
  ];

  /* ─── DOM REFS ───────────────────────────── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ─── THEME ──────────────────────────────── */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    state.theme = t;
    localStorage.setItem('plh-theme', t);
    const btn = $('#themeToggle');
    if (btn) btn.innerHTML = t === 'dark'
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }
  applyTheme(state.theme);
  document.getElementById('themeToggle')?.addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  });

  /* ─── MOBILE NAV ─────────────────────────── */
  const hamburger = $('#hamburger');
  const mobileNav = $('#mobileNav');
  hamburger?.addEventListener('click', () => {
    mobileNav?.classList.toggle('open');
    const open = mobileNav?.classList.contains('open');
    hamburger.setAttribute('aria-expanded', open);
  });
  document.addEventListener('click', e => {
    if (!hamburger?.contains(e.target) && !mobileNav?.contains(e.target)) {
      mobileNav?.classList.remove('open');
    }
  });
  $$('.mobile-nav__link').forEach(link => {
    link.addEventListener('click', () => mobileNav?.classList.remove('open'));
  });

  /* ─── SEARCH ─────────────────────────────── */
  const searchOverlay = $('#searchOverlay');
  const searchInput = $('#searchInput');
  const searchResults = $('#searchResults');

  $$('[data-search-open]').forEach(btn => {
    btn.addEventListener('click', () => openSearch());
  });
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape') closeSearch();
  });
  searchOverlay?.addEventListener('click', e => {
    if (e.target === searchOverlay) closeSearch();
  });
  searchInput?.addEventListener('input', debounce(handleSearch, 150));

  function openSearch() {
    searchOverlay?.classList.add('open');
    setTimeout(() => searchInput?.focus(), 100);
    renderSearchResults('');
  }
  function closeSearch() {
    searchOverlay?.classList.remove('open');
    if (searchInput) searchInput.value = '';
  }
  function handleSearch() {
    renderSearchResults(searchInput?.value || '');
  }
  function renderSearchResults(q) {
    if (!searchResults) return;
    const items = [
      ...SAMPLE_FLASHCARDS.filter(fc =>
        fc.q.toLowerCase().includes(q.toLowerCase()) ||
        fc.chapter.toLowerCase().includes(q.toLowerCase()) ||
        fc.cat.toLowerCase().includes(q.toLowerCase())
      ).slice(0, 5).map(fc => ({ icon: '📚', label: fc.chapter, sub: fc.q.slice(0, 60) + '…', action: () => { scrollToSection('flashcards'); closeSearch(); } })),
      ...(q ? [] : [
        { icon: '📊', label: 'Tax Flashcards', sub: 'Income Tax chapter-wise cards', action: () => filterCategory('tax') },
        { icon: '⚖️', label: 'Law Flashcards', sub: 'Company Law & Partnership', action: () => filterCategory('law') },
        { icon: '🤖', label: 'AI Assistant', sub: 'Ask any CA Inter question', action: () => scrollToSection('ai') },
        { icon: '⬆️', label: 'Upload Files', sub: 'Upload your HTML flashcards', action: () => scrollToSection('upload') },
      ]),
    ];
    searchResults.innerHTML = items.length
      ? items.map(it => `
        <div class="search-result-item" tabindex="0">
          <div class="search-result-item__icon">${it.icon}</div>
          <div>
            <div class="search-result-item__label">${highlight(it.label, q)}</div>
            <div class="search-result-item__sub">${it.sub}</div>
          </div>
        </div>`).join('')
      : `<div class="empty-state" style="padding:24px"><div class="empty-state__text">No results for "${q}"</div></div>`;
    $$('.search-result-item', searchResults).forEach((el, i) => {
      el.addEventListener('click', () => { items[i]?.action?.(); closeSearch(); });
    });
  }
  function highlight(text, q) {
    if (!q) return text;
    return text.replace(new RegExp(`(${q})`, 'gi'), '<mark style="background:var(--accent-soft);color:var(--accent);border-radius:2px">$1</mark>');
  }

  /* ─── STATS COUNTERS ─────────────────────── */
  function updateStats() {
    const el = id => document.getElementById(id);
    if (el('statFlashcards')) el('statFlashcards').textContent = SAMPLE_FLASHCARDS.length + state.uploadedFiles.length;
    if (el('statFiles')) el('statFiles').textContent = state.uploadedFiles.length;
    if (el('statCategories')) el('statCategories').textContent = 4;
    if (el('heroFlashcards')) el('heroFlashcards').textContent = SAMPLE_FLASHCARDS.length + state.uploadedFiles.length;
    if (el('heroFiles')) el('heroFiles').textContent = state.uploadedFiles.length;
  }
  function animateNumber(el, target) {
    let current = 0; const step = target / 40;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current);
      if (current >= target) clearInterval(timer);
    }, 20);
  }
  function runCounters() {
    $$('[data-count]').forEach(el => {
      animateNumber(el, parseInt(el.dataset.count));
    });
  }
  new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { runCounters(); } });
  }, { threshold: .3 }).observe(document.querySelector('.stats-strip') || document.body);

  /* ─── CATEGORIES ─────────────────────────── */
  function filterCategory(cat) {
    state.activeCategory = cat;
    $$('.category-card').forEach(el => el.classList.toggle('active', el.dataset.cat === cat));
    $$('.filter-tab').forEach(el => el.classList.toggle('active', el.dataset.cat === cat));
    renderFlashcards();
    if (cat !== 'all') scrollToSection('flashcards');
  }
  $$('.category-card').forEach(el => el.addEventListener('click', () => filterCategory(el.dataset.cat)));
  $$('.filter-tab').forEach(el => el.addEventListener('click', () => filterCategory(el.dataset.cat)));

  /* ─── FLASHCARDS ─────────────────────────── */
  function renderFlashcards() {
    const grid = $('#flashcardGrid');
    if (!grid) return;
    const cat = state.activeCategory;
    const cards = SAMPLE_FLASHCARDS.filter(fc => cat === 'all' || fc.cat === cat);
    if (!cards.length) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📭</div><div class="empty-state__text">No flashcards for this category yet</div><div class="empty-state__sub">Upload your HTML flashcard files or select a different category</div></div>`;
      return;
    }
    grid.innerHTML = cards.map(fc => `
      <div class="flashcard flashcard--${fc.cat}" data-id="${fc.id}">
        <div class="flashcard__chapter">
          <span class="flashcard__chapter-dot"></span>
          ${fc.chapter}
        </div>
        <div class="flashcard__q">${fc.q}</div>
        <div class="flashcard__answer">${fc.a.replace(/\n/g, '<br>')}</div>
        <div class="flashcard__footer">
          <span class="flashcard__tag">${fc.tag}</span>
          <span class="flashcard__reveal-hint">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Tap to reveal
          </span>
        </div>
      </div>`).join('');
    $$('.flashcard', grid).forEach(el => {
      el.addEventListener('click', () => {
        const wasRevealed = el.classList.contains('revealed');
        el.classList.toggle('revealed');
        const hint = el.querySelector('.flashcard__reveal-hint');
        if (hint) hint.textContent = wasRevealed ? '👁 Tap to reveal' : '👁 Click to hide';
      });
    });
  }
  renderFlashcards();

  /* ─── UPLOAD ─────────────────────────────── */
  const uploadArea = $('#uploadArea');
  const fileInput = $('#fileInput');
  const fileList = $('#uploadedFileList');

  uploadArea?.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('dragover'); });
  uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
  uploadArea?.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
  fileInput?.addEventListener('change', e => handleFiles(e.target.files));

  function handleFiles(files) {
    const cat = $('#uploadCategory')?.value || 'tax';
    [...files].forEach(file => {
      if (!file.name.endsWith('.html')) {
        toast(`❌ Only .html files allowed`, 'error'); return;
      }
      if (state.uploadedFiles.find(f => f.name === file.name)) {
        toast(`⚠️ "${file.name}" already uploaded`); return;
      }
      state.uploadedFiles.push({ name: file.name, cat, size: file.size, ts: Date.now() });
      toast(`✅ "${file.name}" uploaded successfully`, 'success');
    });
    localStorage.setItem('plh-files', JSON.stringify(state.uploadedFiles));
    renderUploadedFiles();
    updateStats();
  }
  function renderUploadedFiles() {
    if (!fileList) return;
    if (!state.uploadedFiles.length) { fileList.innerHTML = ''; return; }
    fileList.innerHTML = state.uploadedFiles.map((f, i) => `
      <div class="uploaded-file-item">
        <span class="uploaded-file-item__icon">📄</span>
        <span class="uploaded-file-item__name">${f.name}</span>
        <span class="uploaded-file-item__cat">${f.cat.toUpperCase()}</span>
        <button class="uploaded-file-item__del" data-idx="${i}" title="Remove">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
      </div>`).join('');
    $$('[data-idx]', fileList).forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.idx);
        state.uploadedFiles.splice(i, 1);
        localStorage.setItem('plh-files', JSON.stringify(state.uploadedFiles));
        renderUploadedFiles();
        updateStats();
        toast('🗑️ File removed');
      });
    });
  }
  renderUploadedFiles();

  /* ─── AI ASSISTANT ───────────────────────── */
  const chatMessages = $('#chatMessages');
  const chatInput = $('#chatInput');
  const chatSendBtn = $('#chatSendBtn');

  function addMessage(text, role = 'ai') {
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const div = document.createElement('div');
    div.className = `chat-msg chat-msg--${role}`;
    div.innerHTML = `
      <div class="chat-msg__avatar">${role === 'ai' ? '◈' : '👤'}</div>
      <div>
        <div class="chat-msg__bubble">${text}</div>
        <div class="chat-msg__time">${now}</div>
      </div>`;
    chatMessages?.appendChild(div);
    chatMessages?.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
    state.chatHistory.push({ role: role === 'ai' ? 'assistant' : 'user', content: text });
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'chat-msg chat-msg--ai typing-msg';
    div.innerHTML = `<div class="chat-msg__avatar">◈</div><div class="chat-msg__bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
    chatMessages?.appendChild(div);
    chatMessages?.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
    return div;
  }

  async function sendMessage() {
    const text = chatInput?.value.trim();
    if (!text) return;
    chatInput.value = '';
    chatInput.style.height = 'auto';
    addMessage(text, 'user');
    const typing = showTyping();
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a friendly and knowledgeable CA Inter exam assistant for Prince Learning Hub. You help students with Income Tax, GST, Company Law, and Accounts (Advanced Accounts) for the CA Intermediate May 2026 exam. Give concise, exam-focused answers. Use simple language and mention relevant sections when applicable. Respond in a helpful, encouraging tone. If answering in Hindi/Hinglish is more natural for the question, you may do so.`,
          messages: state.chatHistory.filter(m => m.role !== 'system').slice(-10),
        }),
      });
      typing.remove();
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response. Please try again.';
      addMessage(reply, 'ai');
    } catch (err) {
      typing.remove();
      addMessage('I encountered an error. Please check your connection and try again. 🔄', 'ai');
    }
  }

  chatSendBtn?.addEventListener('click', sendMessage);
  chatInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  chatInput?.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  $$('.ai-prompt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (chatInput) { chatInput.value = btn.textContent.trim(); chatInput.focus(); }
    });
  });

  /* ─── STREAK ─────────────────────────────── */
  function initStreak() {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const lastVisit = localStorage.getItem('plh-last-visit');
    if (!lastVisit) {
      state.streakCount = 1;
    } else if (lastVisit === yesterday) {
      state.streakCount += 1;
    } else if (lastVisit !== today) {
      state.streakCount = 1;
    }
    localStorage.setItem('plh-last-visit', today);
    localStorage.setItem('plh-streak', state.streakCount);
    const el = document.getElementById('streakCount');
    if (el) el.textContent = state.streakCount;
  }
  initStreak();

  /* ─── SCROLL SPY ─────────────────────────── */
  const sections = $$('section[id]');
  const navLinks = $$('.nav__link[href^="#"]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { threshold: .35, rootMargin: '-60px 0px 0px 0px' });
  sections.forEach(s => obs.observe(s));

  /* ─── SMOOTH SCROLL ──────────────────────── */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) { const top = el.getBoundingClientRect().top + window.scrollY - 80; window.scrollTo({ top, behavior: 'smooth' }); }
  }

  /* ─── TOAST ──────────────────────────────── */
  function toast(msg, type = 'default') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => t.remove(), 300);
    }, 3000);
  }

  /* ─── ANIMATE ON SCROLL ──────────────────── */
  const aosObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; }
    });
  }, { threshold: .1 });
  document.querySelectorAll('.section').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity .5s var(--ease-out-expo), transform .5s var(--ease-out-expo)';
    aosObs.observe(el);
  });

  /* ─── UTILS ──────────────────────────────── */
  function debounce(fn, ms) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }
  function id(i) { return document.getElementById(i); }

  updateStats();
   setTimeout(()=>{
document.getElementById("virtualBanner").style.display="none";
},10000);
function closeBanner(){
document.getElementById("virtualBanner").style.display="none";
}
// Dark Mode Toggle
const themeToggle = document.getElementById("themeToggle");

if(themeToggle){
themeToggle.addEventListener("click",()=>{
const currentTheme = document.documentElement.getAttribute("data-theme");

if(currentTheme === "dark"){
document.documentElement.removeAttribute("data-theme");
}else{
document.documentElement.setAttribute("data-theme","dark");
}
});
}
 document.addEventListener("DOMContentLoaded", function(){

let time = 1500;
let interval;

const timer = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

function updateTimer(){
let minutes = Math.floor(time/60);
let seconds = time%60;

timer.innerHTML =
minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

startBtn.addEventListener("click",()=>{
clearInterval(interval);
interval = setInterval(()=>{
time--;
updateTimer();

if(time <= 0){
clearInterval(interval);
}
},1000);
});

pauseBtn.addEventListener("click",()=>{
clearInterval(interval);
});

resetBtn.addEventListener("click",()=>{
clearInterval(interval);
time = 1500;
updateTimer();
});

updateTimer();

});
