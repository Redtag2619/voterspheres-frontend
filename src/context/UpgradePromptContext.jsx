import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UpgradeRequiredModal from "../components/UpgradeRequiredModal";
import { subscribeToUpgradePrompt } from "../lib/upgradePrompt";
import { useAuth } from "./AuthContext";

const UpgradePromptContext = createContext(null);

export function UpgradePromptProvider({ children }) {
  const navigate = useNavigate();
  const { planTier } = useAuth();

  const [modalState, setModalState] = useState({
    isOpen: false,
    requiredPlan: "starter",
    currentPlan: planTier || "free",
    message: "",
    source: "",
  });

  useEffect(() => {
    const unsubscribe = subscribeToUpgradePrompt((detail) => {
      setModalState({
        isOpen: true,
        requiredPlan: detail.requiredPlan || "starter",
        currentPlan: detail.currentPlan || planTier || "free",
        message: detail.message || "",
        source: detail.source || "",
      });
    });

    return unsubscribe;
  }, [planTier]);

  function closeModal() {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }

  function openUpgradePrompt(detail = {}) {
    setModalState({
      isOpen: true,
      requiredPlan: detail.requiredPlan || "starter",
      currentPlan: detail.currentPlan || planTier || "free",
      message: detail.message || "",
      source: detail.source || "",
    });
  }

  const value = useMemo(
    () => ({
      openUpgradePrompt,
      closeModal,
    }),
    []
  );

  return (
    <UpgradePromptContext.Provider value={value}>
      {children}

      <UpgradeRequiredModal
        isOpen={modalState.isOpen}
        requiredPlan={modalState.requiredPlan}
        currentPlan={modalState.currentPlan}
        message={modalState.message}
        source={modalState.source}
        onClose={closeModal}
        onViewPlans={() => {
          closeModal();
          navigate("/pricing");
        }}
        onGoToBilling={() => {
          closeModal();
          navigate("/billing");
        }}
      />
    </UpgradePromptContext.Provider>
  );
}

export function useUpgradePrompt() {
  const context = useContext(UpgradePromptContext);

  if (!context) {
    throw new Error("useUpgradePrompt must be used within UpgradePromptProvider");
  }

  return context;
}
