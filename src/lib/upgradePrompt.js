const UPGRADE_EVENT = "voterspheres:upgrade-required";

export function triggerUpgradePrompt(detail = {}) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(UPGRADE_EVENT, {
      detail: {
        requiredPlan: detail.requiredPlan || "starter",
        currentPlan: detail.currentPlan || "free",
        message:
          detail.message || "Your current plan does not include this feature.",
        source: detail.source || "",
      },
    })
  );
}

export function subscribeToUpgradePrompt(handler) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = (event) => {
    handler(event.detail || {});
  };

  window.addEventListener(UPGRADE_EVENT, listener);

  return () => {
    window.removeEventListener(UPGRADE_EVENT, listener);
  };
}
