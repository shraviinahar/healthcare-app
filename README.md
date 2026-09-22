# Nirog

A symptom-checker web app: describe symptoms (by text, checklist, or tapping a 3D body
model) → get a ranked list of probable conditions → get matched to a General Physician
or Neurologist and nearby hospitals.

The frontend is a static HTML/CSS/JS site with a 3D interactive layer (Three.js). The
`backend/` folder has a working FastAPI service with the same prediction logic, ready to
swap in a real trained model later.

## Structure

```
nirog-web/
├── index.html         # landing page markup
├── symptoms.html      # symptom input + results page
├── login.html          # login / sign-up page (Firebase Auth)
├── style.css           # design tokens + layout (shared by all pages)
├── script.js            # hero chip demo + shared 3D tilt-on-hover effect for cards
├── symptoms.js          # symptom checklist, mock scoring, results rendering
├── hero-3d.js           # floating 3D shapes background (homepage hero)
├── body-3d.js           # interactive 3D body model (symptoms page)
├── firebase-config.js   # YOUR Firebase project config (fill this in — see below)
├── auth.js              # shared: keeps the nav's login/logout state in sync on every page
├── login.js             # login.html's form logic (sign up / log in / error handling)
└── backend/
    ├── main.py           # FastAPI app: /health, /symptoms, /predict, /progression
    ├── progression.py    # Hidden Markov Model for symptom progression tracking
    ├── requirements.txt
    └── README.md         # backend-specific setup/run/deploy instructions
```

## Setting up login (Firebase Auth)

Login won't work until you connect your own free Firebase project:

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project.
2. Click the **"</>"** (web app) icon to register a web app inside that project.
3. Firebase shows you a config object — copy those real values into `firebase-config.js`,
   replacing the `YOUR_...` placeholders.
4. In the Firebase console, go to **Build → Authentication → Sign-in method** and enable
   **Email/Password** (it's off by default).
5. That's it — `login.html` handles sign-up and log-in, and `auth.js` keeps every page's
   nav showing the right state (a "Log in" link when signed out, your email + a "Log out"
   button when signed in).

These config values aren't secret — they identify your project, not authenticate requests
— so it's fine to commit `firebase-config.js` to your repo.

## Running the frontend locally

Just open `index.html` in a browser, or serve it:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. The 3D elements and Firebase Auth load from CDNs, so
an internet connection is needed for those to work.

## Running the backend locally

See `backend/README.md` for full instructions — in short:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## Deploying the frontend with GitHub Pages

1. Push this folder to a GitHub repo.
2. Go to **Settings → Pages**.
3. Set source to your default branch, root folder.
4. Your site will be live at `https://<username>.github.io/<repo-name>/`.
5. In the Firebase console, under Authentication → Settings → Authorized domains, add
   your `github.io` domain — Firebase blocks auth requests from unrecognized domains.

## Next steps

- Connect `symptoms.js` to the FastAPI backend (`/predict`) instead of scoring locally.
- Replace the backend's rule-based scorer with a trained tree-based model.
- Build a frontend page for `/progression` (log a daily symptom count, see the trend).
- Add live hospital lookup via Google Places API.
- Add a tap-to-select fallback for the 3D body model on touch devices (currently
  optimized for hover + drag on desktop).
  optimized for hover + drag on desktop).
