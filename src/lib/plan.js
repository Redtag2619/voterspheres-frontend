export const PLAN_LEVELS = {
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

export function hasPlan(userPlan, requiredPlan = "starter") {
  const current = PLAN_LEVELS[normalizePlan(userPlan)] ?? 0;
  const needed = PLAN_LEVELS[normalizePlan(requiredPlan)] ?? 0;
  return current >= needed;
}

export function hasPlanAccess(userPlan, requiredPlan = "starter") {
  return hasPlan(userPlan, requiredPlan);
}

export function getPlanLabel(plan) {
  return normalizePlan(plan).toUpperCase();
}

export function getUpgradeCopy(requiredPlan) {
  const plan = normalizePlan(requiredPlan);

  if (plan === "starter") {
    return "Upgrade to Starter to unlock this feature.";
  }

  if (plan === "pro") {
    return "Upgrade to Pro to unlock forecasting, alerts, and advanced campaign intelligence.";
  }

  if (plan === "enterprise") {
    return "Upgrade to Enterprise to unlock fundraising intelligence, MailOps, and enterprise workflows.";
  }

  return "Upgrade your plan to unlock this feature.";
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
