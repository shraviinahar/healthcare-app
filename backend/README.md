# Nirog backend

FastAPI service for symptom-based disease prediction, specialist mapping, and
(eventually) hospital lookup.

Currently uses a small rule-based scorer as a placeholder — swap it for your
trained Extra Trees/XGBoost model once ready (see the comment above
`score_conditions()` in `main.py`).

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Run locally

```bash
uvicorn main:app --reload
```

- API: http://127.0.0.1:8000
- Interactive docs (Swagger UI): http://127.0.0.1:8000/docs

## Endpoints

| Method | Path           | Description                                      |
|--------|----------------|-----------------------------------------------------|
| GET    | `/health`      | Health check                                       |
| GET    | `/symptoms`    | Canonical list of symptoms the model understands   |
| POST   | `/predict`     | Send `{ "symptoms": [...], "free_text": "..." }`, get back top-3 predictions with specialist + confidence + a one-line description |
| POST   | `/progression` | Send `{ "daily_symptom_counts": [1,2,3,4,6,7] }` (oldest day first), get back a Hidden Markov Model's inferred Healthy/Moderate/Sick/Needs specialist/Diseases state per day and an overall trend |

Example requests:

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"symptoms": ["headache", "dizziness", "nausea"]}'

curl -X POST http://127.0.0.1:8000/progression \
  -H "Content-Type: application/json" \
  -d '{"daily_symptom_counts": [1, 2, 3, 4, 6, 7]}'
```

### About `/progression`

This is a Hidden Markov Model (see `progression.py`), separate from the
disease-prediction logic. `/predict` looks at one snapshot of symptoms;
`/progression` looks at a *sequence* of days and infers whether the
person's underlying severity (a hidden state — Healthy, Moderate, Sick, Needs specialist, or Diseases) is
trending up or down, based on how many symptoms they logged each day.
The transition/emission probabilities are currently hand-set, sensible
defaults rather than fit from real patient data — swap in `model.fit()`
on real longitudinal data once you have it.

## Connecting the frontend

Update `symptoms.js` on the frontend to `fetch("http://127.0.0.1:8000/predict", ...)`
instead of scoring locally, once this is running. CORS is already open (`allow_origins=["*"]`)
for local development — tighten this before deploying publicly.

## Deploying

Free options that work well for a student project: **Render** or **Railway**.
Both can deploy directly from this `backend/` folder in your GitHub repo —
point them at `uvicorn main:app --host 0.0.0.0 --port $PORT` as the start command.

## Next steps

- Replace `score_conditions()` with real model inference (`joblib.load()` your `.pkl`).
- Add a `/hospitals` endpoint that calls the Google Places API.
- Add authentication (if this API starts storing per-user history).
