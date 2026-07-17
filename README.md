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
├── index.html      # landing page markup
├── symptoms.html   # symptom input + results page
├── style.css       # design tokens + layout (shared by both pages)
├── script.js       # hero chip demo + shared 3D tilt-on-hover effect for cards
├── symptoms.js     # symptom checklist, mock scoring, results rendering
├── hero-3d.js      # floating 3D shapes background (homepage hero)
├── body-3d.js      # interactive 3D body model (symptoms page)
└── backend/
    ├── main.py           # FastAPI app: /health, /symptoms, /predict
    ├── requirements.txt
    └── README.md         # backend-specific setup/run/deploy instructions
```

## Running the frontend locally

Just open `index.html` in a browser, or serve it:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. The 3D elements load Three.js from a CDN, so an
internet connection is needed for those to render.

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

## Next steps

- Connect `symptoms.js` to the FastAPI backend (`/predict`) instead of scoring locally.
- Replace the backend's rule-based scorer with a trained tree-based model.
- Add real login (Firebase Auth / Supabase).
- Add live hospital lookup via Google Places API.
- Add a tap-to-select fallback for the 3D body model on touch devices (currently
  optimized for hover + drag on desktop).
