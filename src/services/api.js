import axios from "axios";
import { getStoredToken, clearStoredAuth } from "../lib/auth";
import { triggerUpgradePrompt } from "../lib/upgradePrompt";

function normalizeApiBaseUrl(rawValue) {
  const trimmed = String(rawValue || "").trim();

  if (!trimmed) {
    return "";
  }

  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

function resolveApiBaseUrl() {
  const envBase = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

  if (envBase) {
    return envBase;
  }

  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";

  const isLocalhost =
    hostname === "localhost" || hostname === "127.0.0.1";

  if (isLocalhost) {
    return "http://127.0.0.1:10000/api";
  }

  return "https://voterspheres-backend-2pap.onrender.com/api";
}

const API_BASE = resolveApiBaseUrl();

console.log("[VoterSpheres] API_BASE =", API_BASE);

const http = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 30000
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
    results: [
      {
        id: 1,
        donor_name: "Atlantic Leadership Fund",
        donor_type: "PAC",
        state: "Georgia",
        amount: 250000,
        relationship_strength: "High"
      },
      {
        id: 2,
        donor_name: "Keystone Civic Network",
        donor_type: "Individual Network",
        state: "Pennsylvania",
        amount: 175000,
        relationship_strength: "Medium"
      }
    ],
    summary: {
      total_donors: 2,
      total_amount: 425000,
      top_state: "Georgia"
    },
    _demo: true
  },
  "/consultants": {
    results: [
      {
        id: 1,
        name: "Red Tag Strategies",
        category: "General Consulting",
        state: "Louisiana",
        website: "https://example.com",
        status: "active"
      }
    ],
    _demo: true
  },
  "/consultants/states": {
    states: ["Georgia", "Louisiana", "Pennsylvania"],
    _demo: true
  },
  "/mailops/dashboard": {
    metrics: [
      { label: "Mail Drops", value: "18", delta: "4 active today", tone: "up" },
      { label: "Delivery Risk", value: "3", delta: "2 elevated", tone: "down" },
      { label: "Postal Alerts", value: "7", delta: "Live monitoring", tone: "up" },
      { label: "On-Time Rate", value: "94%", delta: "+2.1%", tone: "up" }
    ],
    drops: [
      {
        id: 1,
        campaign: "GA Senate Victory",
        location: "Atlanta NDC",
        status: "Elevated",
        in_home: "2026-10-14",
        note: "Watch weekend clearance volume"
      }
    ],
    alerts: [
      {
        id: 1,
        title: "Atlanta NDC delay pressure increasing",
        severity: "High",
        source: "MailOps",
        detail: "Projected slip risk on high-volume trays."
      }
    ],
    _demo: true
  },
  "/mailops/events": {
    results: [
      {
        id: 1,
        campaign: "GA Senate Victory",
        state: "Georgia",
        office: "Senate",
        risk: "Elevated",
        location: "Atlanta NDC",
        vendor_name: "Precision Mail Group",
        event_type: "delay_alert",
        status: "Elevated",
        severity: "High",
        event_time: "2026-10-11T10:30:00Z",
        in_home: "2026-10-14",
        note: "Tray movement slowed during weekend processing"
      }
    ],
    _demo: true
  }
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
        source: error?.config?.url || ""
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
  refreshLiveIntelligence: () => unwrap(http.post("/intelligence/refresh", {}))
};

export const billingApi = {
  config: () => unwrap(http.get("/billing/config")),
  debugMe: () => unwrap(http.get("/billing/debug/me")),
  createCheckoutSession: (payload) =>
    unwrap(http.post("/billing/checkout-session", payload)),
  createPortalSession: (payload = {}) =>
    unwrap(http.post("/billing/portal-session", payload))
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
  }
};

export const intelligenceApi = {
  summary: () => tryGet(["/intelligence/summary"]),
  dashboard: () => tryGet(["/intelligence/dashboard"]),
  forecast: () => tryGet(["/intelligence/forecast"]),
  rankings: () => tryGet(["/intelligence/rankings"]),
  map: () => tryGet(["/intelligence/map"]),
  candidateSummary: (params = {}) =>
    tryGet(["/intelligence/candidate-summary"], { params }),
  battlegrounds: () => tryGet(["/intelligence/battlegrounds"]),
  liveFundraising: () =>
    tryGet(["/intelligence/fundraising/live", "/fec/fundraising/live"]),
  fundraisingLeaderboard: () =>
    tryGet([
      "/intelligence/fundraising/leaderboard",
      "/fec/fundraising/leaderboard"
    ])
};

