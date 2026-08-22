import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import UpgradeGate from "./UpgradeGate.jsx";
import { getRouteRule, getUpgradeTarget } from "../lib/entitlements.js";

export default function EntitlementRouteGuard({ children }) {
  const location = useLocation();
  const { loading, canAccessRoute, planTier } = useAuth();

  if (loading) return children;
  if (canAccessRoute(location.pathname)) return children;

  const rule = getRouteRule(location.pathname) || {};

  if (rule.internal) {
    return (
      <UpgradeGate
        title="Platform administration only"
        featureName="This internal VoterSpheres operating page"
        requiredPlan="platform_admin"
        currentPlan={planTier}
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

