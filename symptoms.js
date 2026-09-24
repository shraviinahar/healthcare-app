// symptoms.js
// Placeholder client-side logic for the symptom checker.
// This mock scoring exists purely so the page is interactive before the
// real ML backend (FastAPI + trained tree-based model) is wired up.
// Replace `analyzeSymptoms()` with a fetch() call to your API when ready.

const SYMPTOMS = [
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
];

// Toy lookup table: disease -> {symptoms it's defined by, tier/specialist}
// Purely illustrative — not medically validated. Swap for the real model.
//
// Tier logic: General Physician is the default for almost everything,
// including headaches, migraines, and dizziness on their own — a lone
// headache is not a reason to see a neurologist. "Neurologist" is only
// used for genuine red-flag combinations (sudden one-sided weakness,
// slurred speech, seizures, loss of consciousness).
const CONDITIONS = [
  { name: "Common cold", tier: "General Physician", specialist: "General Physician", symptoms: ["cough", "sore throat", "runny nose", "congestion", "fatigue"], blurb: "A mild viral infection of the nose and throat." },
  { name: "Flu / viral fever", tier: "General Physician", specialist: "General Physician", symptoms: ["fever", "chills", "fatigue", "muscle pain", "headache"], blurb: "A common viral illness causing fever, body aches, and fatigue." },
  { name: "Migraine", tier: "General Physician", specialist: "General Physician", symptoms: ["headache", "nausea", "blurred vision", "dizziness"], blurb: "A recurring headache, often with nausea and sensitivity to light." },
  { name: "Tension headache", tier: "General Physician", specialist: "General Physician", symptoms: ["headache", "muscle pain", "stiffness"], blurb: "A dull, tight headache usually linked to stress or muscle tension." },
  { name: "Sinusitis", tier: "General Physician", specialist: "General Physician", symptoms: ["sinus pressure", "congestion", "headache", "sore throat"], blurb: "Inflammation of the sinuses, often following a cold." },
  { name: "Gastroenteritis", tier: "General Physician", specialist: "General Physician", symptoms: ["abdominal pain", "diarrhoea", "nausea", "vomiting", "fever"], blurb: "Inflammation of the stomach and intestines, usually from infection." },
  { name: "Food poisoning", tier: "General Physician", specialist: "General Physician", symptoms: ["vomiting", "diarrhoea", "abdominal pain", "nausea"], blurb: "Illness from contaminated food, usually short-lived." },
  { name: "Acid reflux / GERD", tier: "General Physician", specialist: "General Physician", symptoms: ["heartburn", "bloating", "chest pain"], blurb: "Stomach acid backing up into the food pipe, causing heartburn." },
  { name: "Type 2 diabetes (early signs)", tier: "General Physician", specialist: "General Physician", symptoms: ["excessive thirst", "frequent urination", "fatigue", "blurred vision", "weight loss"], blurb: "A metabolic condition where blood sugar runs persistently high." },
  { name: "Asthma / airway irritation", tier: "General Physician", specialist: "General Physician", symptoms: ["cough", "shortness of breath", "wheezing", "chest pain"], blurb: "Narrowing of the airways that makes breathing harder." },
  { name: "Contact dermatitis", tier: "General Physician", specialist: "General Physician", symptoms: ["rash", "itching", "swelling"], blurb: "Skin irritation from contact with an allergen or irritant." },
  { name: "Anaemia", tier: "General Physician", specialist: "General Physician", symptoms: ["fatigue", "dizziness", "headache", "balance problems"], blurb: "Low red blood cell count, often causing fatigue and dizziness." },
  { name: "Urinary tract infection", tier: "General Physician", specialist: "General Physician", symptoms: ["burning urination", "frequent urination", "abdominal pain", "fever"], blurb: "A bacterial infection of the urinary tract." },
  { name: "Arthritis", tier: "General Physician", specialist: "General Physician", symptoms: ["joint pain", "stiffness", "swelling"], blurb: "Inflammation of the joints causing pain and stiffness." },
  { name: "Anxiety", tier: "General Physician", specialist: "General Physician", symptoms: ["palpitations", "chest pain", "shortness of breath", "dizziness"], blurb: "A stress response that can cause physical symptoms like a racing heart." },
  { name: "Suspected stroke / TIA", tier: "Neurologist", specialist: "Neurologist", symptoms: ["weakness on one side", "slurred speech", "numbness or tingling", "confusion", "blurred vision"], blurb: "Sudden disrupted blood flow to the brain — treat as an emergency." },
  { name: "Suspected seizure disorder", tier: "Neurologist", specialist: "Neurologist", symptoms: ["seizure", "loss of consciousness", "confusion", "memory problems"], blurb: "Abnormal electrical activity in the brain causing seizures." },
  { name: "Peripheral neuropathy", tier: "Neurologist", specialist: "Neurologist", symptoms: ["numbness or tingling", "weakness on one side", "tremor", "balance problems"], blurb: "Nerve damage causing numbness, tingling, or weakness." },
];

