// ═══ FIREBASE CONFIGURATION ═══
// To enable Firebase features, replace the placeholder values below
// with your real Firebase project credentials from:
// https://console.firebase.google.com → Project Settings → Your apps

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
         signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup,
         sendPasswordResetEmail, updateProfile }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc,
         collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ─── DETECT PLACEHOLDER CREDENTIALS ───
const firebaseConfig = {
apiKey: "AIzaSyCWVs8Ef3sV4KkEDAtgC2wXfvCoVNjKNt4",
  authDomain: "royceprince-5195f.firebaseapp.com",
  projectId: "royceprince-5195f",
  storageBucket: "royceprince-5195f.firebasestorage.app",
  messagingSenderId: "1054326658292",
  appId: "1:1054326658292:web:536474d70f0ac4bb2cbaa1",
  measurementId: "G-C19RHBRCK3"
};

const isConfigured = !Object.values(firebaseConfig).some(v => v.startsWith("YOUR_"));

// ─── GRACEFUL FALLBACK (no Firebase credentials) ───
if (!isConfigured) {
  console.warn("⚠️ Firebase is not configured. Auth features are disabled. Replace placeholder values in firebase-config.js to enable them.");

  window.FB = {
    auth: null, db: null,
    _notConfigured: true,
    signUpUser: () => Promise.reject({ code: "not-configured" }),
    signInUser: () => Promise.reject({ code: "not-configured" }),
    signInWithGoogle: () => Promise.reject({ code: "not-configured" }),
    signOutUser: () => Promise.resolve(),
    resetPassword: () => Promise.reject({ code: "not-configured" }),
    logVisitor: () => Promise.resolve(),
    getAllUsers: () => Promise.resolve([]),
    getLoginHistory: () => Promise.resolve([]),
    getVisitorCount: () => Promise.resolve(0),
    onAuthChange: (cb) => { cb(null); return () => {}; },
    isAdmin: () => Promise.resolve(false)
  };

  window.dispatchEvent(new Event("fb-ready"));

} else {
  // ─── REAL FIREBASE INITIALIZATION ───
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const googleProvider = new GoogleAuthProvider();

    async function signUpUser(name, email, password) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid, name, email,
        role: "user", createdAt: serverTimestamp(),
        loginCount: 0, lastLogin: null
      });
      await logLoginEvent(cred.user.uid, email, "signup");
      return cred.user;
    }

    async function signInUser(email, password) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await updateLoginStats(cred.user.uid, email);
      return cred.user;
    }

    async function signInWithGoogle() {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: user.uid, name: user.displayName,
          email: user.email, role: "user",
          createdAt: serverTimestamp(), loginCount: 1, lastLogin: serverTimestamp()
        });
      }
      await updateLoginStats(user.uid, user.email);
      await logLoginEvent(user.uid, user.email, "google");
      return user;
    }

    async function signOutUser() { await signOut(auth); }
    async function resetPassword(email) { await sendPasswordResetEmail(auth, email); }

    async function updateLoginStats(uid, email) {
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      const count = snap.exists() ? (snap.data().loginCount || 0) : 0;
      await updateDoc(ref, { loginCount: count + 1, lastLogin: serverTimestamp() });
      await logLoginEvent(uid, email, "login");
    }

    async function logLoginEvent(uid, email, action) {
      await addDoc(collection(db, "loginHistory"), {
        uid, email, action,
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        platform: navigator.platform
      });
    }

    async function logVisitor() {
      const visited = sessionStorage.getItem("visited");
      if (visited) return;
      sessionStorage.setItem("visited", "1");
      await addDoc(collection(db, "visitors"), {
        timestamp: serverTimestamp(),
        page: window.location.pathname,
        referrer: document.referrer || "direct",
        userAgent: navigator.userAgent
      });
    }

    async function getAllUsers() {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    async function getLoginHistory(n = 20) {
      const q = query(collection(db, "loginHistory"), orderBy("timestamp", "desc"), limit(n));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    async function getVisitorCount() {
      const snap = await getDocs(collection(db, "visitors"));
      return snap.size;
    }

    function onAuthChange(callback) { return onAuthStateChanged(auth, callback); }

    async function isAdmin(uid) {
      if (!uid) return false;
      const snap = await getDoc(doc(db, "users", uid));
      return snap.exists() && snap.data().role === "admin";
    }

    window.FB = {
      auth, db,
      signUpUser, signInUser, signInWithGoogle, signOutUser,
      resetPassword, logVisitor, getAllUsers,
      getLoginHistory, getVisitorCount, onAuthChange, isAdmin
    };

    window.dispatchEvent(new Event("fb-ready"));

  } catch (err) {
    console.error("Firebase initialization failed:", err.message);
    window.FB = {
      _notConfigured: true,
      signUpUser: () => Promise.reject({ code: "not-configured" }),
      signInUser: () => Promise.reject({ code: "not-configured" }),
      signInWithGoogle: () => Promise.reject({ code: "not-configured" }),
      signOutUser: () => Promise.resolve(),
      resetPassword: () => Promise.reject({ code: "not-configured" }),
      logVisitor: () => Promise.resolve(),
      getAllUsers: () => Promise.resolve([]),
      getLoginHistory: () => Promise.resolve([]),
      getVisitorCount: () => Promise.resolve(0),
      onAuthChange: (cb) => { cb(null); return () => {}; },
      isAdmin: () => Promise.resolve(false)
    };
    window.dispatchEvent(new Event("fb-ready"));
  }
}
