// auth.js
// Shared across index.html and symptoms.html. Initializes Firebase Auth
// once, watches sign-in state, and swaps the nav's "Log in" link for the
// user's email + a Log out button whenever someone is signed in.
//
// login.html handles the actual sign-up/sign-in forms — this file only
// reflects the current auth state in the nav and lets someone log out
// from any page.

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

function renderNav(user) {
  const slot = document.getElementById("navAuthSlot");
  if (!slot) return;

  if (user) {
    slot.innerHTML = `
      <span class="nav-user">${user.email}</span>
      <button type="button" class="btn btn-ghost nav-cta" id="logoutBtn">Log out</button>
    `;
    document.getElementById("logoutBtn").addEventListener("click", () => {
      signOut(auth);
    });
  } else {
    slot.innerHTML = `<a href="login.html" class="btn btn-ghost nav-cta">Log in</a>`;
  }
}

onAuthStateChanged(auth, renderNav);
