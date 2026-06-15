import axios from "axios";
import { getStoredToken, clearStoredAuth } from "../lib/auth";
import { triggerUpgradePrompt } from "../lib/upgradePrompt";

function normalizeApiBaseUrl(rawValue) {
  const trimmed = String(rawValue || "").trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

function resolveApiBaseUrl() {
  const envBase = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (envBase) return envBase;

  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  if (isLocalhost) return "http://127.0.0.1:10000/api";

  return "https://voterspheres-backend-2pap.onrender.com/api";
}

const API_BASE = resolveApiBaseUrl();

console.log("[VoterSpheres] API_BASE =", API_BASE);

function getActiveWorkspaceId() {
  try {
    return localStorage.getItem("vs_active_workspace") || "";
  } catch {
    return "";
  }
}

function setActiveWorkspaceId(workspaceId = "") {
  try {
    if (workspaceId) {
      localStorage.setItem("vs_active_workspace", String(workspaceId));
    } else {
      localStorage.removeItem("vs_active_workspace");
    }
  } catch {
    // ignore storage failures
  }
}

function shouldInjectWorkspace(config = {}) {
  const url = String(config.url || "");

  if (!url) return false;

  const excludedPrefixes = [
    "/auth",
    "/billing",
    "/public",
    "/workspaces",
    "/workspace-onboarding",
    "/scheduled-reports",
    "/firm-users",
    "/firm-invites",
    "/enterprise-leads-admin",
    "/beta-admin",
    "/candidates",
    "/consultants",
    "/campaign-crm",
    "/executive-mission-control",
    "/ai-strategic-advisor",
    "/intelligence-reports",
    "/election-war-room",
    "/ai-campaign-copilot",
    "/client-portal",
    "/report-exports",
    "/national-election-command-center",
    "/consultant-business-suite",
    "/executive-revenue",
    "/political-intelligence",
    "/notifications",
    "/executive-workspace",
    "/search",
    "/live-intelligence-layer",
    "/opportunity-engine",
    "/production-hardening",
    "/executive-kpis",
    "/launch-qa",
    "/launch-readiness",
    "/database-stability",
    "/revenue-pipeline",
    "/launch-assets",
    "/beta-onboarding",
    "/launch-data-seeder",
    "/live-data-refresh",
    "/consultant-opportunities",
  ];

  return !excludedPrefixes.some((prefix) => url.startsWith(prefix));
}

const http = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

function isDemoModeEnabled() {
  try {
    return localStorage.getItem("vs_demo_mode") === "1";
  } catch {
    return false;
  }
}

const demoFallbacks = {
  "/donors/network": {
    results: [],
    summary: { total_donors: 0, total_amount: 0, top_state: "N/A" },
    _demo: true,
  },
  "/consultants": {
    results: [],
    _demo: true,
  },
  "/consultants/states": {
    states: [],
    results: [],
    _demo: true,
  },
  "/mailops/dashboard": {
    metrics: [],
    drops: [],
    alerts: [],
    _demo: true,
  },
  "/mailops/events": {
    results: [],
    _demo: true,
  },
};

function isNotFound(error) {
  return error?.response?.status === 404;
}

function findDemoFallback(path) {
  if (!path) return null;
  const cleanPath = path.split("?")[0];
  return demoFallbacks[cleanPath] || null;
}

async function unwrap(promise) {
  const response = await promise;
  return response.data;
}

async function tryGet(paths, config = {}) {
  let lastError;

  for (const path of paths) {
    try {
      return await unwrap(http.get(path, config));
    } catch (error) {
      lastError = error;

      if (isNotFound(error) && isDemoModeEnabled()) {
        const fallback = findDemoFallback(path);
        if (fallback) return fallback;
      }

      if (!isNotFound(error)) break;
    }
  }

  throw lastError;
}

async function tryPost(paths, body = {}, config = {}) {
  let lastError;

  for (const path of paths) {
    try {
      return await unwrap(http.post(path, body, config));
    } catch (error) {
      lastError = error;
      if (!isNotFound(error)) break;
    }
  }

  throw lastError;
}

async function tryPut(paths, body = {}, config = {}) {
  let lastError;

  for (const path of paths) {
    try {
      return await unwrap(http.put(path, body, config));
    } catch (error) {
      lastError = error;
      if (!isNotFound(error)) break;
    }
  }

  throw lastError;
}

async function tryPatch(paths, body = {}, config = {}) {
  let lastError;

  for (const path of paths) {
    try {
      return await unwrap(http.patch(path, body, config));
    } catch (error) {
      lastError = error;
      if (!isNotFound(error)) break;
    }
  }

  throw lastError;
}

async function tryDelete(paths, config = {}) {
  let lastError;

  for (const path of paths) {
    try {
      return await unwrap(http.delete(path, config));
    } catch (error) {
      lastError = error;
      if (!isNotFound(error)) break;
    }
  }

  throw lastError;
}

function normalizeListResult(data, preferredKeys = []) {
  if (Array.isArray(data)) return data;

  for (const key of preferredKeys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.rows)) return data.rows;

  return [];
}

function withWorkspaceParams(params = {}) {
  const workspaceId = getActiveWorkspaceId();

  return {
    ...params,
    ...(workspaceId && !params.workspace_id ? { workspace_id: workspaceId } : {}),
  };
}

