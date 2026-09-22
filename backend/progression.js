// progression.js
// A JavaScript port of backend/progression.py's Hidden Markov Model, so
// the "track my symptoms over time" page works standalone on GitHub
// Pages without needing the FastAPI backend running. Same 5 hidden
// states, same hand-set transition/emission probabilities, same
// Viterbi decoding — see backend/progression.py for the full design
// notes on why an HMM (rather than the tree-based /predict logic) is
// the right tool for this particular question.

const STATES = ["Healthy", "Moderate", "Sick", "Needs specialist", "Diseases"];

const START_PROB = [0.50, 0.30, 0.12, 0.05, 0.03];

const TRANS_PROB = [
  [0.65, 0.25, 0.07, 0.02, 0.01], // from Healthy
  [0.20, 0.50, 0.20, 0.07, 0.03], // from Moderate
  [0.05, 0.20, 0.45, 0.20, 0.10], // from Sick
  [0.02, 0.08, 0.20, 0.45, 0.25], // from Needs specialist
  [0.01, 0.04, 0.10, 0.25, 0.60], // from Diseases
];

const EMIT_PROB = [
  [0.65, 0.25, 0.07, 0.02, 0.01], // Healthy
  [0.20, 0.45, 0.25, 0.07, 0.03], // Moderate
  [0.05, 0.20, 0.45, 0.20, 0.10], // Sick
  [0.02, 0.08, 0.20, 0.45, 0.25], // Needs specialist
  [0.01, 0.04, 0.10, 0.25, 0.60], // Diseases
];

function bucketCount(count) {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 7) return 3;
  return 4;
}

// Standard Viterbi decoding in log-space (avoids underflow on longer sequences).
function viterbiDecode(observations) {
  const T = observations.length;
  const N = STATES.length;
  const logStart = START_PROB.map(Math.log);
  const logTrans = TRANS_PROB.map((row) => row.map(Math.log));
  const logEmit = EMIT_PROB.map((row) => row.map(Math.log));

  const dp = Array.from({ length: T }, () => new Array(N).fill(-Infinity));
  const back = Array.from({ length: T }, () => new Array(N).fill(0));

  for (let s = 0; s < N; s++) {
    dp[0][s] = logStart[s] + logEmit[s][observations[0]];
  }

  for (let t = 1; t < T; t++) {
    for (let s = 0; s < N; s++) {
      let best = -Infinity;
      let bestPrev = 0;
      for (let prev = 0; prev < N; prev++) {
        const score = dp[t - 1][prev] + logTrans[prev][s];
        if (score > best) {
          best = score;
          bestPrev = prev;
        }
      }
      dp[t][s] = best + logEmit[s][observations[t]];
      back[t][s] = bestPrev;
    }
  }

  let bestLast = 0;
  let bestLastScore = -Infinity;
  for (let s = 0; s < N; s++) {
    if (dp[T - 1][s] > bestLastScore) {
      bestLastScore = dp[T - 1][s];
      bestLast = s;
    }
  }

  const path = new Array(T);
  path[T - 1] = bestLast;
  for (let t = T - 1; t > 0; t--) {
    path[t - 1] = back[t][path[t]];
  }

  return { path, logLikelihood: bestLastScore };
}

function trendFromPath(path) {
  if (path.length < 2) return "Not enough data yet \u2014 log a couple more days.";
  const first = path[0];
  const last = path[path.length - 1];
  if (last > first) return "Worsening";
  if (last < first) return "Improving";
  return "Stable";
}

// daily_symptom_counts: array of ints, oldest day first
function inferProgression(dailySymptomCounts) {
  const observations = dailySymptomCounts.map(bucketCount);
  const { path, logLikelihood } = viterbiDecode(observations);
  const dailyStates = path.map((i) => STATES[i]);
  return {
    dailyStates,
    trend: trendFromPath(path),
    logLikelihood: Math.round(logLikelihood * 1000) / 1000,
  };
}

window.NirogProgression = { inferProgression, STATES };