const selected = new Set();
const chipEls = {}; // symptom -> chip element, for cross-syncing with the body model

function setSymptomState(symptom, on) {
  if (on) {
    selected.add(symptom);
  } else {
    selected.delete(symptom);
  }
  const chip = chipEls[symptom];
  if (chip) {
    chip.classList.toggle("is-selected", on);
    chip.setAttribute("aria-pressed", String(on));
  }
}

function toggleSymptom(symptom) {
  setSymptomState(symptom, !selected.has(symptom));
}

function renderChips() {
  const grid = document.getElementById("symptomGrid");
  if (!grid) return;
  grid.innerHTML = "";
  SYMPTOMS.forEach((symptom) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "symptom-chip";
    chip.textContent = symptom;
    chip.setAttribute("aria-pressed", "false");
    chip.addEventListener("click", () => toggleSymptom(symptom));
    grid.appendChild(chip);
    chipEls[symptom] = chip;
  });
}

// --- Hook for body-3d.js: toggle a whole group of symptoms at once when
// a body region is clicked (e.g. clicking the head toggles headache,
// dizziness, blurred vision). Exposed on window so the two scripts stay
// independent of each other.
window.NirogSymptoms = {
  toggleGroup(symptomList) {
    // If every symptom in the group is already on, treat this click as
    // "turn them all off" — otherwise turn them all on. Feels more like
    // a single toggle than a pile of independent switches.
    const allOn = symptomList.every((s) => selected.has(s));
    symptomList.forEach((s) => {
      if (!SYMPTOMS.includes(s)) return;
      setSymptomState(s, !allOn);
    });
  },
  isGroupActive(symptomList) {
    return symptomList.every((s) => selected.has(s));
  },
};

// Very rough free-text -> symptom matcher (keyword contains-check).
// A real version of this is the NLP/DL layer described in the project plan.
function extractFromText(text) {
  const lower = text.toLowerCase();
  SYMPTOMS.forEach((symptom) => {
    if (lower.includes(symptom)) selected.add(symptom);
  });
  // A couple of common synonyms, just for the demo
  const synonyms = {
    "migraine": "headache", "head pain": "headache",
    "throwing up": "vomiting", "vomit": "vomiting",
    "tired": "fatigue", "exhausted": "fatigue",
    "blocked nose": "congestion", "stuffy nose": "congestion",
    "peeing a lot": "frequent urination", "thirsty all the time": "excessive thirst",
    "pins and needles": "numbness or tingling", "tingling": "numbness or tingling",
    "can't speak properly": "slurred speech", "slurring": "slurred speech",
    "one side weak": "weakness on one side", "fainted": "loss of consciousness",
    "blacked out": "loss of consciousness", "shaking": "tremor",
    "heart racing": "palpitations", "racing heart": "palpitations",
  };
  Object.entries(synonyms).forEach(([phrase, symptom]) => {
    if (lower.includes(phrase)) selected.add(symptom);
  });
}

function scoreConditions() {
  return CONDITIONS
    .map((c) => {
      const overlap = c.symptoms.filter((s) => selected.has(s)).length;
      const confidence = overlap / c.symptoms.length;
      return { ...c, overlap, confidence };
    })
    .filter((c) => c.overlap > 0)
    .sort((a, b) => b.confidence - a.confidence || b.overlap - a.overlap)
    .slice(0, 3);
}

function renderResults(top) {
  const empty = document.getElementById("resultsEmpty");
  const filled = document.getElementById("resultsFilled");
  const list = document.getElementById("resultList");
  const note = document.getElementById("specialistNote");

  if (!top.length) {
    empty.hidden = false;
    filled.hidden = true;
    empty.innerHTML = "<p>Nothing matched yet — try adding a couple more symptoms.</p>";
    return;
  }

  empty.hidden = true;
  filled.hidden = false;

  list.innerHTML = "";
  top.forEach((c, i) => {
    const li = document.createElement("li");
    li.classList.add("result-item");
    const pct = Math.round(c.confidence * 100);
    li.innerHTML = `
      <div class="result-row">
        <span class="rank">0${i + 1}</span>
        <span class="cond">${c.name}</span>
        <span class="conf">${pct}%</span>
      </div>
      <p class="result-blurb">${c.blurb}</p>
    `;
    list.appendChild(li);
  });

  const top1 = top[0];
  note.innerHTML = `Suggested — <strong>${top1.tier}</strong>`;
}

function analyzeSymptoms() {
  const text = document.getElementById("freeText").value.trim();
  if (text) extractFromText(text);
  const top = scoreConditions();
  renderResults(top);
}

function clearAll() {
  document.getElementById("freeText").value = "";
  [...selected].forEach((s) => setSymptomState(s, false));
  renderResults([]);
}

document.addEventListener("DOMContentLoaded", () => {
  renderChips();
  document.getElementById("analyzeBtn").addEventListener("click", analyzeSymptoms);
  document.getElementById("clearBtn").addEventListener("click", clearAll);
});