function withWorkspacePayload(payload = {}) {
  const workspaceId = getActiveWorkspaceId();

  return {
    ...payload,
    ...(workspaceId && !payload.workspace_id ? { workspace_id: workspaceId } : {}),
  };
}

function normalizeWarRoomPayload(data) {
  const feed = data?.results || data?.feed || [];

  const threats = feed.map((item) => ({
    id: item.id,
    title: item.title,
    severity: item.severity || "Medium",
    source: item.source || "Intelligence Feed",
    velocity: item.metadata?.velocity || "Live",
    recommendation:
      item.metadata?.recommendation ||
      item.metadata?.description ||
      "Review signal and assign rapid response.",
    state: item.state || "National",
    office: item.office || "N/A",
    risk: item.risk || "Monitor",
  }));

  const highThreats = threats.filter((item) =>
    ["High", "Critical"].includes(item.severity)
  ).length;

  return {
    metrics: [
      {
        label: "Active Threats",
        value: String(threats.length),
        delta: `${highThreats} high severity`,
        tone: highThreats ? "down" : "up",
      },
      {
        label: "Signal Stream",
        value: String(feed.length),
        delta: "Live intelligence feed",
        tone: "up",
      },
      {
        label: "Response Window",
        value: "Live",
        delta: "Monitor continuously",
        tone: "neutral",
      },
      {
        label: "Signal Confidence",
        value: "Live",
        delta: "Database-backed",
        tone: "up",
      },
    ],
    threats,
    queue: threats.slice(0, 6).map((item, index) => ({
      id: `queue-${item.id || index}`,
      priority: ["High", "Critical"].includes(item.severity) ? "P1" : "P2",
      owner: item.source || "War Room",
      item: item.recommendation,
      eta: index < 2 ? "Now" : "Today",
      state: item.state,
      office: item.office,
      risk: item.risk,
    })),
    signals: feed.map((item) => ({
      id: item.id,
      time: item.time || "Now",
      channel: item.source || "Live Feed",
      text: item.title,
      state: item.state || "National",
      office: item.office || "N/A",
      risk: item.risk || "Monitor",
    })),
    feed,
    _live: true,
  };
}

