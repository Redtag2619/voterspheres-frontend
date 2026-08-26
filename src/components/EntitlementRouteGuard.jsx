import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import UpgradeGate from "./UpgradeGate.jsx";
import { getRouteRule, getUpgradeTarget } from "../lib/entitlements.js";

export default function EntitlementRouteGuard({ children }) {
  const location = useLocation();
  const {
    loading,
    canAccessRoute,
    planTier,
    isAdministrator,
  } = useAuth();

  if (loading) return children;
  if (canAccessRoute(location.pathname)) return children;

  const rule = getRouteRule(location.pathname) || {};

  if (rule.internal || rule.administratorOnly) {
    return (
      <UpgradeGate
        title="Administrator access required"
        featureName="This preserved VoterSpheres administration page"
        requiredPlan="administrator"
        currentPlan={isAdministrator ? "administrator" : planTier}
      />
    );
  }

  return (
    <UpgradeGate
      title="Upgrade to unlock this operating page"
      featureName={rule.entitlement || "This capability"}
      requiredPlan={getUpgradeTarget(rule)}
      currentPlan={planTier}
    />
  );
}

