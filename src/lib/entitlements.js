export const ENTITLEMENT_BUILD = "7.0.0-unified-entitlements";

export const PLAN_LEVELS = Object.freeze({
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
});

export const PLAN_DETAILS = Object.freeze({
  free: { label: "Free", price: 0 },
  starter: { label: "Starter", price: 99 },
  pro: { label: "Professional", price: 149 },
  enterprise: { label: "Enterprise", price: 499 },
});

const PLAN_ENTITLEMENTS = Object.freeze({
  free: ["billing", "platform_tour"],
  starter: [
    "billing", "platform_tour", "dashboard", "candidate_intelligence",
    "finance_intelligence", "polling_intelligence", "political_signals",
    "narrative_intelligence", "power_rankings", "election_maps",
    "state_operations", "universal_search", "notifications", "basic_reports",
    "live_data_refresh", "team_management",
  ],
  pro: [
    "executive_intelligence", "advanced_ai", "campaign_operations", "campaign_crm",
    "war_room", "task_ownership", "vendor_network", "mailops",
    "relationship_intelligence", "narrative_response", "dark_money",
    "coalition_intelligence", "influence_intelligence", "strategy_recommendations",
    "opportunity_heatmap", "branded_reports", "report_exports",
  ],
  enterprise: [
    "enterprise_intelligence", "political_intelligence_fabric", "national_digital_twin",
    "predictive_simulation", "autonomous_operations", "national_command",
    "executive_operations_map", "business_suite", "revenue_intelligence",
    "opportunity_engine", "client_portal", "firm_administration",
    "multi_workspace_operations", "enterprise_reports",
  ],
});

const ROUTE_RULES = [
  { prefix: "/production-hardening", internal: true },
  { prefix: "/launch-qa", internal: true },
  { prefix: "/launch-readiness", internal: true },
  { prefix: "/database-stability", internal: true },
  { prefix: "/launch-assets", internal: true },
  { prefix: "/launch-data-seeder", internal: true },
  { prefix: "/launch-automation", internal: true },
  { prefix: "/admin/beta-access", internal: true },
  { prefix: "/admin/live-intelligence", internal: true },
  { prefix: "/admin/alerts", internal: true },
  { prefix: "/admin/enterprise-leads", internal: true },

  { prefix: "/political-intelligence-fabric", minimumPlan: "enterprise", entitlement: "political_intelligence_fabric" },
  { prefix: "/national-political-digital-twin", minimumPlan: "enterprise", entitlement: "national_digital_twin" },
  { prefix: "/predictive-campaign-simulation", minimumPlan: "enterprise", entitlement: "predictive_simulation" },
  { prefix: "/autonomous-campaign-operations", minimumPlan: "enterprise", entitlement: "autonomous_operations" },
  { prefix: "/national-command", minimumPlan: "enterprise", entitlement: "national_command" },
  { prefix: "/operations-map", minimumPlan: "enterprise", entitlement: "executive_operations_map" },
  { prefix: "/business-suite", minimumPlan: "enterprise", entitlement: "business_suite" },
  { prefix: "/revenue-pipeline", minimumPlan: "enterprise", entitlement: "revenue_intelligence" },
  { prefix: "/revenue-intelligence", minimumPlan: "enterprise", entitlement: "revenue_intelligence" },
  { prefix: "/opportunity-engine", minimumPlan: "enterprise", entitlement: "opportunity_engine" },
  { prefix: "/client-portal-admin", minimumPlan: "enterprise", entitlement: "client_portal" },
  { prefix: "/admin/firm-users", minimumPlan: "starter", entitlement: "team_management" },
  { prefix: "/admin/firm-invites", minimumPlan: "starter", entitlement: "team_management" },
  { prefix: "/admin/candidate-profiles", minimumPlan: "enterprise", entitlement: "firm_administration" },

  { prefix: "/executive-intelligence", minimumPlan: "pro", entitlement: "executive_intelligence" },
  { prefix: "/executive-ai-command-platform", minimumPlan: "pro", entitlement: "advanced_ai" },
  { prefix: "/executive-decision-intelligence", minimumPlan: "pro", entitlement: "executive_intelligence" },
  { prefix: "/strategy", minimumPlan: "pro", entitlement: "strategy_recommendations" },
  { prefix: "/coalitions", minimumPlan: "pro", entitlement: "coalition_intelligence" },
  { prefix: "/influence", minimumPlan: "pro", entitlement: "influence_intelligence" },
  { prefix: "/mission-control", minimumPlan: "pro", entitlement: "campaign_operations" },
  { prefix: "/political-intelligence", minimumPlan: "pro", entitlement: "relationship_intelligence" },
  { prefix: "/relationship-graph", minimumPlan: "pro", entitlement: "relationship_intelligence" },
  { prefix: "/dark-money-exposure", minimumPlan: "pro", entitlement: "dark_money" },
  { prefix: "/narrative-response", minimumPlan: "pro", entitlement: "narrative_response" },
  { prefix: "/signal-matching", minimumPlan: "pro", entitlement: "narrative_response" },
  { prefix: "/campaign-crm", minimumPlan: "pro", entitlement: "campaign_crm" },
  { prefix: "/campaign-operations-studio", minimumPlan: "pro", entitlement: "advanced_ai" },
  { prefix: "/strategic-advisor", minimumPlan: "pro", entitlement: "advanced_ai" },
  { prefix: "/war-room", minimumPlan: "pro", entitlement: "war_room" },
  { prefix: "/ai-tactical", minimumPlan: "pro", entitlement: "campaign_operations" },
  { prefix: "/command-center", minimumPlan: "pro", entitlement: "campaign_operations" },
  { prefix: "/vendors", minimumPlan: "pro", entitlement: "vendor_network" },
  { prefix: "/mailops", minimumPlan: "pro", entitlement: "mailops" },
  { prefix: "/task-ownership", minimumPlan: "pro", entitlement: "task_ownership" },
  { prefix: "/live-intelligence-layer", minimumPlan: "pro", entitlement: "campaign_operations" },
  { prefix: "/campaign-opportunity-heatmap", minimumPlan: "pro", entitlement: "opportunity_heatmap" },
  { prefix: "/report-exports", minimumPlan: "pro", entitlement: "report_exports" },

  { prefix: "/dashboard", minimumPlan: "starter", entitlement: "dashboard" },
  { prefix: "/executive-workspace", minimumPlan: "starter", entitlement: "dashboard" },
  { prefix: "/candidates", minimumPlan: "starter", entitlement: "candidate_intelligence" },
  { prefix: "/fundraising", minimumPlan: "starter", entitlement: "finance_intelligence" },
  { prefix: "/campaign-finance-intelligence", minimumPlan: "starter", entitlement: "finance_intelligence" },
  { prefix: "/donors", minimumPlan: "starter", entitlement: "finance_intelligence" },
  { prefix: "/endorsements", minimumPlan: "starter", entitlement: "candidate_intelligence" },
  { prefix: "/executive-polling-intelligence", minimumPlan: "starter", entitlement: "polling_intelligence" },
  { prefix: "/political-signals", minimumPlan: "starter", entitlement: "political_signals" },
  { prefix: "/narrative-intelligence", minimumPlan: "starter", entitlement: "narrative_intelligence" },
  { prefix: "/power-rankings", minimumPlan: "starter", entitlement: "power_rankings" },
  { prefix: "/map", minimumPlan: "starter", entitlement: "election_maps" },
  { prefix: "/state-operations", minimumPlan: "starter", entitlement: "state_operations" },
  { prefix: "/search", minimumPlan: "starter", entitlement: "universal_search" },
  { prefix: "/notifications", minimumPlan: "starter", entitlement: "notifications" },
  { prefix: "/live-data-refresh", minimumPlan: "starter", entitlement: "live_data_refresh" },
  { prefix: "/intelligence-reports", minimumPlan: "starter", entitlement: "basic_reports" },
  { prefix: "/platform-tour", minimumPlan: "free", entitlement: "platform_tour" },
  { prefix: "/billing", minimumPlan: "free", entitlement: "billing" },
];

