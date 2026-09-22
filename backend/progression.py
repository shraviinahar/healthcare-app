"""
progression.py — Hidden Markov Model for tracking symptom progression
across multiple days.

Where this fits: the main /predict endpoint answers "what might this be,
right now, from one snapshot of symptoms." This module answers a
different question — "how is this person's condition trending over the
days they've been logging symptoms?" That's an inherently sequential
question, which is exactly what an HMM is built for.

Model design
------------
Hidden states (not directly observable, only inferred), from least to
most severe:

    0. Healthy
    1. Moderate
    2. Sick
    3. Needs specialist
    4. Diseases (severe / likely a diagnosable condition)

Observations (what we actually see): how many symptoms they reported
that day, bucketed into 5 levels from "none" to "very high". We never
observe the true state directly — we infer the most likely day-by-day
path through these 5 states from the pattern of symptom counts, using
the Viterbi algorithm.

The transition and emission probabilities below are hand-set, sensible
defaults (not fit from real patient data): each state is "sticky" (most
likely to persist or move to a neighbouring state day-to-day) rather
than jumping straight from Healthy to Diseases overnight, and a more
severe true state tends to produce a higher symptom count, but not
perfectly. Once real longitudinal data exists, re-fit with model.fit()
instead of keeping these fixed.
"""

import numpy as np
from hmmlearn import hmm

STATES = ["Healthy", "Moderate", "Sick", "Needs specialist", "Diseases"]

BUCKET_LABELS = [
    "none (0 symptoms)",
    "low (1-2 symptoms)",
    "medium (3-4 symptoms)",
    "high (5-7 symptoms)",
    "very high (8+ symptoms)",
]


def _bucket_count(symptom_count: int) -> int:
    """Turn a raw daily symptom count into one of 5 discrete observation symbols."""
    if symptom_count <= 0:
        return 0
    if symptom_count <= 2:
        return 1
    if symptom_count <= 4:
        return 2
    if symptom_count <= 7:
        return 3
    return 4


def _build_model() -> hmm.CategoricalHMM:
    model = hmm.CategoricalHMM(n_components=5, n_features=5, init_params="")

    # Most people log in somewhere between healthy and mildly unwell.
    model.startprob_ = np.array([0.50, 0.30, 0.12, 0.05, 0.03])

    # Rows = "from" state, columns = "to" state (next day). Banded around
    # the diagonal: states tend to persist or drift to a neighbour, and
    # jumping straight from Healthy to Diseases in one day is rare.
    model.transmat_ = np.array([
        [0.65, 0.25, 0.07, 0.02, 0.01],  # from Healthy
        [0.20, 0.50, 0.20, 0.07, 0.03],  # from Moderate
        [0.05, 0.20, 0.45, 0.20, 0.10],  # from Sick
        [0.02, 0.08, 0.20, 0.45, 0.25],  # from Needs specialist
        [0.01, 0.04, 0.10, 0.25, 0.60],  # from Diseases
    ])

    # P(observed bucket | true state) — same banded shape: a given state
    # most often produces the matching symptom-count bucket, with some
    # spillover into neighbouring buckets.
    model.emissionprob_ = np.array([
        [0.65, 0.25, 0.07, 0.02, 0.01],  # Healthy
        [0.20, 0.45, 0.25, 0.07, 0.03],  # Moderate
        [0.05, 0.20, 0.45, 0.20, 0.10],  # Sick
        [0.02, 0.08, 0.20, 0.45, 0.25],  # Needs specialist
        [0.01, 0.04, 0.10, 0.25, 0.60],  # Diseases
    ])

    return model


def _trend_from_labels(labels: list) -> str:
    order = {s: i for i, s in enumerate(STATES)}
    if len(labels) < 2:
        return "Not enough data yet — log a couple more days."
    first, last = order[labels[0]], order[labels[-1]]
    if last > first:
        return "Worsening"
    if last < first:
        return "Improving"
    return "Stable"


def infer_progression(daily_symptom_counts: list) -> dict:
    """
    daily_symptom_counts: list of ints, oldest day first, e.g. [0, 1, 3, 5, 7, 9]
    Returns the most likely hidden state per day (Viterbi path) across the
    5 states, plus an overall trend label.
    """
    observations = np.array([[_bucket_count(c)] for c in daily_symptom_counts])
    model = _build_model()
    log_prob, state_sequence = model.decode(observations, algorithm="viterbi")

    daily_states = [STATES[s] for s in state_sequence]
    return {
        "daily_states": daily_states,
        "trend": _trend_from_labels(daily_states),
        "log_likelihood": round(float(log_prob), 3),
    }
