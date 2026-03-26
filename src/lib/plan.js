export const PLAN_ORDER = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
};

export function normalizePlan(plan) {
  const value = String(plan || "free").toLowerCase().trim();

  if (["starter", "basic"].includes(value)) return "starter";
  if (["pro", "professional"].includes(value)) return "pro";
  if (["enterprise", "business"].includes(value)) return "enterprise";

  return "free";
}

export function hasPlanAccess(currentPlan, requiredPlan = "free") {
  const current = normalizePlan(currentPlan);
  const required = normalizePlan(requiredPlan);

  return (PLAN_ORDER[current] ?? 0) >= (PLAN_ORDER[required] ?? 0);
}

export function getUpgradeMessage(requiredPlan) {
  const plan = normalizePlan(requiredPlan);

  switch (plan) {
    case "starter":
      return "This feature requires a Starter plan or higher.";
    case "pro":
      return "This feature requires a Pro plan or higher.";
    case "enterprise":
      return "This feature requires an Enterprise plan.";
    default:
      return "Your current plan does not include this feature.";
  }
}