export const platformApi = {
  aiChat: () => tryGet(["/platform/ai-chat"]),
  postAiPrompt: (payload) => tryPost(["/platform/ai-chat"], payload),

  // 🔥 NOW WIRED TO LIVE HUB
  warRoom: async () => {
    const data = await tryGet([
      "/intelligence/feed",
      "/platform/war-room"
    ]);

    // normalize for existing UI
    return {
      feed: data?.results || data?.feed || [],
      _live: true
    };
  },

  simulator: () => tryGet(["/platform/simulator"]),

  commandCenter: async () => {
    const data = await tryGet([
      "/intelligence/command",
      "/platform/command-center"
    ]);

    return data;
  },

  consultants: async (params = {}) => {
    const data = await tryGet(
      ["/platform/consultants", "/consultants", "/marketplace/consultants"],
      { params }
    );
    return Array.isArray(data) ? { results: data } : data;
  },

  consultantStates: async () => {
    const data = await tryGet([
      "/platform/consultants/states",
      "/consultants/states",
      "/marketplace/consultants/states"
    ]);
    return normalizeListResult(data, ["states"]);
  }
};
  consultants: async (params = {}) => {
    const data = await tryGet(
      ["/platform/consultants", "/consultants", "/marketplace/consultants"],
      { params }
    );
    return Array.isArray(data) ? { results: data } : data;
  },
  consultantStates: async () => {
    const data = await tryGet([
      "/platform/consultants/states",
      "/consultants/states",
      "/marketplace/consultants/states"
    ]);
    return normalizeListResult(data, ["states"]);
  }
};

export const vendorsApi = {
  states: async () => {
    const data = await tryGet([
      "/vendors/states",
      "/platform/vendors/states",
      "/crm/vendors/states"
    ]);
    return normalizeListResult(data, ["states"]);
  },
  list: async (params = {}) => {
    const data = await tryGet(
      ["/vendors", "/platform/vendors", "/crm/vendors"],
      { params }
    );
    return Array.isArray(data) ? { results: data } : data;
  }
};

export const donorsApi = {
  network: async (params = {}) => {
    const data = await tryGet(
      ["/donors/network", "/platform/donors/network"],
      { params }
    );
    return Array.isArray(data) ? { results: data } : data;
  }
};

export const mailOpsApi = {
  dashboard: () =>
    tryGet([
      "/mailops/dashboard",
      "/platform/mailops/dashboard",
      "/mail-ops/dashboard"
    ]),
  events: (params = {}) => tryGet(["/mailops/events"], { params }),
  createEvent: (payload) => tryPost(["/mailops/events"], payload),
  updateEvent: (eventId, payload) =>
    tryPatch([`/mailops/events/${eventId}`], payload)
};

export const publicApi = {
  createEnterpriseLead: (payload) =>
    unwrap(http.post("/public/enterprise-leads", payload))
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

  billingConfig: billingApi.config,
  billingDebug: billingApi.debugMe,
  createCheckoutSession: billingApi.createCheckoutSession,
  createPortalSession: billingApi.createPortalSession,

  candidates: candidatesApi.list,
  candidateStates: candidatesApi.states,
  candidateOffices: candidatesApi.offices,
  candidateParties: candidatesApi.parties,

  intelligenceSummary: intelligenceApi.summary,
  intelligenceDashboard: intelligenceApi.dashboard,
  intelligenceForecast: intelligenceApi.forecast,
  intelligenceRankings: intelligenceApi.rankings,
  intelligenceMap: intelligenceApi.map,
  intelligenceCandidateSummary: intelligenceApi.candidateSummary,
  intelligenceBattlegrounds: intelligenceApi.battlegrounds,
  liveFundraising: intelligenceApi.liveFundraising,
  fundraisingLeaderboard: intelligenceApi.fundraisingLeaderboard,

  aiChat: platformApi.aiChat,
  postAiPrompt: platformApi.postAiPrompt,
  warRoom: platformApi.warRoom,
  simulator: platformApi.simulator,
  commandCenter: platformApi.commandCenter,
  consultants: platformApi.consultants,
  consultantStates: platformApi.consultantStates,

  vendorStates: vendorsApi.states,
  vendors: vendorsApi.list,

  donorNetwork: donorsApi.network,

  mailOpsDashboard: mailOpsApi.dashboard,
  mailOpsEvents: mailOpsApi.events,
  createMailOpsEvent: mailOpsApi.createEvent,
  updateMailOpsEvent: mailOpsApi.updateEvent,

  createEnterpriseLead: publicApi.createEnterpriseLead
};

export { API_BASE, http };
export default http;
