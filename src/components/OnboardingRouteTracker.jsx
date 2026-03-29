import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useOnboardingChecklist } from "../hooks/useOnboardingChecklist";
import { getChecklistIdsForPath } from "../lib/onboardingChecklist";
import { normalizePlan } from "../lib/plan";

export default function OnboardingRouteTracker() {
  const location = useLocation();
  const { user, firmId, planTier, isAuthenticated } = useAuth();

  const { markManyComplete } = useOnboardingChecklist({
    userId: user?.id || user?.email || "user",
    firmId: firmId || "firm",
    planTier: normalizePlan(planTier || "starter"),
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    const itemIds = getChecklistIdsForPath(location.pathname);
    if (itemIds.length > 0) {
      markManyComplete(itemIds);
    }
  }, [location.pathname, isAuthenticated, markManyComplete]);

  return null;
}
