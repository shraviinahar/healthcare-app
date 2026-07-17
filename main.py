"""
Nirog backend — FastAPI service for symptom-based disease prediction.

Right now this uses a small rule-based scorer (same idea as the frontend
mock in symptoms.js) so the API is fully working end-to-end before the
real trained model exists. Once you've trained your Extra Trees/XGBoost
model on a proper symptom-disease dataset, drop the .pkl file into
model/ and swap `score_conditions()` for `model_predict()` — the request/
response shape for /predict does not need to change.

Run locally:
    pip install -r requirements.txt
    uvicorn main:app --reload

Then visit http://127.0.0.1:8000/docs for interactive API docs.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List

app = FastAPI(
    title="Nirog API",
    description="Symptom-based disease prediction, specialist mapping, and (soon) hospital lookup.",
    version="0.1.0",
)

# Allow the frontend (GitHub Pages, localhost, etc.) to call this API.
# Tighten allow_origins to your actual domain once deployed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Canonical symptom list — MUST match whatever your trained model expects
# as its feature columns. Keep this as the single source of truth and have
# the frontend fetch it from /symptoms instead of hardcoding it separately.
# ---------------------------------------------------------------------------
SYMPTOMS: List[str] = [
    "headache", "fever", "chills", "fatigue", "dizziness", "nausea", "vomiting",
    "cough", "sore throat", "runny nose", "congestion", "sinus pressure",
    "shortness of breath", "wheezing", "chest pain", "palpitations",
    "joint pain", "muscle pain", "back pain", "stiffness",
    "rash", "itching", "swelling",
    "abdominal pain", "diarrhoea", "constipation", "bloating", "heartburn",
    "excessive thirst", "frequent urination", "burning urination", "weight loss",
    "blurred vision", "numbness or tingling", "weakness on one side",
    "slurred speech", "seizure", "loss of consciousness", "confusion",
    "memory problems", "tremor", "balance problems",
]

# ---------------------------------------------------------------------------
# Toy lookup table — placeholder for the real trained model.
# Not medically validated. Replace with model inference once trained.
#
# Tier logic: General Physician is the default for almost everything,
# including headaches, migraines, and dizziness on their own — a lone
# headache is not a reason to see a neurologist. "Neurologist" is only
# used for conditions defined by genuine red-flag combinations (sudden
# one-sided weakness, slurred speech, seizures, loss of consciousness),
# which is what actually warrants that referral in practice.
# ---------------------------------------------------------------------------
CONDITIONS = [
    {"name": "Common cold", "tier": "General Physician", "specialist": "General Physician",
     "symptoms": ["cough", "sore throat", "runny nose", "congestion", "fatigue"],
     "blurb": "A mild viral infection of the nose and throat."},
    {"name": "Flu / viral fever", "tier": "General Physician", "specialist": "General Physician",
     "symptoms": ["fever", "chills", "fatigue", "muscle pain", "headache"],
     "blurb": "A common viral illness causing fever, body aches, and fatigue."},
    {"name": "Migraine", "tier": "General Physician", "specialist": "General Physician",
     "symptoms": ["headache", "nausea", "blurred vision", "dizziness"],
     "blurb": "A recurring headache, often with nausea and sensitivity to light."},
    {"name": "Tension headache", "tier": "General Physician", "specialist": "General Physician",
     "symptoms": ["headache", "muscle pain", "stiffness"],
     "blurb": "A dull, tight headache usually linked to stress or muscle tension."},
    {"name": "Sinusitis", "tier": "General Physician", "specialist": "General Physician",
     "symptoms": ["sinus pressure", "congestion", "headache", "sore throat"],
     "blurb": "Inflammation of the sinuses, often following a cold."},
    {"name": "Gastroenteritis", "tier": "General Physician", "specialist": "General Physician",
     "symptoms": ["abdominal pain", "diarrhoea", "nausea", "vomiting", "fever"],
     "blurb": "Inflammation of the stomach and intestines, usually from infection."},
    {"name": "Food poisoning", "tier": "General Physician", "specialist": "General Physician",
     "symptoms": ["vomiting", "diarrhoea", "abdominal pain", "nausea"],
     "blurb": "Illness from contaminated food, usually short-lived."},
    {"name": "Acid reflux / GERD", "tier": "General Physician", "specialist": "General Physician",
     "symptoms": ["heartburn", "bloating", "chest pain"],
     "blurb": "Stomach acid backing up into the food pipe, causing heartburn."},
    {"name": "Type 2 diabetes (early signs)", "tier": "General Physician", "specialist": "General Physician",
     "symptoms": ["excessive thirst", "frequent urination", "fatigue", "blurred vision", "weight loss"],
     "blurb": "A metabolic condition where blood sugar runs persistently high."},
    {"name": "Asthma / airway irritation", "tier": "General Physician", "specialist": "General Physician",
     "symptoms": ["cough", "shortness of breath", "wheezing", "chest pain"],
     "blurb": "Narrowing of the airways that makes breathing harder."},
    {"name": "Contact dermatitis", "tier": "General Physician", "specialist": "General Physician",
     "symptoms": ["rash", "itching", "swelling"],
     "blurb": "Skin irritation from contact with an allergen or irritant."},
    {"name": "Anaemia", "tier": "General Physician", "specialist": "General Physician",
     "symptoms": ["fatigue", "dizziness", "headache", "balance problems"],
     "blurb": "Low red blood cell count, often causing fatigue and dizziness."},
    {"name": "Urinary tract infection", "tier": "General Physician", "specialist": "General Physician",
     "symptoms": ["burning urination", "frequent urination", "abdominal pain", "fever"],
     "blurb": "A bacterial infection of the urinary tract."},
    {"name": "Arthritis", "tier": "General Physician", "specialist": "General Physician",
     "symptoms": ["joint pain", "stiffness", "swelling"],
     "blurb": "Inflammation of the joints causing pain and stiffness."},
    {"name": "Anxiety", "tier": "General Physician", "specialist": "General Physician",
     "symptoms": ["palpitations", "chest pain", "shortness of breath", "dizziness"],
     "blurb": "A stress response that can cause physical symptoms like a racing heart."},
    {"name": "Suspected stroke / TIA", "tier": "Neurologist", "specialist": "Neurologist",
     "symptoms": ["weakness on one side", "slurred speech", "numbness or tingling",
                  "confusion", "blurred vision"],
     "blurb": "Sudden disrupted blood flow to the brain — treat as an emergency."},
    {"name": "Suspected seizure disorder", "tier": "Neurologist", "specialist": "Neurologist",
     "symptoms": ["seizure", "loss of consciousness", "confusion", "memory problems"],
     "blurb": "Abnormal electrical activity in the brain causing seizures."},
    {"name": "Peripheral neuropathy", "tier": "Neurologist", "specialist": "Neurologist",
     "symptoms": ["numbness or tingling", "weakness on one side", "tremor", "balance problems"],
     "blurb": "Nerve damage causing numbness, tingling, or weakness."},
]


class PredictRequest(BaseModel):
    symptoms: List[str] = Field(
        default_factory=list,
        description="Symptom keywords, matching entries in /symptoms.",
        examples=[["headache", "dizziness", "nausea"]],
    )
    free_text: str = Field(
        default="",
        description="Optional raw free-text description of how the user feels.",
        examples=["bad headache since yesterday, feel dizzy when I stand up"],
    )


class Prediction(BaseModel):
    condition: str
    tier: str          # "General Physician" or "Neurologist"
    specialist: str    # e.g. "General Physician" or "Neurologist"
    confidence: float
    blurb: str         # one-line description of the condition


class PredictResponse(BaseModel):
    predictions: List[Prediction]
    matched_symptoms: List[str]


def extract_from_text(text: str, found: set) -> None:
    """Very rough keyword matcher — placeholder for the real NLP/DL layer."""
    lower = text.lower()
    for symptom in SYMPTOMS:
        if symptom in lower:
            found.add(symptom)
    synonyms = {
        "migraine": "headache", "head pain": "headache",
        "throwing up": "vomiting", "vomit": "vomiting",
        "tired": "fatigue", "exhausted": "fatigue",
        "runny nose": "runny nose", "blocked nose": "congestion", "stuffy nose": "congestion",
        "peeing a lot": "frequent urination", "thirsty all the time": "excessive thirst",
        "pins and needles": "numbness or tingling", "tingling": "numbness or tingling",
        "can't speak properly": "slurred speech", "slurring": "slurred speech",
        "one side weak": "weakness on one side", "fainted": "loss of consciousness",
        "blacked out": "loss of consciousness", "shaking": "tremor",
        "heart racing": "palpitations", "racing heart": "palpitations",
    }
    for phrase, symptom in synonyms.items():
        if phrase in lower:
            found.add(symptom)


def score_conditions(found_symptoms: set) -> List[Prediction]:
    """Rank conditions by fraction of their defining symptoms present.

    Replace this function with model_predict() once you have a trained
    model — keep the same return type (List[Prediction]) so nothing else
    in the app needs to change.
    """
    scored = []
    for cond in CONDITIONS:
        overlap = len(set(cond["symptoms"]) & found_symptoms)
        if overlap == 0:
            continue
        confidence = round(overlap / len(cond["symptoms"]), 2)
        scored.append(Prediction(
            condition=cond["name"],
            tier=cond["tier"],
            specialist=cond["specialist"],
            confidence=confidence,
            blurb=cond["blurb"],
        ))
    scored.sort(key=lambda p: p.confidence, reverse=True)
    return scored[:3]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/symptoms", response_model=List[str])
def get_symptoms():
    """Canonical symptom list — frontend should build its checklist from this."""
    return SYMPTOMS


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest):
    found = set(s.lower() for s in payload.symptoms if s.lower() in SYMPTOMS)
    if payload.free_text:
        extract_from_text(payload.free_text, found)

    predictions = score_conditions(found)
    return PredictResponse(
        predictions=predictions,
        matched_symptoms=sorted(found),
    )
