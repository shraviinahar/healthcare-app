// login.js
// Handles the login/signup form on login.html: toggling between the two
// modes, calling Firebase Auth, showing friendly error messages, and
// redirecting to the homepage once signed in.

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

let mode = "login"; // or "signup"

const form = document.getElementById("authForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorEl = document.getElementById("authError");
const submitBtn = document.getElementById("authSubmit");
const tabLogin = document.getElementById("tabLogin");
const tabSignup = document.getElementById("tabSignup");
const switchText = document.getElementById("authSwitchText");
const switchBtn = document.getElementById("switchToSignup");

function setMode(newMode) {
  mode = newMode;
  errorEl.hidden = true;

  const isLogin = mode === "login";
  tabLogin.classList.toggle("is-active", isLogin);
  tabSignup.classList.toggle("is-active", !isLogin);
  tabLogin.setAttribute("aria-selected", String(isLogin));
  tabSignup.setAttribute("aria-selected", String(!isLogin));

  submitBtn.textContent = isLogin ? "Log in" : "Create account";
  passwordInput.autocomplete = isLogin ? "current-password" : "new-password";

  switchText.innerHTML = isLogin
    ? `Don't have an account? <button type="button" class="auth-link" id="switchToSignup">Sign up</button>`
    : `Already have an account? <button type="button" class="auth-link" id="switchToSignup">Log in</button>`;
  // Re-bind, since we just replaced the button via innerHTML
  document.getElementById("switchToSignup").addEventListener("click", () => {
    setMode(isLogin ? "signup" : "login");
  });
}

tabLogin.addEventListener("click", () => setMode("login"));
tabSignup.addEventListener("click", () => setMode("signup"));
switchBtn.addEventListener("click", () => setMode(mode === "login" ? "signup" : "login"));

// Friendly text for the Firebase error codes people actually hit.
function friendlyError(code) {
  const map = {
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/missing-password": "Enter a password.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/email-already-in-use": "An account already exists for that email — try logging in instead.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/user-not-found": "No account found for that email — try signing up instead.",
    "auth/too-many-requests": "Too many attempts. Wait a bit and try again.",
    "auth/network-request-failed": "Network error — check your connection.",
    "auth/api-key-not-valid": "Firebase isn't configured yet — fill in firebase-config.js with your project's real values.",
    "auth/invalid-api-key": "Firebase isn't configured yet — fill in firebase-config.js with your project's real values.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.hidden = true;
  submitBtn.disabled = true;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  try {
    if (mode === "login") {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      await createUserWithEmailAndPassword(auth, email, password);
    }
    window.location.href = "index.html";
  } catch (err) {
    errorEl.textContent = friendlyError(err.code);
    errorEl.hidden = false;
  } finally {
    submitBtn.disabled = false;
  }
});

// If someone's already signed in and lands on this page, just send them home.
onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = "index.html";
});
