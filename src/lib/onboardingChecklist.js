const STORAGE_PREFIX = "voterspheres_onboarding_checklist";
const CELEBRATION_PREFIX = "voterspheres_onboarding_celebration";

function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function getChecklistStorageKey({ userId, firmId }) {
  return `${STORAGE_PREFIX}:${userId || "anon"}:${firmId || "nofirm"}`;
}

export function getCelebrationStorageKey({ userId, firmId }) {
  return `${CELEBRATION_PREFIX}:${userId || "anon"}:${firmId || "nofirm"}`;
}

export function getDefaultChecklist(planTier = "starter") {
  const plan = String(planTier || "starter").toLowerCase();

  const common = [
    {
      id: "visit_dashboard",
      title: "Open your dashboard",
      description: "Get oriented and confirm your workspace is live.",
      route: "/",
      ctaLabel: "Open Dashboard",
      requiredPlan: "free",
    },
    {
      id: "review_billing",
      title: "Review billing and sync",
      description: "Check your plan status, webhook sync, and billing details.",
      route: "/billing",
      ctaLabel: "Open Billing",
      requiredPlan: "free",
    },
    {
      id: "browse_candidates",
      title: "Browse candidate data",
      description: "Explore the data foundation inside VoterSpheres.",
      route: "/candidates",
      ctaLabel: "Open Candidates",
      requiredPlan: "free",
    },
  ];

  if (plan === "starter") {
    return [
      ...common,
      {
        id: "open_pipeline",
        title: "Start your campaign pipeline",
        description: "Set up your campaign workflow and begin organizing operations.",
        route: "/campaign-pipeline",
        ctaLabel: "Open Pipeline",
        requiredPlan: "starter",
      },
      {
        id: "open_firm_workspace",
        title: "Open firm workspace",
        description: "Review your firm setup and working environment.",
        route: "/firm-workspace",
        ctaLabel: "Open Firm Workspace",
        requiredPlan: "starter",
      },
    ];
  }

  if (plan === "pro") {
    return [
      ...common,
      {
        id: "open_forecast",
        title: "Open forecasting",
        description: "Start using your Pro intelligence layer immediately.",
        route: "/forecast",
        ctaLabel: "Open Forecast",
        requiredPlan: "pro",
      },
      {
        id: "open_rankings",
        title: "Review rankings",
        description: "Check race rankings and signal movement.",
        route: "/rankings",
        ctaLabel: "Open Rankings",
        requiredPlan: "pro",
      },
      {
        id: "open_command_center",
        title: "Launch command center",
        description: "Use your higher-tier operational view.",
        route: "/command-center",
        ctaLabel: "Open Command Center",
        requiredPlan: "pro",
      },
    ];
  }

  return [
    ...common,
    {
      id: "open_fundraising",
      title: "Open fundraising intelligence",
      description: "Use enterprise-level fundraising data right away.",
      route: "/fundraising",
      ctaLabel: "Open Fundraising",
      requiredPlan: "enterprise",
    },
    {
      id: "open_mailops",
      title: "Open MailOps",
      description: "Jump into your highest-value operations workflow.",
      route: "/mailops",
      ctaLabel: "Open MailOps",
      requiredPlan: "enterprise",
    },
    {
      id: "open_executive_dashboard",
      title: "Open executive dashboard",
      description: "Review top-level intelligence and organizational visibility.",
      route: "/executive-dashboard",
      ctaLabel: "Open Executive Dashboard",
      requiredPlan: "enterprise",
    },
  ];
}

export function loadChecklistState({ userId, firmId, planTier }) {
  if (typeof window === "undefined") {
    return {
      items: getDefaultChecklist(planTier).map((item) => ({
        ...item,
        completed: false,
        completedAt: null,
      })),
    };
  }

  const key = getChecklistStorageKey({ userId, firmId });
  const raw = localStorage.getItem(key);

  if (!raw) {
    return {
      items: getDefaultChecklist(planTier).map((item) => ({
        ...item,
        completed: false,
        completedAt: null,
      })),
    };
  }

  const parsed = safeParse(raw, { items: [] });
  const defaults = getDefaultChecklist(planTier);

  const merged = defaults.map((defaultItem) => {
    const existing = (parsed.items || []).find((item) => item.id === defaultItem.id);

    return {
      ...defaultItem,
      completed: Boolean(existing?.completed),
      completedAt: existing?.completedAt || null,
    };
  });

  return { items: merged };
}

export function saveChecklistState({ userId, firmId, items }) {
  if (typeof window === "undefined") return;

  const key = getChecklistStorageKey({ userId, firmId });
  localStorage.setItem(key, JSON.stringify({ items }));
}

export function getChecklistProgress(items = []) {
  const total = items.length;
  const completed = items.filter((item) => item.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { total, completed, percent };
}

export function getChecklistIdsForPath(pathname = "") {
  const normalized = String(pathname || "").toLowerCase();

  const routeMap = [
    { route: "/", ids: ["visit_dashboard"] },
    { route: "/billing", ids: ["review_billing"] },
    { route: "/candidates", ids: ["browse_candidates"] },
    { route: "/campaign-pipeline", ids: ["open_pipeline"] },
    { route: "/firm-workspace", ids: ["open_firm_workspace"] },
    { route: "/forecast", ids: ["open_forecast"] },
    { route: "/rankings", ids: ["open_rankings"] },
    { route: "/command-center", ids: ["open_command_center"] },
    { route: "/fundraising", ids: ["open_fundraising"] },
    { route: "/mailops", ids: ["open_mailops"] },
    { route: "/executive-dashboard", ids: ["open_executive_dashboard"] },
  ];

  const exact = routeMap.find((item) => item.route === normalized);
  return exact ? exact.ids : [];
}

export function loadCelebrationState({ userId, firmId }) {
  if (typeof window === "undefined") {
    return {
      lastShownAt: null,
      dismissed: false,
      completedOnce: false,
    };
  }

  const key = getCelebrationStorageKey({ userId, firmId });
  const raw = localStorage.getItem(key);

  if (!raw) {
    return {
      lastShownAt: null,
      dismissed: false,
      completedOnce: false,
    };
  }

  return safeParse(raw, {
    lastShownAt: null,
    dismissed: false,
    completedOnce: false,
  });
}

export function saveCelebrationState({ userId, firmId, state }) {
  if (typeof window === "undefined") return;

  const key = getCelebrationStorageKey({ userId, firmId });
  localStorage.setItem(key, JSON.stringify(state));
}
