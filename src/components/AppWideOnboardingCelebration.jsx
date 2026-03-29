import AppWideCelebrationBanner from "./AppWideCelebrationBanner";
import { useAuth } from "../context/AuthContext";
import { useOnboardingChecklist } from "../hooks/useOnboardingChecklist";
import { normalizePlan } from "../lib/plan";

export default function AppWideOnboardingCelebration() {
  const { user, firmId, planTier, isAuthenticated } = useAuth();

  const {
    shouldShowCelebration,
    dismissCelebration,
  } = useOnboardingChecklist({
    userId: user?.id || user?.email || "user",
    firmId: firmId || "firm",
    planTier: normalizePlan(planTier || "starter"),
  });

  if (!isAuthenticated || !shouldShowCelebration) {
    return null;
  }

  return (
    <AppWideCelebrationBanner
      planTier={normalizePlan(planTier || "starter")}
      onDismiss={dismissCelebration}
    />
  );
}
