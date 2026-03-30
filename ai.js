/* ═══════════════════════════════════════════════════
   PRINCE LEARNING HUB · ai.js
   AI Assistant — Gemini 1.5 Flash integration
═══════════════════════════════════════════════════ */

/* ══════════════════════
   SYSTEM PROMPT
══════════════════════ */
const GEMINI_SYSTEM = `You are a knowledgeable CA (Chartered Accountant) study assistant for Indian CA Inter students preparing for the May 2026 exam.

You specialise in:
- Direct Income Tax (CA Inter)
- GST (CA Inter)
- Company Law & Business Laws
- Indian Contract Act, Partnership Act, LLP Act
- Advanced Accounts & Accounting Standards
- Cost & Management Accounting
- CA Inter and CA Final ICAI syllabus, RTP, MTP, PYQs

Guidelines:
- Give clear, structured, concise answers
- Use bullet points and numbered lists where helpful
- Quote relevant sections, rules, or provisions where applicable
- Use ₹ for amounts; specify AY/FY where needed
- Highlight important terms in **bold**
- Keep answers exam-focused and practical

IMPORTANT: Responses are for study purposes only — not personal legal or financial advice.`;

/* ══════════════════════
   GEMINI KEY MANAGEMENT
══════════════════════ */
function saveGeminiKey() {
  const keyInput = document.getElementById('geminiKeyInput');
  const status   = document.getElementById('aiKeyStatus');
  if (!keyInput || !status) return;

  const key = keyInput.value.trim();

  if (!key) {
    setKeyStatus('err', '❌ Please paste your API key first.');
    return;
  }
  if (!key.startsWith('AI')) {
    setKeyStatus('err', '❌ Invalid key — Gemini keys start with "AIza…". Try again.');
    return;
  }

  localStorage.setItem('plh_gemini_key', key);
  setKeyStatus('ok', '✅ Connected! Ask your question below.');
}

function setKeyStatus(type, msg) {
  const status = document.getElementById('aiKeyStatus');
  if (!status) return;
  status.className = `ai-key-status ${type}`;
  status.textContent = msg;
}

/* ══════════════════════
   INIT ON LOAD
══════════════════════ */
window.addEventListener('load', () => {
  const saved = localStorage.getItem('plh_gemini_key');
  if (saved) {
    const input = document.getElementById('geminiKeyInput');
    if (input) input.value = saved;
    setKeyStatus('ok', '✅ API key loaded. AI is ready!');
  }

  // Enter key to send
  const aiInput = document.getElementById('aiInput');
  if (aiInput) {
    aiInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAI();
      }
    });
  }
});

/* ══════════════════════
   SEND MESSAGE
══════════════════════ */
async function sendAI() {
  const inputEl = document.getElementById('aiInput');
  const sendBtn = document.getElementById('aiSend');
  if (!inputEl || !sendBtn) return;

  const text = inputEl.value.trim();
  if (!text) return;

  const apiKey = localStorage.getItem('plh_gemini_key') ||
                 document.getElementById('geminiKeyInput')?.value.trim();

  if (!apiKey) {
    setKeyStatus('err', '❌ Enter and save your Gemini API key above first!');
    document.getElementById('geminiKeyInput')?.focus();
    return;
  }

  appendAIMsg('user', escapeAIHTML(text));
  inputEl.value    = '';
  sendBtn.disabled = true;

  const typingId = showTyping();

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: GEMINI_SYSTEM }] },
          contents: [{ role: 'user', parts: [{ text }] }],
          generationConfig: {
            temperature:     0.7,
            maxOutputTokens: 800,
          }
        })
      }
    );

    const data = await res.json();
    removeTyping(typingId);

    if (!res.ok) {
      const errMsg = data?.error?.message || 'Unknown API error';
      appendAIMsg('bot',
        `<strong>❌ API Error:</strong> ${escapeAIHTML(errMsg)}<br/>
        <small style="opacity:.7">Get a fresh key from
        <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--accent)">
        aistudio.google.com</a> and re-paste it above.</small>`
      );
      sendBtn.disabled = false;
      return;
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text
                  || 'Sorry, no response generated. Please try again.';
    appendAIMsg('bot', formatAIResponse(reply));

  } catch (err) {
    removeTyping(typingId);
    appendAIMsg('bot',
      `<strong>❌ Network error:</strong> ${escapeAIHTML(err.message)}<br/>
      <small style="opacity:.7">Check your internet connection and try again.</small>`
    );
  }

  sendBtn.disabled = false;
  inputEl.focus();
}

/* ══════════════════════
   MESSAGE HELPERS
══════════════════════ */
function appendAIMsg(role, html) {
  const box = document.getElementById('aiMessages');
  if (!box) return;

  const wrap = document.createElement('div');
  wrap.className = `ai-msg ${role}`;

  const av = document.createElement('div');
  av.className   = 'ai-avatar';
  av.setAttribute('aria-hidden', 'true');
  av.innerHTML   = `<svg width="16" height="16" viewBox="0 0 28 28" fill="none">
    <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="3" fill="currentColor"/>
  </svg>`;
  if (role === 'user') { av.innerHTML = 'U'; av.style.background = 'var(--bg-elevated)'; av.style.color = 'var(--accent)'; }

  const bub = document.createElement('div');
  bub.className = 'ai-bubble';
  bub.innerHTML = html;

  if (role === 'bot') {
    wrap.appendChild(av);
    wrap.appendChild(bub);
  } else {
    wrap.appendChild(bub);
    wrap.appendChild(av);
  }

  box.appendChild(wrap);
  requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; });
}

let _typingCounter = 0;
function showTyping() {
  const id  = 'typing_' + (++_typingCounter);
  const box = document.getElementById('aiMessages');
  if (!box) return id;

  const wrap = document.createElement('div');
  wrap.className = 'ai-msg bot';
  wrap.id = id;
  wrap.innerHTML = `
    <div class="ai-avatar" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
        <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="14" cy="14" r="3" fill="currentColor"/>
      </svg>
    </div>
    <div class="ai-bubble ai-typing-dots" aria-label="AI is typing">
      <span></span><span></span><span></span>
    </div>`;
  box.appendChild(wrap);
  box.scrollTop = box.scrollHeight;
  return id;
}

function removeTyping(id) {
  document.getElementById(id)?.remove();
}

/* ══════════════════════
   FORMATTING
══════════════════════ */
function escapeAIHTML(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatAIResponse(text) {
  // Escape HTML first
  text = escapeAIHTML(text);

  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Inline code
  text = text.replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,.07);padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:.85em">$1</code>');

  // Headings (### or ##)
  text = text.replace(/^###\s(.+)$/gm, '<strong style="display:block;margin:12px 0 4px;color:var(--accent)">$1</strong>');
  text = text.replace(/^##\s(.+)$/gm,  '<strong style="display:block;margin:14px 0 6px;font-size:1.05em">$1</strong>');

  // Numbered lists
  text = text.replace(/^(\d+)\.\s+(.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0"><span style="color:var(--accent);font-weight:600;min-width:20px">$1.</span><span>$2</span></div>');

  // Bullet lists
  text = text.replace(/^[-•]\s+(.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0"><span style="color:var(--accent)">▸</span><span>$1</span></div>');

  // Line breaks
  text = text.replace(/\n\n/g, '<br/><br/>');
  text = text.replace(/\n/g, '<br/>');

  return text;
}
