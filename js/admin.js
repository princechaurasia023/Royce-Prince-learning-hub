// ═══ ADMIN DASHBOARD CONTROLLER ═══

// ─── WAIT FOR FIREBASE MODULE ───
function onFBReady() {
  initAdmin();
}

if (window.FB) {
  onFBReady();
} else {
  window.addEventListener("fb-ready", onFBReady, { once: true });
  setTimeout(() => { if (!window.FB) showAccessDenied(); }, 6000);
}

// ─── PANEL SWITCHING ───
const PANELS = ["overview", "users", "history", "analytics"];
const TITLES = {
  overview: "📊 Overview",
  users: "👥 All Users",
  history: "🕒 Login History",
  analytics: "📈 Analytics"
};

window.showPanel = function (name) {
  PANELS.forEach(p => {
    const el = document.getElementById("panel-" + p);
    if (el) el.style.display = p === name ? "" : "none";
    const item = document.querySelector(`.sidebar-item[href="#${p}"]`);
    if (item) item.classList.toggle("active", p === name);
  });
  const title = document.getElementById("panel-title");
  if (title) title.textContent = TITLES[name] || name;
  return false;
};

// ─── INIT ADMIN ───
async function initAdmin() {
  if (window.FB && window.FB._notConfigured) {
    showDemoDashboard();
    return;
  }

  window.FB.onAuthChange(async (user) => {
    const loading = document.getElementById("admin-loading");
    const panels = document.getElementById("admin-panels");
    const denied = document.getElementById("access-denied");

    if (!user) {
      if (loading) loading.style.display = "none";
      if (denied) denied.style.display = "block";
      return;
    }

    const admin = await window.FB.isAdmin(user.uid).catch(() => false);
    if (!admin) {
      if (loading) loading.style.display = "none";
      if (denied) denied.style.display = "block";
      return;
    }

    if (loading) loading.style.display = "none";
    if (panels) panels.style.display = "block";
    const emailEl = document.getElementById("admin-email");
    const avatarEl = document.getElementById("admin-avatar-btn");
    if (emailEl) emailEl.textContent = user.email;
    if (avatarEl) avatarEl.textContent = (user.displayName || user.email)[0].toUpperCase();

    loadDashboard();
  });
}

// ─── DEMO DASHBOARD ───
function showDemoDashboard() {
  const loading = document.getElementById("admin-loading");
  const panels = document.getElementById("admin-panels");
  const emailEl = document.getElementById("admin-email");
  const avatarEl = document.getElementById("admin-avatar-btn");

  if (loading) loading.style.display = "none";
  if (panels) panels.style.display = "block";
  if (emailEl) emailEl.textContent = "demo@admin.com (Firebase not configured)";
  if (avatarEl) avatarEl.textContent = "D";

  const demoUsers = [
    { name: "Royce Prince", email: "royceprince@example.com", role: "admin", loginCount: 42, lastLogin: new Date(), createdAt: new Date("2025-01-01") },
    { name: "Demo User", email: "user@example.com", role: "user", loginCount: 7, lastLogin: new Date(), createdAt: new Date("2025-06-15") }
  ];
  const demoHistory = Array.from({ length: 15 }, (_, i) => ({
    email: i % 2 === 0 ? "royceprince@example.com" : "user@example.com",
    action: ["login", "signup", "google"][i % 3],
    timestamp: new Date(Date.now() - i * 3600000 * 8),
    userAgent: i % 3 === 0 ? "Mozilla/5.0 (Android)" : "Mozilla/5.0 (Windows)"
  }));

  renderStats(demoUsers, demoHistory, 128);
  renderBarChart(demoHistory);
  renderHistoryList(demoHistory.slice(0, 10), "history-list");
  renderHistoryList(demoHistory, "full-history-list");
  renderUsersTable(demoUsers);
  renderAnalytics(demoUsers, demoHistory, 128);

  showToast("⚠️ Demo mode — configure Firebase to see live data", "info");
}

function showAccessDenied() {
  const loading = document.getElementById("admin-loading");
  const denied = document.getElementById("access-denied");
  if (loading) loading.style.display = "none";
  if (denied) denied.style.display = "block";
}

// ─── LOAD ALL DATA ───
async function loadDashboard() {
  try {
    const [users, history, visitorCount] = await Promise.all([
      window.FB.getAllUsers(),
      window.FB.getLoginHistory(50),
      window.FB.getVisitorCount()
    ]);
    renderStats(users, history, visitorCount);
    renderBarChart(history);
    renderHistoryList(history.slice(0, 10), "history-list");
    renderHistoryList(history, "full-history-list");
    renderUsersTable(users);
    renderAnalytics(users, history, visitorCount);
  } catch (err) {
    showToast("Error loading data: " + err.message, "error");
  }
}

// ─── STATS CARDS ───
function renderStats(users, history, visitors) {
  setText("stat-users", users.length);
  setText("stat-logins", history.filter(h => h.action === "login").length);
  setText("stat-visitors", visitors);
  const today = new Date(); today.setHours(0,0,0,0);
  const todayLogins = history.filter(h => {
    if (!h.timestamp) return false;
    const ts = h.timestamp.toDate ? h.timestamp.toDate() : new Date(h.timestamp);
    return ts >= today && h.action === "login";
  }).length;
  setText("stat-today", todayLogins);
}

