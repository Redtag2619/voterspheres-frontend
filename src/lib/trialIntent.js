const STORAGE_KEY = "voterspheres_trial_intent";

export function saveTrialIntent(intent = {}) {
  const payload = {
    selectedPlan: intent.selectedPlan || "",
    trialDays: Number(intent.trialDays || 7),
    source: intent.source || "",
    createdAt: Date.now(),
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function getTrialIntent() {
  const raw = sessionStorage.getItem(STORAGE_KEY);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);

    return {
      selectedPlan: parsed.selectedPlan || "",
      trialDays: Number(parsed.trialDays || 7),
      source: parsed.source || "",
      createdAt: parsed.createdAt || null,
    };
  } catch {
    return null;
  }
}

export function clearTrialIntent() {
  sessionStorage.removeItem(STORAGE_KEY);
}