http.interceptors.request.use(
  (config) => {
    const token = getStoredToken?.();

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (shouldInjectWorkspace(config)) {
      const workspaceId = getActiveWorkspaceId();

      if (workspaceId) {
        config.params = config.params || {};

        if (!config.params.workspace_id) {
          config.params.workspace_id = workspaceId;
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data || {};

    if (
      status === 403 &&
      (data?.requiredPlan || data?.error === "Upgrade required")
    ) {
      triggerUpgradePrompt?.({
        requiredPlan: data.requiredPlan || "starter",
        currentPlan: data.currentPlan || "free",
        message:
          data.message || "Your current plan does not include this feature.",
        source: error?.config?.url || "",
      });
    }

    const requestUrl = error?.config?.url || "";
    const isAuthEndpoint =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/signup") ||
      requestUrl.includes("/auth/me");

    if (status === 401 && isAuthEndpoint) {
      clearStoredAuth?.();
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  signup: (payload) => unwrap(http.post("/auth/signup", payload)),
  login: (payload) => unwrap(http.post("/auth/login", payload)),
  me: () => unwrap(http.get("/auth/me")),
  forgotPassword: (payload) => unwrap(http.post("/auth/forgot-password", payload)),
  resetPassword: (payload) => unwrap(http.post("/auth/reset-password", payload)),
  liveIntelligenceStatus: () => unwrap(http.get("/intelligence/status")),
  refreshLiveIntelligence: () => unwrap(http.post("/intelligence/refresh", {})),
};

export const workspacesApi = {
  list: () => tryGet(["/workspaces"]),
  default: () => tryGet(["/workspaces/active/default"]),
  get: (id) => tryGet([`/workspaces/${id}`]),
  create: (payload) => tryPost(["/workspaces"], payload),
  update: (id, payload) => tryPatch([`/workspaces/${id}`], payload),
  getActiveWorkspaceId,
  setActiveWorkspaceId,
};

export const workspaceReportsApi = {
  list: (workspaceId) => tryGet([`/workspaces/${workspaceId}/reports`]),
  create: (workspaceId, payload) =>
    tryPost([`/workspaces/${workspaceId}/reports`], payload),
  delete: (workspaceId, reportId) =>
    tryDelete([`/workspaces/${workspaceId}/reports/${reportId}`]),
  clear: (workspaceId) => tryDelete([`/workspaces/${workspaceId}/reports`]),
  send: (workspaceId, reportId, payload) =>
    tryPost([`/workspaces/${workspaceId}/reports/${reportId}/send`], payload),
};

export const workspaceOnboardingApi = {
  getChecklist: (workspaceId) =>
    tryGet([`/workspace-onboarding/${workspaceId}/onboarding-checklist`]),

  getActivity: (workspaceId, params = {}) =>
    tryGet([`/workspace-onboarding/${workspaceId}/onboarding-activity`], {
      params,
    }),

  updateChecklistItem: (workspaceId, itemId, payload) =>
    tryPut(
      [`/workspace-onboarding/${workspaceId}/onboarding-checklist/${itemId}`],
      payload
    ),

  resetChecklist: (workspaceId) =>
    tryDelete([`/workspace-onboarding/${workspaceId}/onboarding-checklist`]),
};

export const scheduledReportsApi = {
  listByWorkspace: (workspaceId) =>
    tryGet([`/scheduled-reports/workspace/${workspaceId}`]),

  create: (workspaceId, payload) =>
    tryPost([`/scheduled-reports/workspace/${workspaceId}`], payload),

  update: (scheduleId, payload) =>
    tryPatch([`/scheduled-reports/${scheduleId}`], payload),

  runNow: (scheduleId) =>
    tryPost([`/scheduled-reports/${scheduleId}/run-now`], {}),

  runDue: (payload = { limit: 10 }) =>
    tryPost(["/scheduled-reports/run-due"], payload),

  delete: (scheduleId) => tryDelete([`/scheduled-reports/${scheduleId}`]),
};

export const workspaceContactsApi = {
  list: (workspaceId) => tryGet([`/workspace-contacts/${workspaceId}`]),

  create: (workspaceId, payload) =>
    tryPost([`/workspace-contacts/${workspaceId}`], payload),

  update: (workspaceId, contactId, payload) =>
    tryPatch([`/workspace-contacts/${workspaceId}/${contactId}`], payload),

  delete: (workspaceId, contactId) =>
    tryDelete([`/workspace-contacts/${workspaceId}/${contactId}`]),
};

export const billingApi = {
  config: () => unwrap(http.get("/billing/config")),
  debugMe: () => unwrap(http.get("/billing/debug/me")),
  createCheckoutSession: (payload) =>
    unwrap(http.post("/billing/checkout-session", payload)),
  createPortalSession: (payload = {}) =>
    unwrap(http.post("/billing/portal-session", payload)),
};

export const candidatesApi = {
  list: async (params = {}) => {
    const data = await tryGet(["/candidates"], {
      params: withWorkspaceParams(params),
    });
    return Array.isArray(data) ? data : data;
  },

  states: async () => {
    const data = await tryGet(["/candidates/states"]);
    return normalizeListResult(data, ["states"]);
  },

  offices: async () => {
    const data = await tryGet(["/candidates/offices"]);
    return normalizeListResult(data, ["offices"]);
  },

  parties: async () => {
    const data = await tryGet(["/candidates/parties"]);
    return normalizeListResult(data, ["parties"]);
  },

  detail: (id) => tryGet([`/candidates/${id}`]),

  contacts: (id) => tryGet([`/candidates/${id}/contacts`]),

    contactCoverage: (params = {}) =>
    tryGet(["/candidates/contact-coverage"], { params }),

  enrichmentStatus: (params = {}) =>
    tryGet(["/candidates/enrichment-status", "/candidates/contact-coverage"], {
      params,
    }),

  syncFecCommitteeContacts: (payload = { limit: 500 }) =>
    tryPost(["/candidates/sync-fec-committee-contacts"], payload),
  
  enrichProfile: (id) =>
    tryPost(
      [`/candidates/${id}/refresh-profile`, `/candidates/${id}/enrich-profile`],
      {}
    ),

  manualProfile: (id, payload) =>
    tryPost([`/candidates/${id}/manual-profile`], payload),

  updateProfileLocks: (id, payload) =>
    tryPatch([`/candidates/${id}/profile-locks`], payload),

  updateVerification: (id, payload) =>
    tryPatch([`/candidates/${id}/verification`], payload),

  refreshProfiles: (payload = { limit: 100 }) =>
    tryPost(["/candidates/refresh-profiles"], payload),

  scoring: (params = {}) =>
    tryGet(["/candidates/intelligence/scoring"], {
      params: withWorkspaceParams(params),
    }),

  dispatchIntelligenceAlerts: (payload = {}) =>
    tryPost(
      ["/candidates/intelligence/dispatch-alerts"],
      withWorkspacePayload(payload)
    ),
};

export const intelligenceApi = {
  status: () => tryGet(["/intelligence/status"]),
  refresh: () => tryPost(["/intelligence/refresh"], {}),
  summary: () => tryGet(["/intelligence/summary"]),
  dashboard: () => tryGet(["/intelligence/dashboard"]),
  forecast: () => tryGet(["/intelligence/forecast"]),
  rankings: () => tryGet(["/intelligence/rankings"]),
  map: () => tryGet(["/intelligence/map"]),
  feed: (params = {}) =>
    tryGet(["/intelligence/feed"], { params: withWorkspaceParams(params) }),
  command: () => tryGet(["/intelligence/command", "/platform/command-center"]),
  candidateSummary: (params = {}) =>
    tryGet(["/intelligence/candidate-summary"], {
      params: withWorkspaceParams(params),
    }),
  battlegrounds: () => tryGet(["/intelligence/battlegrounds"]),
  liveFundraising: () =>
    tryGet(["/intelligence/fundraising/live", "/fec/fundraising/live"]),
  fundraisingLeaderboard: () =>
    tryGet([
      "/intelligence/fundraising/leaderboard",
      "/fec/fundraising/leaderboard",
    ]),

  crossSignal: () => tryGet(["/intelligence/cross-signal"]),
  dispatchCrossSignalAlerts: () =>
    tryPost(["/intelligence/cross-signal/dispatch-alerts"], {}),
};

export const platformApi = {
  aiChat: () => tryGet(["/platform/ai-chat"]),
  postAiPrompt: (payload) =>
    tryPost(["/platform/ai-chat"], withWorkspacePayload(payload)),

  warRoom: async () => {
    const data = await tryGet(["/intelligence/feed", "/platform/war-room"]);
    return normalizeWarRoomPayload(data);
  },

  simulator: () => tryGet(["/platform/simulator"]),

  commandCenter: async () => {
    return tryGet(["/intelligence/command", "/platform/command-center"]);
  },

  consultants: async (params = {}) => {
    const data = await tryGet(
      ["/consultants", "/platform/consultants", "/marketplace/consultants"],
      { params }
    );
    return Array.isArray(data) ? { results: data } : data;
  },

  consultantStates: async () => {
    const data = await tryGet([
      "/consultants/states",
      "/platform/consultants/states",
      "/marketplace/consultants/states",
    ]);
    return normalizeListResult(data, ["states"]);
  },
};

export const vendorsApi = {
  states: async () => {
    const data = await tryGet([
      "/vendors/states",
      "/platform/vendors/states",
      "/crm/vendors/states",
    ]);
    return normalizeListResult(data, ["states", "results"]);
  },

  categories: async () => {
    const data = await tryGet(["/vendors/dropdowns/categories"]);
    return normalizeListResult(data, ["results", "categories"]);
  },

  statuses: async () => {
    const data = await tryGet(["/vendors/dropdowns/statuses"]);
    return normalizeListResult(data, ["results", "statuses"]);
  },

  list: async (params = {}) => {
    const data = await tryGet(
      ["/vendors", "/platform/vendors", "/crm/vendors"],
      { params: withWorkspaceParams(params) }
    );
    return Array.isArray(data) ? { results: data } : data;
  },

  scoring: () => tryGet(["/vendors/intelligence/scoring"]),

  performance: (params = {}) =>
    tryGet(["/vendor-performance"], {
      params: withWorkspaceParams(params),
    }),

  dispatchAlerts: () =>
    tryPost(["/vendors/intelligence/dispatch-alerts"], {}),
};

export const donorsApi = {
  network: async (params = {}) => {
    const data = await tryGet(
      ["/donors/network", "/platform/donors/network"],
      { params: withWorkspaceParams(params) }
    );
    return Array.isArray(data) ? { results: data } : data;
  },
};

export const mailOpsApi = {
  dashboard: () =>
    tryGet([
      "/mailops/dashboard",
      "/platform/mailops/dashboard",
      "/mail-ops/dashboard",
    ]),
  events: (params = {}) =>
    tryGet(["/mailops/events"], { params: withWorkspaceParams(params) }),
  createEvent: (payload) =>
    tryPost(["/mailops/events"], withWorkspacePayload(payload)),
  updateEvent: (eventId, payload) =>
    tryPatch([`/mailops/events/${eventId}`], withWorkspacePayload(payload)),
  options: () => tryGet(["/mailops/options"]),
};

export const alertsApi = {
  list: () => tryGet(["/alerts"]),
  rebuild: () => tryPost(["/alerts/rebuild"], {}),
  rules: () => tryGet(["/alerts/rules"]),
  deliveries: (params = {}) =>
    tryGet(["/alerts/deliveries"], { params: withWorkspaceParams(params) }),
  dispatch: (payload = { limit: 25 }) =>
    tryPost(["/alerts/dispatch"], withWorkspacePayload(payload)),
  updateRule: (ruleId, payload) =>
    tryPut([`/alerts/rules/${ruleId}`], payload),
};

export const realtimeApi = {
  status: () => tryGet(["/realtime/status"]),
};

export const enterpriseLeadsApi = {
  create: (payload) => tryPost(["/enterprise-leads"], payload),

  list: (params = {}) =>
    tryGet(["/enterprise-leads/admin"], {
      params,
    }),

  get: (leadId) => tryGet([`/enterprise-leads/admin/${leadId}`]),

  update: (leadId, payload) =>
    tryPatch([`/enterprise-leads/admin/${leadId}`], payload),

  addNote: (leadId, payload) =>
    tryPost([`/enterprise-leads/admin/${leadId}/notes`], payload),

  provisionWorkspace: (leadId) =>
    tryPost([`/enterprise-leads/admin/${leadId}/provision-workspace`], {}),

  delete: (leadId) => tryDelete([`/enterprise-leads/admin/${leadId}`]),
};

export const consultantOpportunityApi = {
  list: (params = {}) =>
    tryGet(["/consultant-opportunities"], {
      params: withWorkspaceParams(params),
    }),

  summary: (params = {}) =>
    tryGet(["/consultant-opportunities/summary"], {
      params: withWorkspaceParams(params),
    }),

  score: (payload = {}) =>
    tryPost(
      ["/consultant-opportunities/score"],
      withWorkspacePayload(payload)
    ),

  detail: (candidateId) =>
    tryGet([`/consultant-opportunities/${candidateId}`]),

  heatmap: (params = {}) =>
    tryGet(["/consultant-opportunities/heatmap"], {
      params: withWorkspaceParams(params),
    }),
};

export const consultantDeepIntelApi = {
  profile: (id, params = {}) =>
    tryGet([`/consultants/deep-intel/profile/${id}`], { params }),
};

export const consultantContactEnrichmentApi = {
  status: () => tryGet(["/consultants/contact-enrichment/status"]),
  needsEnrichment: (params = {}) =>
    tryGet(["/consultants/contact-enrichment/needs-enrichment"], { params }),
  run: (payload = {}) =>
    tryPost(["/consultants/contact-enrichment/run"], payload),
  enrichOne: (id, payload = {}) =>
    tryPost([`/consultants/contact-enrichment/${id}`], payload),
  history: (id) =>
    tryGet([`/consultants/contact-enrichment/${id}/history`]),
};


export const relationshipGraphApi = {
  graph: (params = {}) =>
    tryGet(["/relationships/graph"], {
      params: withWorkspaceParams(params),
    }),
};

export const darkMoneyExposureApi = {
  dashboard: (params = {}) =>
    tryGet(["/dark-money-exposure"], {
      params: withWorkspaceParams(params),
    }),
  profile: (id, params = {}) =>
    tryGet([`/dark-money-exposure/profile/${id}`], { params }),
};

export const executiveAlertsApi = {
  list: (params = {}) =>
    tryGet(["/executive-alerts"], {
      params: withWorkspaceParams(params),
    }),
};

export const publicApi = {
  createEnterpriseLead: (payload) =>
    unwrap(http.post("/public/enterprise-leads", payload)),
};

export const operationsMapApi = {
  dashboard: (params = {}) =>
    tryGet(["/operations-map"], {
      params: withWorkspaceParams(params),
    }),
};

export const tasksApi = {
  list: (params = {}) =>
    tryGet(["/tasks"], {
      params: withWorkspaceParams(params),
    }),

  create: (payload) => tryPost(["/tasks"], withWorkspacePayload(payload)),

  update: (taskId, payload) =>
    tryPatch([`/tasks/${taskId}`], withWorkspacePayload(payload)),

  comments: (taskId) => tryGet([`/tasks/${taskId}/comments`]),

  addComment: (taskId, payload) =>
    tryPost([`/tasks/${taskId}/comments`], withWorkspacePayload(payload)),

  activity: (taskId) => tryGet([`/tasks/${taskId}/activity`]),

  timeline: (taskId) => tryGet([`/tasks/${taskId}/timeline`]),

  feedState: (ids) =>
    tryGet(["/tasks/feed-state"], {
      params: withWorkspaceParams({ ids }),
    }),
};

export const api = {
  get: (...args) => http.get(...args),
  post: (...args) => http.post(...args),
  put: (...args) => http.put(...args),
  patch: (...args) => http.patch(...args),
  delete: (...args) => http.delete(...args),

  signup: authApi.signup,
  login: authApi.login,
  me: authApi.me,
  forgotPassword: authApi.forgotPassword,
  resetPassword: authApi.resetPassword,

  liveIntelligenceStatus: authApi.liveIntelligenceStatus,
  refreshLiveIntelligence: authApi.refreshLiveIntelligence,

  workspaces: workspacesApi.list,
  defaultWorkspace: workspacesApi.default,
  getWorkspace: workspacesApi.get,
  createWorkspace: workspacesApi.create,
  updateWorkspace: workspacesApi.update,
  getActiveWorkspaceId: workspacesApi.getActiveWorkspaceId,
  setActiveWorkspaceId: workspacesApi.setActiveWorkspaceId,

  workspaceReports: workspaceReportsApi.list,
  createWorkspaceReport: workspaceReportsApi.create,
  deleteWorkspaceReport: workspaceReportsApi.delete,
  clearWorkspaceReports: workspaceReportsApi.clear,
  sendWorkspaceReport: workspaceReportsApi.send,

  workspaceReportSchedules: scheduledReportsApi.listByWorkspace,
  createWorkspaceReportSchedule: scheduledReportsApi.create,
  updateWorkspaceReportSchedule: scheduledReportsApi.update,
  runWorkspaceReportSchedule: scheduledReportsApi.runNow,
  runDueWorkspaceReportSchedules: scheduledReportsApi.runDue,
  deleteWorkspaceReportSchedule: scheduledReportsApi.delete,

  workspaceClientContacts: workspaceContactsApi.list,
  createWorkspaceClientContact: workspaceContactsApi.create,
  updateWorkspaceClientContact: workspaceContactsApi.update,
  deleteWorkspaceClientContact: workspaceContactsApi.delete,

  billingConfig: billingApi.config,
  billingDebug: billingApi.debugMe,
  createCheckoutSession: billingApi.createCheckoutSession,
  createPortalSession: billingApi.createPortalSession,

  candidates: candidatesApi.list,
  candidateStates: candidatesApi.states,
  candidateOffices: candidatesApi.offices,
  candidateParties: candidatesApi.parties,
  candidateDetail: candidatesApi.detail,
  candidateContacts: candidatesApi.contacts,
  candidateContactCoverage: candidatesApi.contactCoverage,
  candidateEnrichmentStatus: candidatesApi.enrichmentStatus,
  syncFecCommitteeContacts: candidatesApi.syncFecCommitteeContacts,
  enrichCandidateProfile: candidatesApi.enrichProfile,
  manualCandidateProfile: candidatesApi.manualProfile,
  updateCandidateProfileLocks: candidatesApi.updateProfileLocks,
  updateCandidateVerification: candidatesApi.updateVerification,
  refreshCandidateProfiles: candidatesApi.refreshProfiles,
  candidateScoring: candidatesApi.scoring,
  dispatchCandidateIntelligenceAlerts: candidatesApi.dispatchIntelligenceAlerts,

  intelligenceStatus: intelligenceApi.status,
  intelligenceRefresh: intelligenceApi.refresh,
  intelligenceSummary: intelligenceApi.summary,
  intelligenceDashboard: intelligenceApi.dashboard,
  intelligenceForecast: intelligenceApi.forecast,
  intelligenceRankings: intelligenceApi.rankings,
  intelligenceMap: intelligenceApi.map,
  intelligenceFeed: intelligenceApi.feed,
  intelligenceCommand: intelligenceApi.command,
  intelligenceCandidateSummary: intelligenceApi.candidateSummary,
  intelligenceBattlegrounds: intelligenceApi.battlegrounds,
  liveFundraising: intelligenceApi.liveFundraising,
  fundraisingLeaderboard: intelligenceApi.fundraisingLeaderboard,
  
  crossSignalIntelligence: intelligenceApi.crossSignal,
  dispatchCrossSignalAlerts: intelligenceApi.dispatchCrossSignalAlerts,

  aiChat: platformApi.aiChat,
  postAiPrompt: platformApi.postAiPrompt,
  warRoom: platformApi.warRoom,
  simulator: platformApi.simulator,
  commandCenter: platformApi.commandCenter,
  consultants: platformApi.consultants,
  consultantStates: platformApi.consultantStates,

  consultantOpportunities: consultantOpportunityApi.list,
  consultantOpportunitySummary: consultantOpportunityApi.summary,
  scoreConsultantOpportunities: consultantOpportunityApi.score,
  consultantOpportunityDetail: consultantOpportunityApi.detail,

  consultantContactStatus: consultantContactEnrichmentApi.status,
  consultantContactsNeedingEnrichment: consultantContactEnrichmentApi.needsEnrichment,
  runConsultantContactEnrichment: consultantContactEnrichmentApi.run,
  enrichConsultantContact: consultantContactEnrichmentApi.enrichOne,
  consultantContactHistory: consultantContactEnrichmentApi.history,

  vendorStates: vendorsApi.states,
  vendorCategories: vendorsApi.categories,
  vendorStatuses: vendorsApi.statuses,
  vendors: vendorsApi.list,
  vendorScoring: vendorsApi.scoring,
  vendorPerformance: vendorsApi.performance,
  dispatchVendorAlerts: vendorsApi.dispatchAlerts,
  vendorPerformance: vendorsApi.performance,

  donorNetwork: donorsApi.network,

  mailOpsDashboard: mailOpsApi.dashboard,
  mailOpsEvents: mailOpsApi.events,
  mailOpsOptions: mailOpsApi.options,
  createMailOpsEvent: mailOpsApi.createEvent,
  updateMailOpsEvent: mailOpsApi.updateEvent,

  tasks: tasksApi.list,
  createTask: tasksApi.create,
  updateTask: tasksApi.update,
  taskComments: tasksApi.comments,
  addTaskComment: tasksApi.addComment,
  taskActivity: tasksApi.activity,
  taskTimeline: tasksApi.timeline,
  feedTaskState: tasksApi.feedState,

  createEnterpriseLeadAdmin: enterpriseLeadsApi.create,
  enterpriseLeads: enterpriseLeadsApi.list,
  enterpriseLead: enterpriseLeadsApi.get,
  updateEnterpriseLead: enterpriseLeadsApi.update,
  addEnterpriseLeadNote: enterpriseLeadsApi.addNote,
  provisionEnterpriseLeadWorkspace: enterpriseLeadsApi.provisionWorkspace,
  deleteEnterpriseLead: enterpriseLeadsApi.delete,

  alerts: alertsApi.list,
  rebuildAlerts: alertsApi.rebuild,
  alertRules: alertsApi.rules,
  alertDeliveries: alertsApi.deliveries,
  dispatchAlerts: alertsApi.dispatch,
  updateAlertRule: alertsApi.updateRule,

  workspaceOnboardingChecklist: workspaceOnboardingApi.getChecklist,
  workspaceOnboardingActivity: workspaceOnboardingApi.getActivity,
  updateWorkspaceOnboardingChecklistItem: workspaceOnboardingApi.updateChecklistItem,
  resetWorkspaceOnboardingChecklist: workspaceOnboardingApi.resetChecklist,  
  campaignOpportunityHeatmap: consultantOpportunityApi.heatmap,

  realtimeStatus: realtimeApi.status,
  
  relationshipGraph: relationshipGraphApi.graph,
  
  darkMoneyExposure: darkMoneyExposureApi.dashboard,
  darkMoneyExposureProfile: darkMoneyExposureApi.profile,
  
  executiveAlerts: executiveAlertsApi.list,
  
  operationsMap: operationsMapApi.dashboard,

  stateOperationsIndex: () =>
    tryGet(["/operations/states"]),

  stateOperationsDrilldown: (state) =>
    tryGet([`/operations/state/${state}`]),

  createCountyCommandTask: (payload) =>
    tryPost(["/operations/tasks/county"], payload),

  updateCountyCommandTaskStatus: (id, payload) =>
    tryPut([`/operations/tasks/county/${id}/status`], payload),

  campaignWorkspaces: () =>
    tryGet(["/workspaces"]),

  campaignWorkspace: (id) =>
    tryGet([`/workspaces/${id}`]),

  createCampaignWorkspace: (payload) =>
    tryPost(["/workspaces"], payload),

  updateCampaignWorkspace: (id, payload) =>
    tryPut([`/workspaces/${id}`], payload),

  addCampaignWorkspaceMember: (id, payload) =>
    tryPost([`/workspaces/${id}/members`], payload),

 addCampaignWorkspaceTarget: (id, payload) =>
    tryPost([`/workspaces/${id}/targets`], payload),

  workspaceIntelligence: (id) =>
    tryGet([`/workspaces/${id}/intelligence`]),
  
  aiTacticalDashboard: () =>
    tryGet(["/ai-tactical/dashboard"]),

  aiTacticalWorkspace: (id) =>
    tryGet([`/ai-tactical/workspace/${id}`]),
  
  createAiTacticalTask: (payload) =>
    tryPost(["/ai-tactical/actions/task"], payload),

  workspaces: () =>
    workspacesApi.list(),

  getWorkspace: (id) =>
    workspacesApi.get(id),

  createWorkspace: (payload) =>
    workspacesApi.create(payload),

  updateWorkspace: (id, payload) =>
    workspacesApi.update(id, payload),
  
  crossWorkspaceExecutiveOverview: () =>
    tryGet(["/workspace-intelligence/executive-overview"]),  
  
  workspaceOperatingRoom: (id) =>
    tryGet([`/workspace-operating-room/${id}`]),

  emitWorkspacePulse: (id, payload = {}) =>
    tryPost([`/workspace-operating-room/${id}/pulse`], payload),

  politicalSignalsDashboard: () =>
    tryGet(["/political-signals/dashboard"]),

  politicalSignalsByWorkspace: (id) =>
    tryGet([`/political-signals/workspace/${id}`]),

  politicalSignalsByState: (state) =>
    tryGet([`/political-signals/state/${state}`]),

  createPoliticalSignal: (payload) =>
    tryPost(["/political-signals"], payload),
  
  signalWorkspaceMatchingDashboard: () =>
    tryGet(["/signal-workspace-matching/dashboard"]),

  runSignalWorkspaceMatching: (payload = {}) =>
    tryPost(["/signal-workspace-matching/run"], payload),

  narrativeRapidResponseDashboard: () =>
    tryGet(["/narrative-rapid-response/dashboard"]),

  createNarrativeRapidResponse: (payload = {}) =>
    tryPost(["/narrative-rapid-response"], payload),

  updateNarrativeRapidResponse: (id, payload = {}) =>
    tryPut([`/narrative-rapid-response/${id}`], payload),

  workspaceSignalFeed: (workspaceId) =>
    tryGet([`/workspace-signal-feed/${workspaceId}`]),

  newsNarrativeDashboard: () =>
    tryGet(["/news-narrative/dashboard"]),

  ingestNewsNarrative: (payload = {}) =>
    tryPost(["/news-narrative/ingest"], payload),

  taskOwnershipDashboard: () =>
    tryGet(["/task-ownership/dashboard"]),

  taskOwners: () =>
    tryGet(["/task-ownership/owners"]),

  updateTaskOwnership: (taskId, payload = {}) =>
    tryPut([`/task-ownership/tasks/${taskId}`], payload),

  executiveMapSignalOverlay: () =>
    tryGet(["/executive-map-signal-overlay"]),

  campaignCrmDashboard: (workspaceId) =>
    tryGet([
      workspaceId
        ? `/campaign-crm/dashboard?workspace_id=${encodeURIComponent(workspaceId)}`
        : "/campaign-crm/dashboard",
    ]),

  createCampaignCrmContact: (payload = {}) =>
    tryPost(["/campaign-crm/contacts"], payload),

  createCampaignCrmActivity: (payload = {}) =>
    tryPost(["/campaign-crm/activities"], payload),
  
  executiveMissionControl: () =>
    tryGet(["/executive-mission-control/dashboard"]),

  completeCampaignCrmActivity: (id) =>
    tryPut([`/campaign-crm/activities/${id}/complete`], {}),
 
  aiStrategicAdvisor: () =>
    tryGet(["/ai-strategic-advisor/dashboard"]),

  intelligenceReports: () =>
    tryGet(["/intelligence-reports"]),

  generateIntelligenceReport: (payload = {}) =>
    tryPost(["/intelligence-reports/generate"], payload),

  intelligenceReport: (id) =>
    tryGet([`/intelligence-reports/${id}`]),

  deleteIntelligenceReport: (id) =>
    tryDelete([`/intelligence-reports/${id}`]),

  electionWarRoom: () =>
    tryGet(["/election-war-room/dashboard"]),

  aiCampaignCopilotThreads: () =>
    tryGet(["/ai-campaign-copilot/threads"]),

  aiCampaignCopilotThread: (id) =>
    tryGet([`/ai-campaign-copilot/threads/${id}`]),

  askAiCampaignCopilot: (payload = {}) =>
    tryPost(["/ai-campaign-copilot/ask"], payload),

  clientPortalClients: () =>
    tryGet(["/client-portal/admin/clients"]),

  createClientPortalClient: (payload = {}) =>
    tryPost(["/client-portal/admin/clients"], payload),

  updateClientPortalClient: (id, payload = {}) =>
    tryPut([`/client-portal/admin/clients/${id}`], payload),

  revokeClientPortalClient: (id) =>
    tryPut([`/client-portal/admin/clients/${id}/revoke`], {}),

  clientPortalPublic: (token) =>
    tryGet([`/client-portal/public/${token}`]),

  reportExports: () =>
    tryGet(["/report-exports"]),

  generateReportExport: (payload = {}) =>
    tryPost(["/report-exports/generate"], payload),

  reportExport: (id) =>
    tryGet([`/report-exports/${id}`]),

  deleteReportExport: (id) =>
    tryDelete([`/report-exports/${id}`]),

  nationalElectionCommandCenter: () =>
    tryGet(["/national-election-command-center/dashboard"]),

  consultantBusinessSuite: () =>
    tryGet(["/consultant-business-suite/dashboard"]),

  createConsultantClient: (payload = {}) =>
    tryPost(["/consultant-business-suite/clients"], payload),

  createConsultantProject: (payload = {}) =>
    tryPost(["/consultant-business-suite/projects"], payload),

  createConsultantInvoice: (payload = {}) =>
    tryPost(["/consultant-business-suite/invoices"], payload),

  createConsultantTimeEntry: (payload = {}) =>
    tryPost(["/consultant-business-suite/time"], payload),

  executiveRevenueIntelligence: () =>
    tryGet(["/executive-revenue/dashboard"]),

  politicalIntelligenceGraph: (params = {}) =>
    tryGet([
      `/political-intelligence/graph?${new URLSearchParams(
         Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
     ).toString()}`
   ]),

  notificationCenter: (params = {}) =>
  tryGet([
    `/notifications?${new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
    ).toString()}`
  ]),

  createNotification: (payload = {}) =>
    tryPost(["/notifications"], payload),

  markNotificationRead: (id) =>
    tryPut([`/notifications/${id}/read`], {}),

  archiveNotification: (id) =>
    tryPut([`/notifications/${id}/archive`], {}),

  executiveWorkspaceDashboard: (workspaceId) =>
    tryGet([
    workspaceId
      ? `/executive-workspace/dashboard?workspace_id=${encodeURIComponent(workspaceId)}`
      : "/executive-workspace/dashboard"
  ]),

  executiveWorkspaces: () =>
    tryGet(["/executive-workspace/workspaces"]),

  universalSearch: (params = {}) =>
    tryGet([
      `/search?${new URLSearchParams(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
     ).toString()}`
  ]),

  liveIntelligenceLayer: () =>
    tryGet(["/live-intelligence-layer"]),
  
  opportunityEngine: (params = {}) =>
    tryGet([
      `/opportunity-engine?${new URLSearchParams(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
      ).toString()}`
   ]),

  createOpportunityCrmContact: (payload = {}) =>
    api.post("/opportunity-engine/crm-contact", payload).then((res) => res.data),

  createOpportunityTask: (payload = {}) =>
    api.post("/opportunity-engine/task", payload).then((res) => res.data),

  productionHardening: () =>
    tryGet(["/production-hardening"]), 

  executiveKpis: () =>
    tryGet(["/executive-kpi"]),

  launchQa: () =>
    tryGet(["/launch-qa"]),

  launchReadiness: () =>
    tryGet(["/launch-readiness"]),

  databaseStability: () =>
    tryGet(["/database-stability"]),

  revenuePipeline: (params = {}) =>
    tryGet([
      `/revenue-pipeline?${new URLSearchParams(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
      ).toString()}`
    ]),

  createRevenueDeal: (payload = {}) =>
    api.post("/revenue-pipeline", payload).then((res) => res.data),

  updateRevenueDeal: (id, payload = {}) =>
    api.put(`/revenue-pipeline/${id}`, payload).then((res) => res.data),

  advanceRevenueDeal: (id, stage) =>
    api.post(`/revenue-pipeline/${id}/advance`, { stage }).then((res) => res.data),

  deleteRevenueDeal: (id) =>
    api.delete(`/revenue-pipeline/${id}`).then((res) => res.data),

  createRevenueDealFromOpportunity: (payload = {}) =>
    api.post("/revenue-pipeline/from-opportunity", payload).then((res) => res.data),

  launchAssets: (params = {}) =>
    tryGet([
      `/launch-assets?${new URLSearchParams(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
      ).toString()}`
    ]),

  saveLaunchAsset: (payload = {}) =>
    api.post("/launch-assets", payload).then((res) => res.data),

  updateLaunchAssetStatus: (id, status) =>
    api.post(`/launch-assets/${id}/status`, { status }).then((res) => res.data),

  deleteLaunchAsset: (id) =>
    api.delete(`/launch-assets/${id}`).then((res) => res.data),

  betaOnboarding: (params = {}) =>
    tryGet([
      `/beta-onboarding?${new URLSearchParams(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
      ).toString()}`
    ]),

  saveBetaCustomer: (payload = {}) =>
    api.post("/beta-onboarding", payload).then((res) => res.data),

  updateBetaCustomerStage: (id, stage) =>
    api.post(`/beta-onboarding/${id}/stage`, { stage }).then((res) => res.data),

  deleteBetaCustomer: (id) =>
    api.delete(`/beta-onboarding/${id}`).then((res) => res.data),

  launchDataSeeder: () =>
    tryGet(["/launch-data-seeder"]),

  runLaunchDataSeeder: () =>
    api.post("/launch-data-seeder/run", {}).then((res) => res.data),

  liveDataRefresh: () =>
    tryGet(["/live-data-refresh"]),

  runLiveDataRefresh: () =>
    api.post("/live-data-refresh/run", {}).then((res) => res.data),

  workspaceActivity: () =>
    tryGet(["/workspace-activity"]),
  
  launchAutomation: () =>
    tryGet(["/launch-automation"]),

  refreshLaunchAutomation: () =>
    tryPost(["/launch-automation/refresh"], {}),

  export
  API_BASE,
  http,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  withWorkspaceParams,
  withWorkspacePayload,
};

export default http;