// ─── BAR CHART ───
function renderBarChart(history) {
  const container = document.getElementById("bar-chart");
  if (!container) return;
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
    days.push({ label: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()], date: d, count: 0 });
  }
  history.forEach(h => {
    if (!h.timestamp || h.action !== "login") return;
    const ts = h.timestamp.toDate ? h.timestamp.toDate() : new Date(h.timestamp);
    const tsDay = new Date(ts); tsDay.setHours(0,0,0,0);
    const day = days.find(d => d.date.getTime() === tsDay.getTime());
    if (day) day.count++;
  });
  const max = Math.max(...days.map(d => d.count), 1);
  container.innerHTML = days.map(d => {
    const h = Math.round((d.count / max) * 120);
    return `<div class="bar-col"><div class="bar-fill" style="height:${h}px;--target:${h}px"></div><span class="bar-label">${d.label}</span></div>`;
  }).join("");
}

// ─── HISTORY LIST ───
function renderHistoryList(history, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!history.length) { el.innerHTML = '<p style="color:var(--muted);font-size:0.85rem">No records yet.</p>'; return; }
  el.innerHTML = history.map(h => {
    const ts = h.timestamp ? (h.timestamp.toDate ? h.timestamp.toDate() : new Date(h.timestamp)) : null;
    const time = ts ? ts.toLocaleString() : "—";
    const action = { login: "Login", signup: "Sign Up", google: "Google" }[h.action] || h.action;
    const actionColor = { login: "var(--neon)", signup: "var(--purple)", google: "var(--pink)" }[h.action] || "var(--muted)";
    return `<div class="history-item">
      <div class="history-dot" style="background:${actionColor}"></div>
      <span class="history-email">${h.email || "—"}</span>
      <span class="history-action" style="color:${actionColor}">${action}</span>
      <span class="history-time">${time}</span>
    </div>`;
  }).join("");
  setText("history-count", history.length);
}

// ─── USERS TABLE ───
function renderUsersTable(users) {
  const tbody = document.getElementById("users-table-body");
  const count = document.getElementById("users-count");
  if (!tbody) return;
  if (count) count.textContent = users.length;
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--muted);padding:1rem">No users yet.</td></tr>';
    return;
  }
  tbody.innerHTML = users.map(u => {
    const created = u.createdAt ? (u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt)).toLocaleDateString() : "—";
    const lastLogin = u.lastLogin ? (u.lastLogin.toDate ? u.lastLogin.toDate() : new Date(u.lastLogin)).toLocaleDateString() : "—";
    const role = u.role || "user";
    return `<tr>
      <td>${u.name || "—"}</td>
      <td>${u.email || "—"}</td>
      <td><span class="badge-status ${role === "admin" ? "admin" : "active"}">${role}</span></td>
      <td>${u.loginCount || 0}</td>
      <td>${lastLogin}</td>
      <td>${created}</td>
    </tr>`;
  }).join("");
}

// ─── ANALYTICS ───
function renderAnalytics(users, history, visitorCount) {
  const devices = { Mobile: 0, Desktop: 0, Tablet: 0 };
  history.forEach(h => {
    if (!h.userAgent) return;
    if (/Mobi|Android/i.test(h.userAgent)) devices.Mobile++;
    else if (/Tablet|iPad/i.test(h.userAgent)) devices.Tablet++;
    else devices.Desktop++;
  });
  const maxD = Math.max(...Object.values(devices), 1);
  const dChart = document.getElementById("device-chart");
  if (dChart) {
    dChart.innerHTML = Object.entries(devices).map(([k, v]) => {
      const h = Math.round((v / maxD) * 120);
      return `<div class="bar-col"><div class="bar-fill" style="height:${h}px;background:linear-gradient(to top,var(--purple),var(--pink))"></div><span class="bar-label">${k}</span></div>`;
    }).join("");
  }
  const traffic = document.getElementById("traffic-stats");
  if (traffic) {
    const total = Math.max(visitorCount, 1);
    const items = [
      { label: "Direct", value: Math.round(total * 0.6), pct: 60 },
      { label: "GitHub", value: Math.round(total * 0.3), pct: 30 },
      { label: "Social", value: Math.round(total * 0.1), pct: 10 }
    ];
    traffic.innerHTML = items.map(i => `
      <div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:0.3rem">
          <span>${i.label}</span><span style="color:var(--neon)">${i.value}</span>
        </div>
        <div style="height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${i.pct}%;background:linear-gradient(90deg,var(--neon),var(--purple));border-radius:3px"></div>
        </div>
      </div>`).join("");
  }
}

// ─── ADMIN LOGOUT ───
window.adminLogout = async function () {
  if (window.FB && !window.FB._notConfigured) {
    await window.FB.signOutUser().catch(() => {});
  }
  window.location.href = "index.html";
};

// ─── HELPERS ───
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

window.showToast = function (msg, type = "info") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = "toast " + type + " show";
  setTimeout(() => t.classList.remove("show"), 3200);
};
