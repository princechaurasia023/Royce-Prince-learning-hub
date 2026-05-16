// ═══ APP.JS — Main Controller ═══

// ─── INTRO ANIMATION ───
(function runIntro() {
  const overlay = document.getElementById("intro-overlay");
  if (!overlay) return;
  const isFirst = !localStorage.getItem("visited_portfolio");
  if (!isFirst) { overlay.classList.add("hidden"); return; }

  const bar = document.getElementById("intro-bar");
  let pct = 0;
  const iv = setInterval(() => {
    pct += Math.random() * 4 + 1;
    if (pct >= 100) { pct = 100; clearInterval(iv); }
    if (bar) bar.style.width = pct + "%";
    if (pct >= 100) {
      setTimeout(() => {
        overlay.classList.add("hidden");
        localStorage.setItem("visited_portfolio", "1");
      }, 400);
    }
  }, 40);
})();

// ─── TYPING ANIMATION ───
(function typeWriter() {
  const el = document.getElementById("typed-text");
  if (!el) return;
  const words = ["Full-Stack Developer", "UI/UX Designer", "Firebase Expert", "Problem Solver", "Tech Innovator"];
  let wi = 0, ci = 0, deleting = false;

  function type() {
    const word = words[wi];
    el.textContent = deleting ? word.slice(0, ci--) : word.slice(0, ci++);
    let delay = deleting ? 60 : 110;
    if (!deleting && ci > word.length) { delay = 1800; deleting = true; }
    else if (deleting && ci < 0) { deleting = false; wi = (wi + 1) % words.length; ci = 0; delay = 400; }
    setTimeout(type, delay);
  }
  type();
})();

// ─── NAV TOGGLE (mobile) ───
window.toggleNav = function () {
  const links = document.getElementById("nav-links");
  if (links) links.classList.toggle("open");
};

// ─── MODAL LOGIC ───
window.openLoginModal = function () {
  document.getElementById("modal-overlay").classList.add("active");
  document.getElementById("login-modal").classList.add("active");
};
window.closeLoginModal = function () {
  document.getElementById("modal-overlay").classList.remove("active");
  document.getElementById("login-modal").classList.remove("active");
};
window.switchTab = function (tab) {
  document.getElementById("login-form").classList.toggle("hidden", tab !== "login");
  document.getElementById("signup-form").classList.toggle("hidden", tab !== "signup");
  document.getElementById("tab-login").classList.toggle("active", tab === "login");
  document.getElementById("tab-signup").classList.toggle("active", tab === "signup");
};

// ─── TOAST ───
window.showToast = function (msg, type = "info") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = "toast " + type + " show";
  setTimeout(() => { t.classList.remove("show"); }, 3200);
};

// ─── SET LOADING STATE ───
function setLoading(btnTextId, spinnerId, loading) {
  const txt = document.getElementById(btnTextId);
  const spin = document.getElementById(spinnerId);
  if (txt) txt.style.display = loading ? "none" : "";
  if (spin) spin.style.display = loading ? "inline-block" : "none";
}

// ─── FRIENDLY ERRORS ───
function friendlyError(code) {
  const map = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/email-already-in-use": "Email already registered.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-email": "Invalid email address.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/popup-closed-by-user": "Sign-in cancelled.",
    "auth/popup-blocked": "Popup was blocked. Please allow popups for this site.",
    "not-configured": "Authentication is not yet configured. Please set up Firebase credentials."
  };
  return map[code] || "Something went wrong. Please try again.";
}

// ─── AUTH HANDLERS ───
window.handleLogin = async function (e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const pass = document.getElementById("login-password").value;
  const msg = document.getElementById("login-msg");
  setLoading("login-btn-text", "login-spinner", true);
  msg.textContent = "";
  try {
    await window.FB.signInUser(email, pass);
    showToast("Welcome back! 🎉", "success");
    closeLoginModal();
  } catch (err) {
    msg.textContent = friendlyError(err.code);
    msg.className = "form-status error";
  } finally {
    setLoading("login-btn-text", "login-spinner", false);
  }
};

window.handleSignup = async function (e) {
  e.preventDefault();
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const pass = document.getElementById("signup-password").value;
  const msg = document.getElementById("signup-msg");
  setLoading("signup-btn-text", "signup-spinner", true);
  msg.textContent = "";
  try {
    await window.FB.signUpUser(name, email, pass);
    showToast("Account created! Welcome 🚀", "success");
    closeLoginModal();
  } catch (err) {
    msg.textContent = friendlyError(err.code);
    msg.className = "form-status error";
  } finally {
    setLoading("signup-btn-text", "signup-spinner", false);
  }
};

window.handleGoogleLogin = async function () {
  try {
    await window.FB.signInWithGoogle();
    showToast("Signed in with Google ✅", "success");
    closeLoginModal();
  } catch (err) {
    showToast(friendlyError(err.code), "error");
  }
};

window.handleForgotPassword = async function () {
  const email = document.getElementById("login-email").value.trim();
  if (!email) { showToast("Enter your email first", "error"); return; }
  try {
    await window.FB.resetPassword(email);
    showToast("Reset email sent 📧", "success");
  } catch (err) {
    showToast(friendlyError(err.code), "error");
  }
};

// ─── CONTACT FORM ───
window.submitContact = async function (e) {
  e.preventDefault();
  const status = document.getElementById("contact-status");
  const btn = e.target.querySelector("button[type=submit]");
  if (btn) btn.disabled = true;
  status.textContent = "Sending...";
  status.className = "form-status";
  await new Promise(r => setTimeout(r, 1200));
  status.textContent = "✅ Message sent! I'll get back to you soon.";
  status.className = "form-status success";
  document.getElementById("contact-form").reset();
  if (btn) btn.disabled = false;
};

// ─── AUTH STATE ───
function initAuthState() {
  if (!window.FB) return;

  if (window.FB._notConfigured) {
    const loginBtn = document.getElementById("open-login-btn");
    if (loginBtn) loginBtn.title = "Firebase not configured — auth disabled";
  }

  window.FB.onAuthChange(async (user) => {
    const loginBtn = document.getElementById("open-login-btn");
    const adminBtn = document.getElementById("admin-btn");
    if (user) {
      if (loginBtn) {
        loginBtn.innerHTML = `<i class="fa fa-user"></i> ${user.displayName || user.email.split("@")[0]}`;
        loginBtn.onclick = async () => {
          await window.FB.signOutUser();
          showToast("Logged out", "info");
        };
      }
      const admin = await window.FB.isAdmin(user.uid);
      if (adminBtn) adminBtn.style.display = admin ? "flex" : "none";
    } else {
      if (loginBtn) {
        loginBtn.innerHTML = `<i class="fa fa-user"></i> Login`;
        loginBtn.onclick = openLoginModal;
      }
      if (adminBtn) adminBtn.style.display = "none";
    }
  });
}

// ─── WAIT FOR FIREBASE MODULE THEN INIT ───
function onFBReady() {
  initAuthState();
  setTimeout(() => {
    if (window.FB) window.FB.logVisitor().catch(() => {});
  }, 2000);
}

if (window.FB) {
  onFBReady();
} else {
  window.addEventListener("fb-ready", onFBReady, { once: true });
  setTimeout(() => {
    if (!window._fbInitDone) onFBReady();
  }, 5000);
}

document.addEventListener("DOMContentLoaded", () => {
  window._fbInitDone = true;
});