export function normalizePlan(value = "free") {
  const plan = String(value || "free").toLowerCase().trim();
  if (["enterprise", "agency", "premium", "business"].includes(plan)) return "enterprise";
  if (["pro", "professional"].includes(plan)) return "pro";
  if (["starter", "basic"].includes(plan)) return "starter";
  return "free";
}

export function getEntitlementsForPlan(value = "free") {
  const plan = normalizePlan(value);
  const order = ["free", "starter", "pro", "enterprise"];
  const included = new Set();
  for (const key of order) {
    for (const entitlement of PLAN_ENTITLEMENTS[key] || []) included.add(entitlement);
    if (key === plan) break;
  }
  return [...included];
}

export function isPlatformAdmin(user = {}) {
  return ["platform_admin", "super_admin"].includes(String(user?.role || "").toLowerCase());
}

export function getRouteRule(pathname = "") {
  const path = String(pathname || "").split("?")[0].replace(/\/$/, "") || "/";
  return ROUTE_RULES.find((rule) => path === rule.prefix || path.startsWith(`${rule.prefix}/`)) || null;
}

export function canAccessRoute({ pathname, planTier, entitlementSet, user } = {}) {
  const rule = getRouteRule(pathname);
  if (!rule) return true;
  if (isPlatformAdmin(user)) return true;
  if (rule.internal) return false;
  const currentLevel = PLAN_LEVELS[normalizePlan(planTier)] ?? 0;
  const neededLevel = PLAN_LEVELS[normalizePlan(rule.minimumPlan)] ?? 0;
  if (currentLevel < neededLevel) return false;
  if (!rule.entitlement) return true;
  return entitlementSet instanceof Set
    ? entitlementSet.has(rule.entitlement)
    : Array.isArray(entitlementSet)
      ? entitlementSet.includes(rule.entitlement)
      : true;
}

export function filterNavigationForAccess(sections, access = {}) {
  return (sections || [])
    .map((section) => ({
      ...section,
      items: (section.items || []).filter((item) =>
        (!item.internalOnly || isPlatformAdmin(access.user)) &&
        canAccessRoute({ ...access, pathname: item.to })
      ),
    }))
    .filter((section) => section.items.length > 0);
}

export function flattenNavigation(sections) {
  return (sections || []).flatMap((section) =>
    section.items.map((item) => ({ ...item, section: section.label }))
  );
}

export function getUpgradeTarget(rule = {}) {
  return rule?.minimumPlan || (rule?.internal ? "platform_admin" : "starter");
}

export { ROUTE_RULES };

