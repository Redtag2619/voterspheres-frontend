import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ChecklistToast from "./ChecklistToast";
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

  const [toast, setToast] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const itemIds = getChecklistIdsForPath(location.pathname);
    if (itemIds.length === 0) return;

    const changedItems = markManyComplete(itemIds);

    if (changedItems.length > 0) {
      const first = changedItems[0];

      setToast({
        isOpen: true,
        title: "Checklist updated",
        message: `"${first.title}" was marked complete.`,
      });

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setToast((prev) => ({
          ...prev,
          isOpen: false,
        }));
      }, 3200);
    }
  }, [location.pathname, isAuthenticated, markManyComplete]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <ChecklistToast
      isOpen={toast.isOpen}
      title={toast.title}
      message={toast.message}
      onClose={() =>
        setToast((prev) => ({
          ...prev,
          isOpen: false,
        }))
      }
    />
  );
}
