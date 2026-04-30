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
    const data = await tryGet(["/candidates"], { params });
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

  enrichProfile: (id) =>
    tryPost([`/candidates/${id}/refresh-profile`, `/candidates/${id}/enrich-profile`], {}),

  manualProfile: (id, payload) =>
    tryPost([`/candidates/${id}/manual-profile`], payload),

  refreshProfiles: (payload = { limit: 100 }) =>
    tryPost(["/candidates/refresh-profiles"], payload),

  scoring: (params = {}) =>
    tryGet(["/candidates/intelligence/scoring"], { params }),

  dispatchIntelligenceAlerts: (payload = {}) =>
    tryPost(["/candidates/intelligence/dispatch-alerts"], payload),
};

export const intelligenceApi = {
  status: () => tryGet(["/intelligence/status"]),
  refresh: () => tryPost(["/intelligence/refresh"], {}),
  summary: () => tryGet(["/intelligence/summary"]),
  dashboard: () => tryGet(["/intelligence/dashboard"]),
  forecast: () => tryGet(["/intelligence/forecast"]),
  rankings: () => tryGet(["/intelligence/rankings"]),
  map: () => tryGet(["/intelligence/map"]),
  feed: (params = {}) => tryGet(["/intelligence/feed"], { params }),
  command: () => tryGet(["/intelligence/command"]),
  candidateSummary: (params = {}) =>
    tryGet(["/intelligence/candidate-summary"], { params }),
  battlegrounds: () => tryGet(["/intelligence/battlegrounds"]),
  liveFundraising: () =>
    tryGet(["/intelligence/fundraising/live", "/fec/fundraising/live"]),
  fundraisingLeaderboard: () =>
    tryGet([
      "/intelligence/fundraising/leaderboard",
      "/fec/fundraising/leaderboard",
    ]),

  // Cross-signal intelligence engine
  crossSignal: () => tryGet(["/intelligence/cross-signal"]),
  dispatchCrossSignalAlerts: () =>
    tryPost(["/intelligence/cross-signal/dispatch-alerts"], {}),
};

export const platformApi = {
  aiChat: () => tryGet(["/platform/ai-chat"]),
  postAiPrompt: (payload) => tryPost(["/platform/ai-chat"], payload),

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
      { params }
    );
    return Array.isArray(data) ? { results: data } : data;
  },

  scoring: () => tryGet(["/vendors/intelligence/scoring"]),

  dispatchAlerts: () =>
    tryPost(["/vendors/intelligence/dispatch-alerts"], {}),
};

export const donorsApi = {
  network: async (params = {}) => {
    const data = await tryGet(
      ["/donors/network", "/platform/donors/network"],
      { params }
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
  events: (params = {}) => tryGet(["/mailops/events"], { params }),
  createEvent: (payload) => tryPost(["/mailops/events"], payload),
  updateEvent: (eventId, payload) =>
    tryPatch([`/mailops/events/${eventId}`], payload),
};

export const alertsApi = {
  list: () => tryGet(["/alerts"]),
  rebuild: () => tryPost(["/alerts/rebuild"], {}),
  rules: () => tryGet(["/alerts/rules"]),
  deliveries: (params = {}) => tryGet(["/alerts/deliveries"], { params }),
  dispatch: (payload = { limit: 25 }) => tryPost(["/alerts/dispatch"], payload),
  updateRule: (ruleId, payload) => tryPut([`/alerts/rules/${ruleId}`], payload),
};

export const realtimeApi = {
  status: () => tryGet(["/realtime/status"]),
};

export const publicApi = {
  createEnterpriseLead: (payload) =>
    unwrap(http.post("/public/enterprise-leads", payload)),
};

export const tasksApi = {
  list: (params = {}) => tryGet(["/tasks"], { params }),
  create: (payload) => tryPost(["/tasks"], payload),
  update: (taskId, payload) => tryPatch([`/tasks/${taskId}`], payload),
  comments: (taskId) => tryGet([`/tasks/${taskId}/comments`]),
  addComment: (taskId, payload) => tryPost([`/tasks/${taskId}/comments`], payload),
  activity: (taskId) => tryGet([`/tasks/${taskId}/activity`]),
  timeline: (taskId) => tryGet([`/tasks/${taskId}/timeline`])
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
  enrichCandidateProfile: candidatesApi.enrichProfile,
  manualCandidateProfile: candidatesApi.manualProfile,
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

  vendorStates: vendorsApi.states,
  vendorCategories: vendorsApi.categories,
  vendorStatuses: vendorsApi.statuses,
  vendors: vendorsApi.list,
  vendorScoring: vendorsApi.scoring,
  dispatchVendorAlerts: vendorsApi.dispatchAlerts,

  donorNetwork: donorsApi.network,

  mailOpsDashboard: mailOpsApi.dashboard,
  mailOpsEvents: mailOpsApi.events,
  createMailOpsEvent: mailOpsApi.createEvent,
  updateMailOpsEvent: mailOpsApi.updateEvent,
  
  tasks: tasksApi.list,
  createTask: tasksApi.create,
  updateTask: tasksApi.update,
  taskComments: tasksApi.comments,
  addTaskComment: tasksApi.addComment,
  taskActivity: tasksApi.activity,
  taskTimeline: tasksApi.timeline,

  alerts: alertsApi.list,
  rebuildAlerts: alertsApi.rebuild,
  alertRules: alertsApi.rules,
  alertDeliveries: alertsApi.deliveries,
  dispatchAlerts: alertsApi.dispatch,
  updateAlertRule: alertsApi.updateRule,

  realtimeStatus: realtimeApi.status,

  createEnterpriseLead: publicApi.createEnterpriseLead,
};

export { API_BASE, http };
export default http;





